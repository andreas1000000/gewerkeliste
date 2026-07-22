import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/82 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/admin/agents" className="flex items-center gap-3 text-lg font-semibold tracking-normal text-ink">
            <img alt="" aria-hidden="true" className="h-8 w-8 rounded-md object-contain" src="/images/gewerkeliste-logo.png" />
            GewerkeListe OS
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/admin/agents">
              Cockpit
            </Link>
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/admin/coverage?region=stephanskirchen">
              Coverage
            </Link>
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/admin/companies">
              Betriebseinträge
            </Link>
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/admin/submissions">
              Einreichungen
            </Link>
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/admin/research-imports">
              Recherche
            </Link>
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/admin/claims">
              Claims
            </Link>
            <Link className="rounded-md bg-action px-3 py-2 font-semibold text-white hover:bg-brand" href="/admin/site-editor">
              Seiteneditor
            </Link>
            <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/trades">
              Gewerke
            </Link>
            <Link className="rounded-md bg-brand px-3 py-2 font-semibold text-white hover:bg-[#265a4d]" href="/companies/new">
              Neuer Eintrag
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
