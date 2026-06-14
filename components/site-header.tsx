"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Suche", href: "/suche" },
  { label: "Gewerke", href: "/gewerke" },
  { label: "Für Betriebe", href: "/fuer-betriebe" },
  { label: "Über uns", href: "/ueber-gewerkeliste" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[240px_minmax(260px,1fr)_auto] lg:items-center lg:px-8">
        <Link className="flex items-center gap-3 text-xl font-semibold tracking-normal text-brand" href="/" aria-label="GewerkeListe.com Startseite">
          <img
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-md object-contain"
            src="/images/gewerkeliste-logo.png"
          />
          <span>
            GewerkeListe<span className="text-sm font-semibold text-[#4b6382]">.com</span>
          </span>
        </Link>

        <form action="/suche" className="order-3 w-full lg:order-none">
          <label className="sr-only" htmlFor="site-search">
            Suche
          </label>
          <input
            id="site-search"
            name="q"
            className="h-11 w-full rounded-md border border-line bg-white px-4 text-sm outline-none focus:border-action"
            placeholder="Betrieb, Gewerk oder Ort suchen..."
          />
        </form>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#24364d]">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                className={active ? "text-action" : "hover:text-action"}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 text-white hover:bg-brand"
            href="/eintrag-beanspruchen"
          >
            Eintrag beanspruchen
          </Link>
        </nav>
      </div>
    </header>
  );
}
