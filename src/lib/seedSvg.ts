export function seedSvg(name: string, fill: string, ear: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#F4F6F5"/>
  <circle cx="160" cy="176" r="92" fill="${fill}"/>
  <ellipse cx="108" cy="92" rx="28" ry="40" fill="${ear}"/>
  <ellipse cx="212" cy="92" rx="28" ry="40" fill="${ear}"/>
  <circle cx="132" cy="168" r="10" fill="#1F2A24"/>
  <circle cx="188" cy="168" r="10" fill="#1F2A24"/>
  <ellipse cx="160" cy="198" rx="16" ry="10" fill="#E23D2B"/>
  <text x="160" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#1F2A24">${name}</text>
</svg>`;
}
