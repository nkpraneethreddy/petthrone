import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PetThrone — the richest pet on the web",
  description:
    "The richest pet on the web. Pay to rank. Highest total sits at #1. Anyone can boost a pet they like. Bids are final.",
  openGraph: {
    title: "PetThrone — the richest pet on the web",
    description: "Pay to rank. Anyone can boost a pet they like.",
    type: "website",
  },
};

const themeInit = `try{if(localStorage.getItem("pt-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full bg-canvas text-ink">{children}</body>
    </html>
  );
}
