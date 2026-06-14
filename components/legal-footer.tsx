import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function LegalFooter() {
  return (
    <footer className="border-t border-line bg-[#08264d] text-white">
      <div className="border-b border-white/10 bg-[#f8fafc] text-brand">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 text-sm font-semibold sm:grid-cols-2 lg:grid-cols-4">
          <span>Aus echter Baupraxis entstanden</span>
          <span>Strukturiertes Fachregister</span>
          <span>Für Auftraggeber und Betriebe</span>
          <span>Betriebsdaten nachvollziehbar</span>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 text-sm md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 text-xl font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white p-1" aria-hidden="true">
              <img alt="" className="h-full w-full object-contain" src="/images/gewerkeliste-logo.png" />
            </span>
            GewerkeListe.com
          </div>
          <p className="mt-3 leading-6 text-blue-100">
            Das professionelle Verzeichnis für Baugewerke.
          </p>
        </div>
        <nav>
          <h2 className="font-semibold">Navigation</h2>
          <div className="mt-3 grid gap-2 text-blue-100">
            <Link className="hover:text-white" href="/suche">
              Suche
            </Link>
            <Link className="hover:text-white" href="/gewerke">
              Gewerke
            </Link>
            <Link className="hover:text-white" href="/fuer-betriebe">
              Für Betriebe
            </Link>
            <Link className="hover:text-white" href="/betrieb-eintragen">
              Betrieb eintragen
            </Link>
            <Link className="hover:text-white" href="/eintrag-beanspruchen">
              Eintrag beanspruchen
            </Link>
            <Link className="hover:text-white" href="/ueber-gewerkeliste">
              Über uns
            </Link>
          </div>
        </nav>
        <nav>
          <h2 className="font-semibold">Rechtliches</h2>
          <div className="mt-3 grid gap-2 text-blue-100">
            <Link className="hover:text-white" href="/impressum">
              Impressum
            </Link>
            <Link className="hover:text-white" href="/datenschutz">
              Datenschutz
            </Link>
          </div>
        </nav>
        <div>
          <h2 className="font-semibold">Kontakt</h2>
          <div className="mt-3 grid gap-2 text-blue-100">
            <span>GewerkeListe.com</span>
            <span>Riedering, Bayern</span>
            <a className="break-words hover:text-white" href={`mailto:${siteConfig.publicContactEmail}`}>
              {siteConfig.publicContactEmail}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-blue-100">
        © 2026 GewerkeListe.com
      </div>
    </footer>
  );
}
