export const MIN_BID_CENTS = 300;
export const MAX_BID_CENTS = 1_000_000;
export const RANK_BUMP_CENTS = 100;

export function dollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function nextThroneCents(kingTotalCents: number | null | undefined) {
  if (!kingTotalCents) return MIN_BID_CENTS;
  return kingTotalCents + RANK_BUMP_CENTS;
}

/** Outbid-style: claim this row by paying $1 more than whoever sits there. */
export function claimCentsForRank(
  rank: number,
  board: { totalCents: number }[],
) {
  const occupant = board[rank - 1];
  if (!occupant) return MIN_BID_CENTS;
  return occupant.totalCents + RANK_BUMP_CENTS;
}

export function chargeCents(desiredTotal: number, currentTotal: number) {
  return Math.max(MIN_BID_CENTS, desiredTotal - currentTotal);
}

export function projectedRank(
  newTotalCents: number,
  board: { id: string; totalCents: number }[],
  petId?: string,
) {
  const others = board.filter((p) => p.id !== petId);
  return others.filter((p) => p.totalCents >= newTotalCents).length + 1;
}
