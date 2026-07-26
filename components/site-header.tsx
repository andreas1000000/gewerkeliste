"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: Array<{ label: string; href: string; primary?: boolean }> = [
  { label: "Suchende", href: "/suche", primary: true },
  { label: "Betriebe", href: "/fuer-betriebe" },
  { label: "Gewerke", href: "/gewerke" },
  { label: "Preise", href: "/preise" },
  { label: "Über uns", href: "/ueber-gewerkeliste" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
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

        <nav aria-label="Hauptnavigation" className="order-3 flex w-full flex-wrap items-center gap-x-1 gap-y-2 text-sm font-semibold text-[#24364d] lg:order-none lg:min-w-0 lg:flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                className={
                  item.primary
                    ? active
                      ? "inline-flex min-h-10 items-center justify-center rounded-full bg-brand px-4 py-2 text-white"
                      : "inline-flex min-h-10 items-center justify-center rounded-full bg-action px-4 py-2 text-white hover:bg-brand"
                    : active
                      ? "inline-flex min-h-10 items-center justify-center rounded-full bg-[#e8f3ef] px-3 py-2 text-brand"
                      : "inline-flex min-h-10 items-center justify-center rounded-full px-3 py-2 hover:bg-[#f1f5f9] hover:text-action"
                }
                href={item.href}
                aria-label={item.primary ? "GewerkeListe durchsuchen" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="order-2 flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold text-[#24364d] lg:order-none lg:w-auto">
          <Link className="inline-flex min-h-10 items-center justify-center rounded-full px-3 py-2 hover:bg-[#f1f5f9] hover:text-action" href="/eintrag-beanspruchen">
            Eintrag beanspruchen
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-action px-4 py-2 text-white hover:bg-brand"
            href="/betrieb-eintragen"
          >
            Betrieb eintragen
          </Link>
        </div>
      </div>
    </header>
  );
}
