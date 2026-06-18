import { tradeTaxonomy } from "@/lib/trade-taxonomy";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentTaskPriority, RegionalCoverageDryRunInput, RegionalCoverageDryRunResult } from "./types";

type DbRegion = {
  id: string;
  name: string;
  slug: string;
  postal_codes: string[] | null;
};

type DbTrade = {
  id: string;
  name: string;
  slug: string;
};

type DbCompany = {
  id: string;
  trade_id: string | null;
  public_visible: boolean | null;
  verified: boolean | null;
  city: string | null;
  postal_code: string | null;
  trades?: Pick<DbTrade, "id" | "name" | "slug"> | Array<Pick<DbTrade, "id" | "name" | "slug">> | null;
  company_trades?: Array<{
    confidence_score: number | null;
    trades: Pick<DbTrade, "id" | "name" | "slug"> | Array<Pick<DbTrade, "id" | "name" | "slug">> | null;
  }> | null;
};

type DbCandidate = {
  id: string;
  possible_trade: string | null;
  status: string;
  city: string | null;
  postal_code: string | null;
};

type DbSnapshot = {
  trade_id: string;
  estimated_companies: number | null;
  coverage_percent: number | null;
  created_at: string;
  trades: Pick<DbTrade, "id" | "name" | "slug"> | Array<Pick<DbTrade, "id" | "name" | "slug">> | null;
};

type CoverageStatus = RegionalCoverageDryRunResult["findings"][number]["status"];

