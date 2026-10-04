import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { SEED_STATE } from "./seed";
import type { AppState, Bid, CountryBoardState, CountryRankedPet, CourtState, FeedEvent, Pet, RankedPet, User } from "./types";
import { MAX_BID_CENTS, MIN_BID_CENTS, nextThroneCents } from "./money";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();
let memory: AppState | null = null;
let diskChain: Promise<void> = Promise.resolve();
let diskTimer: ReturnType<typeof setTimeout> | null = null;

function normalizePets(pets: Pet[]): Pet[] {
  return pets.map((p) => {
    const rawPhotos = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos : [p.photoUrl || "/seed/bean.svg"];
    return {
      ...p,
      clicks: p.clicks ?? 0,
      photos: rawPhotos,
      photoUrl: rawPhotos[0] || p.photoUrl || "/seed/bean.svg",
      ownerName: p.ownerName?.trim() || "Owner",
      country: p.country?.trim() || "Unknown",
      ownerPhotoUrl: p.ownerPhotoUrl || null,
    };
  });
}

async function readState(): Promise<AppState> {
  if (memory) return memory;
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AppState;
    parsed.visitors ??= SEED_STATE.visitors;
    parsed.visitorsToday ??= 0;
    parsed.visitsDay ??= todayKey();
    parsed.presence ??= {};
    parsed.pets = normalizePets(parsed.pets || []);
    memory = parsed;
    return memory;
  } catch (err) {
    // Only seed a genuinely missing store. A store that exists but failed to
    // parse is a problem to surface, not to silently overwrite with seed data.
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw new Error(
        `Refusing to overwrite unreadable ${STORE_PATH}. Restore or remove it, then restart.`,
        { cause: err },
      );
    }
    await mkdir(DATA_DIR, { recursive: true });
    memory = structuredClone(SEED_STATE);
    await writeFile(STORE_PATH, JSON.stringify(memory), "utf8");
    return memory;
  }
}

// The debounced write would otherwise be lost when a host restarts the process.
if (!process.env.NEXT_PHASE) {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      if (memory) void persist(memory);
    });
  }
}

// Write to a sibling file and rename over the target so a crash mid-write
// can never leave a half-written store.json behind.
function persist(state: AppState) {
  const payload = JSON.stringify(state);
  diskChain = diskChain
    .then(async () => {
      await mkdir(DATA_DIR, { recursive: true });
      const tmp = `${STORE_PATH}.${process.pid}.tmp`;
      await writeFile(tmp, payload, "utf8");
      await rename(tmp, STORE_PATH);
    })
    .catch((err) => {
      console.error("[store] failed to persist state", err);
    });
  return diskChain;
}

async function writeState(state: AppState) {
  memory = state;
  if (diskTimer) {
    clearTimeout(diskTimer);
    diskTimer = null;
  }
  await persist(state);
}

