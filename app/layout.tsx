import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { LegalFooter } from "@/components/legal-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "GewerkeListe.com – Fachbetriebe nach Gewerk und Ort finden",
  description:
    "Finden Sie Baugewerke und Fachbetriebe nach Leistung, Ort und Tätigkeitsgebiet. Betriebe können ihren Eintrag übernehmen, verifizieren und Leistungen strukturiert darstellen.",
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
