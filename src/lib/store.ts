import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { SEED_STATE } from "./seed";
import type { AppState, Bid, CourtState, FeedEvent, Pet, RankedPet, User } from "./types";
import { MIN_BID_CENTS, nextThroneCents } from "./money";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();

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
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AppState;
    parsed.visitors ??= SEED_STATE.visitors;
    parsed.visitorsToday ??= 0;
    parsed.visitsDay ??= todayKey();
    parsed.presence ??= {};
    parsed.pets = normalizePets(parsed.pets || []);
    return parsed;
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(SEED_STATE, null, 2), "utf8");
    return structuredClone(SEED_STATE);
  }
}

async function writeState(state: AppState) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
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
    if (input.amountCents < MIN_BID_CENTS) {
      throw new Error(`Minimum bid is $${MIN_BID_CENTS / 100}.`);
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

    await writeState(state);
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
      await writeState(state);
    }
    return pet?.clicks ?? 0;
  });
}
