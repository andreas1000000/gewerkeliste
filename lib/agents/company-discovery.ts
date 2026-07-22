import { tradeTaxonomy } from "../trade-taxonomy.ts";
import { getSupabaseAdmin } from "../supabase.ts";
import type {
  AgentTaskPriority,
  CompanyDiscoveryDryRunInput,
  CompanyDiscoveryDryRunResult,
  CompanyDiscoveryFinding,
  CompanyDiscoveryReviewItem,
} from "./types";

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
  name: string;
  possible_trade: string | null;
  status: string;
  city: string | null;
  postal_code: string | null;
  source_url: string | null;
  possible_website: string | null;
  overall_score: number | null;
  identity_confidence: number | null;
  trade_confidence: number | null;
  duplicate_of_company_id: string | null;
};

type DbSnapshot = {
  trade_id: string;
  estimated_companies: number | null;
  created_at: string;
  trades: Pick<DbTrade, "id" | "name" | "slug"> | Array<Pick<DbTrade, "id" | "name" | "slug">> | null;
};

export async function runCompanyDiscoveryDryRun(input: CompanyDiscoveryDryRunInput): Promise<CompanyDiscoveryDryRunResult> {
  const supabase = getSupabaseAdmin();
  const regionSlug = input.regionSlug || "riedering";
  const { data: region, error: regionError } = await supabase.from("regions").select("id,name,slug,postal_codes").eq("slug", regionSlug).single();
  if (regionError) throw regionError;

  const dbRegion = region as DbRegion;
  const postalCode = dbRegion.postal_codes?.[0] || "";
  const selectedTradeSlugs = input.tradeSlug ? [input.tradeSlug] : tradeTaxonomy.slice(0, 40).map((trade) => trade.slug);

  const [{ data: trades, error: tradesError }, { data: companies, error: companiesError }, { data: candidates, error: candidatesError }, { data: snapshots }] =
    await Promise.all([
      supabase.from("trades").select("id,name,slug").in("slug", selectedTradeSlugs),
      supabase
        .from("companies")
        .select("id,trade_id,public_visible,city,postal_code,trades(id,name,slug),company_trades(confidence_score,trades(id,name,slug))")
        .or(`city.ilike.%${dbRegion.name}%,postal_code.eq.${postalCode}`),
      supabase
        .from("company_candidates")
        .select("id,name,possible_trade,status,city,postal_code,source_url,possible_website,overall_score,identity_confidence,trade_confidence,duplicate_of_company_id")
        .or(`city.ilike.%${dbRegion.name}%,postal_code.eq.${postalCode}`),
      supabase
        .from("coverage_snapshots")
        .select("trade_id,estimated_companies,created_at,trades(id,name,slug)")
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

  const findings = dbTrades.map((trade) => buildDiscoveryFinding(dbRegion, trade, companiesInRegion, candidatesInRegion, latestEstimateByTrade));
  const tasks = buildDiscoveryTasks(findings);
  const reviewItems = buildReviewItems(candidatesInRegion, findings);

  return {
    agent_id: "company-discovery-agent",
    mode: "dry_run",
    region_slug: dbRegion.slug,
    trade_slug: input.tradeSlug,
    findings,
    tasks,
    review_items: reviewItems,
    guardrails: [
      "Nur lokale Supabase-Daten gelesen.",
      "Keine Firmen angelegt oder veroeffentlicht.",
      "Keine Kandidaten geloescht.",
      "Keine E-Mails gesendet.",
      "Keine externe Websuche, keine Brave Search API und keine kostenpflichtige API genutzt.",
      "Fehlende Quellen erzeugen Aufgaben, keine erfundenen Betriebe.",
    ],
  };
}

function buildDiscoveryFinding(
  region: DbRegion,
  trade: DbTrade,
  companies: DbCompany[],
  candidates: DbCandidate[],
  estimates: Map<string, DbSnapshot>,
): CompanyDiscoveryFinding {
  const foundCompanies = countCompaniesForTrade(companies, trade);
  const tradeCandidates = candidates.filter((candidate) => candidate.possible_trade === trade.slug && candidate.status !== "rejected" && candidate.status !== "promoted");
  const candidateCompanies = tradeCandidates.length;
  const estimatedCompanies = estimates.get(trade.slug)?.estimated_companies || null;
  const gapEstimate = estimatedCompanies ? Math.max(0, estimatedCompanies - foundCompanies - candidateCompanies) : null;
  const status = discoveryStatus(foundCompanies, candidateCompanies, gapEstimate, estimatedCompanies);

  return {
    region_slug: region.slug,
    region_name: region.name,
    trade_slug: trade.slug,
    trade_name: trade.name,
    found_companies: foundCompanies,
    candidate_companies: candidateCompanies,
    estimated_companies: estimatedCompanies,
    gap_estimate: gapEstimate,
    status,
    confidence_score: estimatedCompanies ? 70 : foundCompanies || candidateCompanies ? 55 : 35,
    next_action: nextAction(status, trade.name),
    reasoning: reasoning(foundCompanies, candidateCompanies, estimatedCompanies, gapEstimate),
  };
}

function buildDiscoveryTasks(findings: CompanyDiscoveryFinding[]): CompanyDiscoveryDryRunResult["tasks"] {
  return findings
    .filter((finding) => finding.status !== "sufficient_for_now")
    .sort((a, b) => priorityRank(b.status) - priorityRank(a.status) || b.candidate_companies - a.candidate_companies)
    .slice(0, 20)
    .map((finding) => ({
      title: `${finding.region_name}: ${finding.trade_name} Discovery vorbereiten`,
      priority: taskPriority(finding.status),
      trade_slug: finding.trade_slug,
      task_type: taskType(finding),
      suggested_action: finding.next_action,
      confidence_score: finding.confidence_score,
    }));
}

function buildReviewItems(candidates: DbCandidate[], findings: CompanyDiscoveryFinding[]): CompanyDiscoveryReviewItem[] {
  const findingByTrade = new Map(findings.map((finding) => [finding.trade_slug, finding]));
  return candidates
    .filter((candidate) => candidate.status !== "rejected" && candidate.status !== "promoted" && Boolean(candidate.possible_trade))
    .filter((candidate) => findingByTrade.has(candidate.possible_trade || ""))
    .sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0))
    .slice(0, 20)
    .map((candidate) => ({
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      trade_slug: candidate.possible_trade,
      source_url: candidate.possible_website || candidate.source_url,
      confidence_score: Math.max(30, Math.min(100, Number(candidate.overall_score || candidate.identity_confidence || candidate.trade_confidence || 50))),
      severity: candidate.duplicate_of_company_id ? "high" : candidate.possible_website || candidate.source_url ? "medium" : "low",
      reason: candidate.duplicate_of_company_id ? "Dublettenverdacht vor weiterer Bearbeitung pruefen." : "Vorhandener lokaler Kandidat kann manuell geprueft werden.",
      next_action: candidate.possible_website || candidate.source_url ? "Quelle manuell pruefen und Kandidat im Coverage Review bewerten." : "Manuelle Quelle ermitteln; keine Daten erfinden.",
    }));
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

function discoveryStatus(
  foundCompanies: number,
  candidateCompanies: number,
  gapEstimate: number | null,
  estimatedCompanies: number | null,
): CompanyDiscoveryFinding["status"] {
  if (candidateCompanies > 0) return "review_candidates";
  if (estimatedCompanies && gapEstimate && gapEstimate > 0) return "needs_more_candidates";
  if (!foundCompanies && !candidateCompanies) return "needs_source";
  return "sufficient_for_now";
}

function taskType(finding: CompanyDiscoveryFinding): CompanyDiscoveryDryRunResult["tasks"][number]["task_type"] {
  if (finding.status === "review_candidates") return "verify_candidate_source";
  if (finding.status === "needs_more_candidates") return "find_candidates_for_region_trade";
  return "needs_manual_source";
}

function taskPriority(status: CompanyDiscoveryFinding["status"]): AgentTaskPriority {
  if (status === "needs_more_candidates") return "high";
  if (status === "review_candidates") return "medium";
  return "low";
}

function nextAction(status: CompanyDiscoveryFinding["status"], tradeName: string) {
  if (status === "review_candidates") return `Vorhandene ${tradeName}-Kandidaten manuell pruefen und Quellen bewerten.`;
  if (status === "needs_more_candidates") return `Weitere zulaessige Quellen fuer ${tradeName} in der Region sammeln.`;
  if (status === "needs_source") return `Manuelle Ausgangsquelle fuer ${tradeName} in der Region ermitteln.`;
  return "Keine Discovery-Aufgabe noetig; Monitoring fortsetzen.";
}

function reasoning(found: number, candidates: number, estimate: number | null, gap: number | null) {
  if (!estimate) return `Gefunden: ${found}, lokale Kandidaten: ${candidates}. Kein Zielwert vorhanden; keine Firma wird erfunden.`;
  return `Gefunden: ${found}, lokale Kandidaten: ${candidates}, Zielwert: ${estimate}, Luecke: ${gap ?? 0}.`;
}

function priorityRank(status: CompanyDiscoveryFinding["status"]) {
  if (status === "needs_more_candidates") return 3;
  if (status === "review_candidates") return 2;
  if (status === "needs_source") return 1;
  return 0;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}