function writeStateSoon(state: AppState) {
  memory = state;
  if (diskTimer) return;
  diskTimer = setTimeout(() => {
    diskTimer = null;
    if (memory) void persist(memory);
  }, 1500);
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function totals(state: AppState) {
  const map = new Map<string, number>();
  for (const bid of state.bids) {
    map.set(bid.petId, (map.get(bid.petId) ?? 0) + bid.amountCents);
  }
  return map;
}

function ranked(state: AppState): RankedPet[] {
  const t = totals(state);
  return [...state.pets]
    .map((pet) => ({
      ...pet,
      totalCents: t.get(pet.id) ?? 0,
      rank: 0,
    }))
    .filter((pet) => pet.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents || a.createdAt.localeCompare(b.createdAt))
    .map((pet, i) => ({ ...pet, rank: i + 1 }));
}

export function toCourt(state: AppState): CourtState {
  const board = ranked(state);
  const king = board[0] ?? null;
  return {
    king,
    court: board.slice(0, 10),
    challengers: board.slice(10),
    treasuryCents: state.bids.reduce((sum, b) => sum + b.amountCents, 0),
    nextThroneCents: nextThroneCents(king?.totalCents),
    lastBidAt: state.bids.at(-1)?.createdAt ?? null,
    events: [...state.events].reverse().slice(0, 24),
    visitors: state.visitors,
    visitorsToday: state.visitorsToday ?? 0,
    online: onlineCount(state),
    petCount: state.pets.length,
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function onlineCount(state: AppState) {
  const cutoff = Date.now() - 90_000;
  return Object.values(state.presence || {}).filter((at) => at > cutoff).length;
}

export async function getCourt(): Promise<CourtState> {
  return toCourt(await readState());
}

export async function getCountryBoard(country?: string): Promise<CountryBoardState> {
  const state = await readState();
  const allRanked = ranked(state);

  const countryCounts = new Map<string, number>();
  for (const pet of allRanked) {
    if (pet.country) {
      const c = pet.country.trim();
      countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
    }
  }

  const availableCountries = Array.from(countryCounts.entries())
    .map(([c, count]) => ({ country: c, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));

  const targetCountry = country?.trim() || availableCountries[0]?.country || "United States";

  const matchingPets = allRanked.filter(
    (p) => p.country.trim().toLowerCase() === targetCountry.toLowerCase(),
  );

  const countryPets: CountryRankedPet[] = matchingPets
    .slice(0, 10)
    .map((p, idx) => ({
      ...p,
      countryRank: idx + 1,
    }));

  return {
    country: targetCountry,
    pets: countryPets,
    totalPets: matchingPets.length,
    availableCountries,
  };
}

export async function getPet(id: string) {
  const state = await readState();
  const pet = state.pets.find((p) => p.id === id);
  if (!pet) return null;
  return ranked(state).find((p) => p.id === id) ?? { ...pet, rank: 0, totalCents: 0 };
}

export async function getUserPet(userId: string) {
  const state = await readState();
  const pet = state.pets.find((p) => p.userId === userId);
  if (!pet) return null;
  return ranked(state).find((p) => p.id === pet.id) ?? { ...pet, rank: 0, totalCents: 0 };
}

export async function getUser(id: string) {
  const state = await readState();
  return state.users.find((u) => u.id === id) ?? null;
}

export async function upsertUser(email: string): Promise<User> {
  return enqueue(async () => {
    const state = await readState();
    const existing = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;
    const user: User = { id: randomUUID(), email: email.toLowerCase() };
    state.users.push(user);
    await writeState(state);
    return user;
  });
}

export async function savePet(input: {
  userId: string;
  name: string;
  boast: string;
  photoUrl?: string;
  photos?: string[];
  ownerName?: string;
  country?: string;
  ownerPhotoUrl?: string | null;
}): Promise<Pet> {
  return enqueue(async () => {
    const state = await readState();
    const existing = state.pets.find((p) => p.userId === input.userId);
    const photos =
      input.photos && input.photos.length > 0
        ? input.photos
        : input.photoUrl
          ? [input.photoUrl]
          : existing?.photos || ["/seed/bean.svg"];
    const primary = photos[0] || "/seed/bean.svg";
    const ownerName = (input.ownerName ?? existing?.ownerName ?? "Owner").trim() || "Owner";
    const country = (input.country ?? existing?.country ?? "Unknown").trim() || "Unknown";
    const ownerPhotoUrl =
      input.ownerPhotoUrl !== undefined
        ? input.ownerPhotoUrl
        : existing?.ownerPhotoUrl ?? null;

    if (existing) {
      existing.name = input.name.trim();
      existing.boast = input.boast.trim();
      existing.photos = photos;
      existing.photoUrl = primary;
      existing.ownerName = ownerName;
      existing.country = country;
      existing.ownerPhotoUrl = ownerPhotoUrl;
      await writeState(state);
      return existing;
    }
    const pet: Pet = {
      id: randomUUID(),
      userId: input.userId,
      name: input.name.trim(),
      boast: input.boast.trim(),
      photoUrl: primary,
      photos,
      ownerName,
      country,
      ownerPhotoUrl,
      createdAt: new Date().toISOString(),
      crownedAt: null,
      clicks: 0,
    };
    state.pets.push(pet);
    await writeState(state);
    return pet;
  });
}

export async function applyBid(input: {
  userId: string;
  amountCents: number;
  stripeSessionId?: string | null;
  petId?: string;
  kind?: "bid" | "boost";
}): Promise<{ court: CourtState; dethroned: boolean; petId: string }> {
  return enqueue(async () => {
    if (input.amountCents < MIN_BID_CENTS || input.amountCents > MAX_BID_CENTS) {
      throw new Error(`Bid must be between $${MIN_BID_CENTS / 100} and $${MAX_BID_CENTS / 100}.`);
    }
    if (input.amountCents % 100 !== 0) {
      throw new Error("Bids are whole dollars.");
    }
    const state = await readState();
    if (input.stripeSessionId && state.bids.some((b) => b.stripeSessionId === input.stripeSessionId)) {
      const pet = state.pets.find((p) => p.id === input.petId || p.userId === input.userId);
      return { court: toCourt(state), dethroned: false, petId: pet?.id ?? "" };
    }
    const pet = input.petId
      ? state.pets.find((p) => p.id === input.petId)
      : state.pets.find((p) => p.userId === input.userId);
    if (!pet) throw new Error(input.kind === "boost" ? "That pet is gone." : "Post your pet before you bid.");

    const board = ranked(state);
    const king = board[0] ?? null;
    const current = board.find((p) => p.id === pet.id);
    const newTotal = (current?.totalCents ?? 0) + input.amountCents;
    const takingThrone =
      !king || (pet.id !== king.id && newTotal >= nextThroneCents(king.totalCents));

    const bid: Bid = {
      id: randomUUID(),
      petId: pet.id,
      userId: input.userId,
      amountCents: input.amountCents,
      stripeSessionId: input.stripeSessionId ?? null,
      createdAt: new Date().toISOString(),
    };
    state.bids.push(bid);

    const isBoost = input.kind === "boost";
    const feed: FeedEvent = {
      id: randomUUID(),
      kind: takingThrone ? (king ? "dethrone" : "crown") : isBoost ? "boost" : "bid",
      actorPetId: pet.id,
      victimPetId: takingThrone && king ? king.id : null,
      actorName: pet.name,
      victimName: takingThrone && king ? king.name : null,
      amountCents: takingThrone ? newTotal : input.amountCents,
      createdAt: bid.createdAt,
    };
    state.events.push(feed);

    if (takingThrone) {
      for (const p of state.pets) {
        p.crownedAt = p.id === pet.id ? bid.createdAt : null;
      }
    }

    await writeState(state);
    return { court: toCourt(state), dethroned: takingThrone && Boolean(king), petId: pet.id };
  });
}

export async function bumpVisitors(sessionId?: string, first = false) {
  return enqueue(async () => {
    const state = await readState();
    const now = Date.now();
    const cutoff = now - 90_000;
    const day = todayKey();

    if (state.visitsDay !== day) {
      state.visitsDay = day;
      state.visitorsToday = 0;
    }

    const nextPresence: Record<string, number> = {};
    for (const [id, at] of Object.entries(state.presence || {})) {
      if (at > cutoff) nextPresence[id] = at;
    }
    if (sessionId) nextPresence[sessionId] = now;
    state.presence = nextPresence;

    if (first || !sessionId) {
      state.visitors += 1;
      state.visitorsToday += 1;
    }

    writeStateSoon(state);
    return {
      visitors: state.visitors,
      visitorsToday: state.visitorsToday,
      online: onlineCount(state),
    };
  });
}

export async function bumpClicks(petId: string) {
  return enqueue(async () => {
    const state = await readState();
    const pet = state.pets.find((p) => p.id === petId);
    if (pet) {
      pet.clicks += 1;
      writeStateSoon(state);
    }
    return pet?.clicks ?? 0;
  });
}
