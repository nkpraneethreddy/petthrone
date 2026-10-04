import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import Script from "next/script";
import { siteUrl } from "@/lib/site";
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
  metadataBase: new URL(siteUrl()),
  title: {
    default: "PetThrone — the richest pet on the web",
    template: "%s — PetThrone",
  },
  description:
    "The richest pet on the web. Pay to rank. Highest total sits at #1. Anyone can boost a pet they like. Bids are final.",
  applicationName: "PetThrone",
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "PetThrone — the richest pet on the web",
    description: "Pay to rank. Anyone can boost a pet they like.",
    type: "website",
    siteName: "PetThrone",
    url: siteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: "PetThrone — the richest pet on the web",
    description: "Pay to rank. Anyone can boost a pet they like.",
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
      <body className="min-h-full bg-canvas text-ink">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>
        {children}
      </body>
    </html>
  );
}
