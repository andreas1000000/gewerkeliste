import { getSupabaseAdmin } from "@/lib/supabase";
import type { CoverageSnapshot, RegionalCompanyCandidate, Region } from "@/lib/types/coverage";

export async function getRegionalCoverageOverview(params?: {
  region?: string;
  status?: string;
  trade?: string;
  query?: string;
}) {
  const supabase = getSupabaseAdmin();
  const regionSlug = params?.region || "riedering";
  const [{ data: region, error: regionError }, candidates, snapshots] = await Promise.all([
    supabase.from("regions").select("*").eq("slug", regionSlug).single(),
    getRegionalCompanyCandidates({ ...params, region: regionSlug }),
    getLatestCoverageSnapshots(regionSlug),
  ]);

  if (regionError) throw regionError;

  return {
    region: region as Region,
    candidates,
    snapshots,
  };
}

export async function getRegionalCompanyCandidates(params?: {
  region?: string;
  status?: string;
  trade?: string;
  query?: string;
}) {
  const supabase = getSupabaseAdmin();
  const regionSlug = params?.region || "riedering";
  const { data: region } = await supabase.from("regions").select("name,postal_codes").eq("slug", regionSlug).single();
  const regionName = region?.name || regionSlug;
  const postalCodes = Array.isArray(region?.postal_codes) ? region.postal_codes.filter(Boolean) : [];

  let query = supabase
    .from("company_candidates")
    .select("*, duplicate_company:companies!company_candidates_duplicate_of_company_id_fkey(id, name, slug, city, postal_code)")
    .order("overall_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (postalCodes.length > 0) {
    query = query.or(`city.ilike.%${regionName}%,postal_code.in.(${postalCodes.join(",")})`);
  } else {
    query = query.ilike("city", `%${regionName}%`);
  }

  if (params?.status) query = query.eq("status", params.status);
  else query = query.neq("status", "rejected");
  if (params?.trade) query = query.eq("possible_trade", params.trade);
  if (params?.query) query = query.ilike("name", `%${params.query.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as RegionalCompanyCandidate[];
}

export async function getLatestCoverageSnapshots(regionSlug = "riedering") {
  const supabase = getSupabaseAdmin();
  const { data: region, error: regionError } = await supabase.from("regions").select("id").eq("slug", regionSlug).single();
  if (regionError) throw regionError;

  const { data, error } = await supabase
    .from("coverage_snapshots")
    .select("*, regions(id, name, slug), trades(id, name, slug)")
    .eq("region_id", region.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const latestByTrade = new Map<string, CoverageSnapshot>();
  for (const snapshot of (data || []) as CoverageSnapshot[]) {
    const tradeId = snapshot.trade_id;
    if (!latestByTrade.has(tradeId)) latestByTrade.set(tradeId, snapshot);
  }

  return [...latestByTrade.values()].sort((a, b) => (a.trades?.name || "").localeCompare(b.trades?.name || "", "de"));
}