export async function runRegionalCoverageDryRun(input: RegionalCoverageDryRunInput): Promise<RegionalCoverageDryRunResult> {
  const supabase = getSupabaseAdmin();
  const regionSlug = input.regionSlug || "riedering";
  const { data: region, error: regionError } = await supabase.from("regions").select("id,name,slug,postal_codes").eq("slug", regionSlug).single();
  if (regionError) throw regionError;

  const dbRegion = region as DbRegion;
  const postalCode = dbRegion.postal_codes?.[0] || "";
  const selectedTradeSlugs = input.tradeSlugs?.length ? input.tradeSlugs : tradeTaxonomy.slice(0, 40).map((trade) => trade.slug);

  const [{ data: trades, error: tradesError }, { data: companies, error: companiesError }, { data: candidates, error: candidatesError }, { data: snapshots }] =
    await Promise.all([
      supabase.from("trades").select("id,name,slug").in("slug", selectedTradeSlugs),
      supabase
        .from("companies")
        .select("id,trade_id,public_visible,verified,city,postal_code,trades(id,name,slug),company_trades(confidence_score,trades(id,name,slug))")
        .or(`city.ilike.%${dbRegion.name}%,postal_code.eq.${postalCode}`),
      supabase.from("company_candidates").select("id,possible_trade,status,city,postal_code").or(`city.ilike.%${dbRegion.name}%,postal_code.eq.${postalCode}`),
      supabase
        .from("coverage_snapshots")
        .select("trade_id,estimated_companies,coverage_percent,created_at,trades(id,name,slug)")
        .eq("region_id", dbRegion.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (tradesError) throw tradesError;
  if (companiesError) throw companiesError;
  if (candidatesError) throw candidatesError;

  const dbTrades = ((trades || []) as unknown as DbTrade[]).sort((a, b) => a.name.localeCompare(b.name, "de"));
  const companiesInRegion = (companies || []) as unknown as DbCompany[];
  const candidatesInRegion = (candidates || []) as DbCandidate[];
  const latestEstimateByTrade = latestSnapshotByTrade((snapshots || []) as unknown as DbSnapshot[]);

  const findings = dbTrades.map((trade) => {
    const foundCompanies = countCompaniesForTrade(companiesInRegion, trade);
    const candidateCompanies = candidatesInRegion.filter((candidate) => candidate.possible_trade === trade.slug && candidate.status !== "rejected").length;
    const latestSnapshot = latestEstimateByTrade.get(trade.slug);
    const estimatedCompanies = latestSnapshot?.estimated_companies && latestSnapshot.estimated_companies > 0 ? latestSnapshot.estimated_companies : null;
    const coveragePercent = estimatedCompanies ? Math.min(100, Math.round((foundCompanies / estimatedCompanies) * 100)) : null;
    const status = coverageStatus(foundCompanies, candidateCompanies, coveragePercent, estimatedCompanies);

    return {
      region_slug: dbRegion.slug,
      region_name: dbRegion.name,
      trade_slug: trade.slug,
      trade_name: trade.name,
      found_companies: foundCompanies,
      candidate_companies: candidateCompanies,
      estimated_companies: estimatedCompanies,
      coverage_percent: coveragePercent,
      status,
      confidence_score: estimatedCompanies ? 70 : foundCompanies || candidateCompanies ? 55 : 35,
      next_action: nextAction(status, trade.name),
      reasoning: reasoning(foundCompanies, candidateCompanies, estimatedCompanies, coveragePercent),
    };
  });

  const tasks = findings
    .filter((finding) => finding.status !== "good")
    .sort((a, b) => priorityRank(b.status) - priorityRank(a.status) || b.candidate_companies - a.candidate_companies)
    .slice(0, 20)
    .map((finding) => ({
      title: `${finding.region_name}: ${finding.trade_name} nacharbeiten`,
      priority: taskPriority(finding.status),
      trade_slug: finding.trade_slug,
      suggested_action: finding.next_action,
      confidence_score: finding.confidence_score,
    }));

  return {
    agent_id: "regional-coverage-agent",
    mode: "dry_run",
    region_slug: dbRegion.slug,
    findings,
    tasks,
    guardrails: [
      "Keine oeffentlichen Firmendaten geaendert.",
      "Keine E-Mails gesendet.",
      "Keine kostenpflichtige API genutzt.",
      "Fehlende Zielwerte werden als needs_baseline markiert, nicht erfunden.",
    ],
  };
}

function latestSnapshotByTrade(snapshots: DbSnapshot[]) {
  const latest = new Map<string, DbSnapshot>();
  for (const snapshot of snapshots) {
    const slug = firstRelation(snapshot.trades)?.slug;
    if (slug && !latest.has(slug)) latest.set(slug, snapshot);
  }
  return latest;
}

function countCompaniesForTrade(companies: DbCompany[], trade: DbTrade) {
  const companyIds = new Set<string>();
  for (const company of companies) {
    if (!company.public_visible) continue;
    if (firstRelation(company.trades)?.slug === trade.slug || company.trade_id === trade.id) companyIds.add(company.id);
    for (const companyTrade of company.company_trades || []) {
      if ((companyTrade.confidence_score || 0) >= 70 && firstRelation(companyTrade.trades)?.slug === trade.slug) companyIds.add(company.id);
    }
  }
  return companyIds.size;
}

function coverageStatus(found: number, candidates: number, coverage: number | null, estimate: number | null): CoverageStatus {
  if (!estimate) return found || candidates ? "needs_baseline" : "unknown";
  if (coverage !== null && coverage >= 85) return "good";
  if (coverage !== null && coverage >= 60) return "nacharbeiten";
  return "kritisch";
}

function taskPriority(status: CoverageStatus): AgentTaskPriority {
  if (status === "kritisch") return "critical";
  if (status === "nacharbeiten") return "high";
  return "medium";
}

function nextAction(status: string, tradeName: string) {
  if (status === "good") return "Monitoring fortsetzen und neue Quellen nur bei Bedarf pruefen.";
  if (status === "needs_baseline") return `Belastbare regionale Baseline fuer ${tradeName} ermitteln.`;
  if (status === "unknown") return `Erste Discovery-Quellen fuer ${tradeName} in der Region pruefen.`;
  return `Offizielle Firmenwebsites fuer fehlende ${tradeName}-Betriebe suchen und Kandidaten in Review legen.`;
}

function reasoning(found: number, candidates: number, estimate: number | null, coverage: number | null) {
  if (!estimate) {
    return `Gefunden: ${found}, Kandidaten: ${candidates}. Kein belastbarer Zielwert vorhanden; deshalb keine scheinbar genaue Abdeckung.`;
  }
  return `Gefunden: ${found}, Kandidaten: ${candidates}, Zielwert: ${estimate}, Abdeckung: ${coverage ?? 0}%.`;
}

function priorityRank(status: string) {
  if (status === "kritisch") return 4;
  if (status === "nacharbeiten") return 3;
  if (status === "needs_baseline") return 2;
  if (status === "unknown") return 1;
  return 0;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}
