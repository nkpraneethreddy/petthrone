export const MIN_AGE = 18;
export const MAX_PET_NAME = 32;
export const MAX_OWNER_NAME = 80;
export const MAX_BOAST = 160;

export function acceptedLegal(form: FormData) {
  const value = String(form.get("acceptedLegal") ?? "").trim();
  return value === "1" || value === "true" || value === "on";
}

export function validateListing(input: {
  name: string;
  ownerName?: string;
  country?: string;
  boast?: string;
  requireOwner?: boolean;
}) {
  if (!input.name || input.name.length > MAX_PET_NAME) {
    return `Pet name is required and must be ${MAX_PET_NAME} characters or fewer.`;
  }
  if (input.requireOwner && !input.ownerName) {
    return "Owner name is required.";
  }
  if (input.ownerName && input.ownerName.length > MAX_OWNER_NAME) {
    return `Owner name must be ${MAX_OWNER_NAME} characters or fewer.`;
  }
  if (input.requireOwner && !input.country) {
    return "Country is required.";
  }
  if (input.boast && input.boast.length > MAX_BOAST) {
    return `Boast must be ${MAX_BOAST} characters or fewer.`;
  }
  return null;
}
