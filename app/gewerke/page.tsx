import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TradeBrowser, type TradeViewMode } from "@/components/trade-browser";
import { getPublicCompanyTradeCounts } from "@/lib/data/public-directory";
import { isSupabaseConfigured } from "@/lib/supabase";
import { frequentTradeSlugs, tradeHierarchy } from "@/lib/trade-hierarchy";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Baugewerke und Leistungen finden | GewerkeListe.com",
  description:
    "Bauleistungsnahe Suche nach Gewerken, Spezialisierungen und passenden Fachbetrieben, mit DIN-276-orientierter Struktur und praxisnahen Vergabeeinheiten.",
};

type PageProps = {
  searchParams?: Promise<{
    ansicht?: string;
    view?: string;
    q?: string;
    ort?: string;
    claimIntent?: string;
  }>;
};

export default async function TradesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const claimIntent = params?.claimIntent === "true";
  const viewMode = claimIntent ? "alphabetisch" : viewModeFromParam(params?.view || params?.ansicht);
  const companyCounts = isSupabaseConfigured() ? await getPublicCompanyTradeCounts() : {};

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />
      <TradeBrowser
        claimIntent={claimIntent}
        companyCounts={companyCounts}
        frequentSlugs={[...frequentTradeSlugs]}
        hierarchy={tradeHierarchy}
        initialLocation={params?.ort?.trim() || ""}
        initialQuery={params?.q?.trim() || ""}
        initialView={viewMode}
        trades={publicTradeTaxonomy()}
      />
    </main>
  );
}

function viewModeFromParam(value?: string): TradeViewMode {
  if (value === "alphabetisch" || value === "haeufig") return value;
  return "kostengruppen";
}
