export function OwnerLine({
  ownerName,
  country,
  ownerPhotoUrl,
  size = "sm",
}: {
  ownerName?: string | null;
  country?: string | null;
  ownerPhotoUrl?: string | null;
  size?: "sm" | "md";
}) {
  if (!ownerName && !country) return null;
  const dim = size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";
  const initial = (ownerName || "?").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2 text-xs text-mute">
      {ownerPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ownerPhotoUrl} alt="" className={`${dim} rounded-full object-cover`} />
      ) : (
        <span className={`inline-flex ${dim} items-center justify-center rounded-full bg-paper font-bold text-ink`}>
          {initial}
        </span>
      )}
      <span>
        {ownerName}
        {ownerName && country ? " · " : ""}
        {country}
      </span>
    </div>
  );
}
