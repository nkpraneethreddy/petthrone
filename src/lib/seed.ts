import type { AppState } from "./types";

export const SEED_STATE: AppState = {
  visitors: 0,
  visitorsToday: 0,
  visitsDay: new Date().toISOString().slice(0, 10),
  presence: {},
  users: [],
  pets: [],
  bids: [],
  events: [],
};
