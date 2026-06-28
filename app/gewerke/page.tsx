import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TradeBrowser, type TradeViewMode } from "@/components/trade-browser";
import { getPublicCompanyTradeCounts } from "@/lib/data/public-directory";
import { isSupabaseConfigured } from "@/lib/supabase";
import { frequentTradeSlugs } from "@/lib/trade-hierarchy";
import { serviceTradeHierarchy } from "@/lib/service-taxonomy";
import { publicTradeTaxonomy } from "@/lib/trade-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gewerke am Bau: Übersicht, Leistungen & Betriebe finden | GewerkeListe.com",
  description:
    "Alle wichtigen Bau- und Handwerksgewerke verständlich erklärt. Finden Sie passende Betriebe nach Gewerk, Leistung und Region auf GewerkeListe.com.",
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
        hierarchy={serviceTradeHierarchy()}
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
