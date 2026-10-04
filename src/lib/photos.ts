export function sizedPhoto(url: string | null | undefined, width: number) {
  if (!url) return "/seed/bean.svg";
  if (!url.includes("images.unsplash.com")) return url;
  if (/[?&]w=\d+/.test(url)) return url.replace(/w=\d+/, `w=${width}`);
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}auto=format&fit=crop&w=${width}&q=70`;
}
