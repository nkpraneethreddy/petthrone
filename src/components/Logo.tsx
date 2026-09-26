export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="11" fill="#0F8F6B" />
      <path
        d="M18 5.4c.28 0 .5.16.6.4l.7 1.72h1.82c.4 0 .58.5.28.76L19.9 9.7l.64 1.86c.14.4-.32.72-.68.48L18 11.1l-1.86.94c-.36.24-.82-.08-.68-.48l.64-1.86-1.5-1.42c-.3-.26-.12-.76.28-.76h1.82L17.4 5.8c.1-.24.32-.4.6-.4Z"
        fill="#F7FFFB"
      />
      <path
        d="M12.2 13.1h11.6c.7 0 1.15.7.86 1.33l-1.5 3.27H12.84l-1.5-3.27a.94.94 0 0 1 .86-1.33Z"
        fill="#F7FFFB"
      />
      <path
        d="M11.4 18.4h13.2c.4 0 .72.32.72.72v.86c0 .4-.32.72-.72.72H11.4a.72.72 0 0 1-.72-.72v-.86c0-.4.32-.72.72-.72Z"
        fill="#F7FFFB"
      />
      <path
        d="M13 21.4h2v6.1c0 .5-.4.9-.9.9h-.2a.9.9 0 0 1-.9-.9v-6.1Zm8 0h2v6.1c0 .5-.4.9-.9.9h-.2a.9.9 0 0 1-.9-.9v-6.1Z"
        fill="#F7FFFB"
      />
      <path
        d="M13.6 12.2c0-2.43 1.97-4.4 4.4-4.4s4.4 1.97 4.4 4.4"
        stroke="#0C6E53"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
