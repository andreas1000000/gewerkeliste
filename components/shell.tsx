import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/admin/agents" className="flex items-center gap-3 text-lg font-semibold tracking-normal text-ink">
            <img alt="" aria-hidden="true" className="h-8 w-8 rounded-md object-contain" src="/images/gewerkeliste-logo.png" />
            <span>
              GewerkeListe OS
              <span className="ml-2 align-middle text-xs font-semibold text-muted">intern</span>
            </span>
          </Link>
          <nav aria-label="GewerkeListe OS Navigation" className="flex flex-wrap items-center gap-2 text-sm">
            <NavLink href="/admin/agents" label="OS Start" />
            <NavLink href="/admin/submissions" label="Einreichungen" />
            <NavLink href="/admin/claims" label="Claims" />
            <NavLink href="/admin/coverage?region=stephanskirchen" label="Coverage" />
            <NavLink href="/admin/research-imports" label="Recherche" />
            <NavLink href="/admin/companies" label="Betriebe" />
            <NavLink href="/admin/service-enrichment" label="Leistungs-Review" />
            <NavLink href="/trades" label="Gewerke" />
            <Link className="rounded-md bg-brand px-3 py-2 font-semibold text-white hover:bg-[#265a4d]" href="/companies/new">
              Neuer Eintrag
            </Link>
          </nav>
        </div>
        <div className="border-t border-line bg-[#fbfcff]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-2 text-xs font-semibold text-muted">
            <span className="mr-1 text-ink">Schnellzugriff:</span>
            <Link className="rounded-md px-2 py-1 hover:bg-white hover:text-brand" href="/admin/coverage?region=stephanskirchen">
              Stephanskirchen
            </Link>
            <Link className="rounded-md px-2 py-1 hover:bg-white hover:text-brand" href="/admin/coverage?region=riedering">
              Riedering
            </Link>
            <Link className="rounded-md px-2 py-1 hover:bg-white hover:text-brand" href="/admin/agents/municipality-discovery">
              Gemeinde-Agent
            </Link>
            <Link className="rounded-md px-2 py-1 hover:bg-white hover:text-brand" href="/">
              Website ansehen
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href={href}>
      {label}
    </Link>
  );
}
