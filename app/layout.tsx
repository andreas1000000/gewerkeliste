import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { LegalFooter } from "@/components/legal-footer";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "GewerkeListe.com – Fachbetriebe nach Gewerk und Ort finden",
  description:
    "Finden Sie Baugewerke und Fachbetriebe nach Leistung, Ort und Tätigkeitsgebiet. Betriebe können ihren Eintrag übernehmen, verifizieren und Leistungen strukturiert darstellen.",
  openGraph: {
    type: "website",
    siteName: "GewerkeListe.com",
    title: "GewerkeListe.com – Fachbetriebe nach Gewerk und Ort finden",
    description: "Bau- und Handwerksbetriebe nach Gewerk, Leistung und Region finden.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "GewerkeListe.com",
    description: "Bau- und Handwerksbetriebe nach Gewerk, Leistung und Region finden.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        {children}
        <LegalFooter />
        <Analytics />
      </body>
    </html>
  );
}
