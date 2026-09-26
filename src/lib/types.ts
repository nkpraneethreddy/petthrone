export type Pet = {
  id: string;
  userId: string;
  name: string;
  boast: string;
  photoUrl: string;
  photos: string[];
  ownerName: string;
  country: string;
  ownerPhotoUrl: string | null;
  createdAt: string;
  crownedAt: string | null;
  clicks: number;
};

export type Bid = {
  id: string;
  petId: string;
  userId: string;
  amountCents: number;
  stripeSessionId: string | null;
  createdAt: string;
};

export type FeedEvent = {
  id: string;
  kind: "dethrone" | "bid" | "crown" | "boost";
  actorPetId: string;
  victimPetId: string | null;
  actorName: string;
  victimName: string | null;
  amountCents: number;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
};

export type RankedPet = Pet & {
  rank: number;
  totalCents: number;
};

export type CourtState = {
  king: RankedPet | null;
  court: RankedPet[];
  challengers: RankedPet[];
  treasuryCents: number;
  nextThroneCents: number;
  lastBidAt: string | null;
  events: FeedEvent[];
  visitors: number;
  visitorsToday: number;
  online: number;
  petCount: number;
};

export type AppState = {
  users: User[];
  pets: Pet[];
  bids: Bid[];
  events: FeedEvent[];
  visitors: number;
  visitorsToday: number;
  visitsDay: string;
  presence: Record<string, number>;
};

export type MeState = {
  user: User | null;
  pet: RankedPet | Pet | null;
};
