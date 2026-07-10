import { revalidatePath } from "next/cache";
import { getAgentDefinition } from "@/lib/agents/agent-registry";
import { getUniqueCompanySlug } from "@/lib/data";
import { assertWritesAllowed } from "@/lib/runtime/write-guard";
import { BraveSearchProvider } from "@/lib/search/brave-search-provider";
import type { SearchResult } from "@/lib/search/search-provider";
import { companySlug, slugify } from "@/lib/slug";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canonicalTradeSlug, findTaxonomyTrade } from "@/lib/trade-taxonomy";
import type {
  MunicipalityDiscoveryCandidate,
  MunicipalityDiscoveryEmailMode,
  MunicipalityDiscoveryInput,
  MunicipalityDiscoveryResult,
  MunicipalityDiscoveryTier,
} from "./types";

const agentId = "municipality-discovery-agent";
const defaultCounty = "Landkreis Rosenheim";
const blockedSourcePattern = /(rathaus|landratsamt|beh[oö]rde|regierung|ovb|zeitung|news|nachrichten|top[- ]?10|google\.com\/maps|maps\.google)/i;
const blockedHostPattern = /(google\.|maps\.google|bing\.|duckduckgo\.|ovb-online|rosenheim24|chiemgau24|merkur\.de|meinestadt\.de|gelbeseiten\.de|dasoertliche\.de|11880\.com|cylex\.de|branchenbuch|northdata|firmenwissen|unternehmensregister|facebook\.com|instagram\.com|linkedin\.com)/i;
const estimatedBraveQueryCostEur = 0.01;
const prio1TradeSlugs = [
  "maurerarbeiten",
  "betonbau",
  "hochbau",
  "tiefbau",
  "zimmererarbeiten",
  "dachdeckerarbeiten",
  "spenglerarbeiten",
  "elektroinstallation",
  "sanitaer-heizung-klima",
  "fliesenlegerarbeiten",
  "malerarbeiten",
  "stuckateurarbeiten",
  "schreinerarbeiten",
  "metallbau",
  "pflasterbau",
  "garten-und-landschaftsbau",
];

type DbRegion = {
  id: string;
  name: string;
  slug: string;
  postal_codes: string[] | null;
  municipality: string | null;
  county: string | null;
};

type DbTrade = {
  id: string;
  name: string;
  slug: string;
};

type DbCandidate = {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  possible_trade: string | null;
  possible_website: string | null;
  phone: string | null;
  email: string | null;
  source_type: string;
  source_url: string | null;
  discovery_confidence: number | null;
  identity_confidence: number | null;
  trade_confidence: number | null;
  overall_score: number | null;
  status: string;
  duplicate_of_company_id: string | null;
  raw_evidence: Record<string, unknown> | null;
};

type PublishStats = {
  queries_planned: string[];
  queries_executed: number;
  websites_found: number;
  candidates_created: number;
  external_api_used: boolean;
  costs_eur: number;
  publications_created: number;
  approvals_created: number;
  review_items_created: number;
  outbox_drafts_created: number;
  duplicates_blocked: number;
  blocked_candidates: number;
  errors: string[];
};

export function normalizeMunicipalityDiscoveryInput(formInput: Partial<MunicipalityDiscoveryInput>): MunicipalityDiscoveryInput {
  const publishMode = isPublishMode(formInput.publish_mode) ? formInput.publish_mode : "manual_approval";
  const emailMode = isEmailMode(formInput.email_mode) ? formInput.email_mode : "draft_only";
  return {
    municipality: (formInput.municipality || "").trim(),
    county: (formInput.county || defaultCounty).trim(),
    trade_scope: formInput.trade_scope || "prio1",
    discovery_mode: isDiscoveryMode(formInput.discovery_mode) ? formInput.discovery_mode : "web_search_discovery",
    max_queries: clampInteger(formInput.max_queries, 0, 500, 50),
    max_publications: clampInteger(formInput.max_publications, 0, 250, 10),
    max_cost_eur: clampNumber(formInput.max_cost_eur, 0, 25, 1),
    publish_mode: publishMode,
    email_mode: emailMode,
  };
}

export async function runMunicipalityDiscovery(input: MunicipalityDiscoveryInput): Promise<MunicipalityDiscoveryResult> {
  assertWritesAllowed({ operation: "agent.municipality-discovery.run" });

  const normalized = normalizeMunicipalityDiscoveryInput(input);
  if (!normalized.municipality) throw new Error("Gemeinde oder Stadt ist erforderlich.");
  if (normalized.email_mode === "send_after_approval") {
    throw new Error("send_after_approval ist dokumentiert, aber noch nicht implementiert. Es werden keine E-Mails gesendet.");
  }

  const supabase = getSupabaseAdmin();
  const agent = getAgentDefinition(agentId);
  if (!agent) throw new Error("Municipality Discovery Agent ist nicht registriert.");

  const region = await findOrCreateRegion(normalized.municipality, normalized.county || defaultCounty);
  const mode = normalized.publish_mode === "review_only" ? "dry_run" : normalized.publish_mode === "manual_approval" ? "approval_required" : "live";
  const now = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agent.agent_id,
      agent_name: agent.name,
      department: agent.department,
      objective: `${normalized.municipality}: Gemeinde-Discovery starten`,
      mode,
      status: "running",
      region_id: region.id,
      dry_run: normalized.publish_mode !== "tier_a_unverified_basis",
      risk_level: "high",
      cost_center: agent.cost_center,
      budget_limit: normalized.max_cost_eur,
      estimated_cost: 0,
      actual_cost: 0,
      input: normalized,
      output: {},
      created_by: "gewerkeliste-os",
      started_at: now,
    })
    .select("id")
    .single();
  if (runError || !run) throw runError || new Error("Agent Run konnte nicht angelegt werden.");

  const stats: PublishStats = {
    queries_planned: [],
    queries_executed: 0,
    websites_found: 0,
    candidates_created: 0,
    external_api_used: false,
    costs_eur: 0,
    publications_created: 0,
    approvals_created: 0,
    review_items_created: 0,
    outbox_drafts_created: 0,
    duplicates_blocked: 0,
    blocked_candidates: 0,
    errors: [],
  };

  try {
    await insertStep(run.id, "prepare", "Suchmatrix und Grenzen vorbereiten", "completed", {
      municipality: normalized.municipality,
      max_queries: normalized.max_queries,
      max_publications: normalized.max_publications,
      discovery_mode: normalized.discovery_mode,
      publish_mode: normalized.publish_mode,
      email_mode: normalized.email_mode,
    });

    if (normalized.discovery_mode !== "local_candidates") {
      await runWebSearchDiscovery(run.id, region, normalized, stats);
    }

    const candidates = await loadMunicipalityCandidates(region, normalized);
    await insertToolCall(run.id, "database", "load_company_candidates", {
      tables: ["regions", "company_candidates"],
      municipality: normalized.municipality,
      external_api: false,
    }, {
      candidates_found: candidates.length,
      external_api_used: stats.external_api_used,
    });

    const classified = await classifyCandidates(candidates, normalized);
    await insertStep(run.id, "classify", "Kandidaten Tier A/B/C klassifizieren", "completed", tierCounts(classified));

    await createReviewItems(run.id, region, classified);
    stats.review_items_created = classified.filter((candidate) => candidate.tier !== "C").length;
    stats.blocked_candidates = classified.filter((candidate) => candidate.tier === "C").length;

    if (normalized.publish_mode === "manual_approval") {
      stats.approvals_created = await createPublicationApprovals(run.id, region, classified, normalized);
    }

    if (normalized.publish_mode === "tier_a_unverified_basis") {
      await publishTierA(run.id, region, classified, normalized, stats);
    }

    await insertCostEvent(run.id, region.id, normalized, stats);

    const result = buildResult(run.id, region, normalized, classified, stats);
    const { error: updateError } = await supabase
      .from("agent_runs")
      .update({ status: "completed", output: result, finished_at: new Date().toISOString(), actual_cost: 0 })
      .eq("id", run.id);
    if (updateError) throw updateError;

    safeRevalidatePath("/admin/agents");
    safeRevalidatePath("/admin/agents/municipality-discovery");
    if (stats.publications_created > 0) {
      safeRevalidatePath("/");
      safeRevalidatePath("/betriebe");
      safeRevalidatePath("/suche");
      safeRevalidatePath("/admin/companies");
    }

    return result;
  } catch (error) {
    await supabase
      .from("agent_runs")
      .update({ status: "failed", error_message: error instanceof Error ? error.message : String(error), finished_at: new Date().toISOString() })
      .eq("id", run.id);
    throw error;
  }
}

async function findOrCreateRegion(municipality: string, county: string): Promise<DbRegion> {
  const supabase = getSupabaseAdmin();
  const slug = slugify(municipality);
  const { data: existing, error: existingError } = await supabase
    .from("regions")
    .select("id,name,slug,postal_codes,municipality,county")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing as DbRegion;

  const { data, error } = await supabase
    .from("regions")
    .insert({
      name: municipality,
      slug,
      postal_codes: knownPostalCodes(municipality),
      municipality,
      county,
      state: "Bayern",
      country: "Deutschland",
      region_type: "municipality",
    })
    .select("id,name,slug,postal_codes,municipality,county")
    .single();
  if (error || !data) throw error || new Error("Region konnte nicht angelegt werden.");
  return data as DbRegion;
}

async function loadMunicipalityCandidates(region: DbRegion, input: MunicipalityDiscoveryInput): Promise<DbCandidate[]> {
  const supabase = getSupabaseAdmin();
  const postalCodes = new Set([...(region.postal_codes || []), ...knownPostalCodes(input.municipality)].filter(Boolean));
  const tradeSlugs = await resolveTradeScope(input.trade_scope);
  const municipality = escapeOrValue(input.municipality);
  const orParts = [`city.ilike.%${municipality}%`];
  for (const postalCode of postalCodes) orParts.push(`postal_code.eq.${postalCode}`);

  let query = supabase
    .from("company_candidates")
    .select(
      "id,name,city,postal_code,street,possible_trade,possible_website,phone,email,source_type,source_url,discovery_confidence,identity_confidence,trade_confidence,overall_score,status,duplicate_of_company_id,raw_evidence",
    )
    .or(orParts.join(","))
    .not("status", "eq", "promoted")
    .not("status", "eq", "rejected")
    .order("overall_score", { ascending: false, nullsFirst: false })
    .limit(Math.max(20, input.max_queries));

  if (tradeSlugs.length) query = query.in("possible_trade", tradeSlugs);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as DbCandidate[];
}

async function runWebSearchDiscovery(runId: string, region: DbRegion, input: MunicipalityDiscoveryInput, stats: PublishStats) {
  const queries = await buildMunicipalityQueries(region, input);
  stats.queries_planned = queries.slice(0, input.max_queries);

  const externalApiAllowed = process.env.GEWERKELISTE_ALLOW_EXTERNAL_API === "true";
  const provider = new BraveSearchProvider({ maxResults: 5 });
  if (!externalApiAllowed || !provider.available || input.discovery_mode === "human_search_assist") {
    await insertStep(runId, "human_search_assist", "Suchliste fuer menschliche Recherche erzeugt", "completed", {
      external_api_allowed: externalApiAllowed,
      provider_available: provider.available,
      manual_queries: stats.queries_planned,
      note: "Keine Suchmaschine wurde aufgerufen. Suchmaschine dient nur als Wegweiser, Firmenwebsite ist der Beleg.",
    });
    await insertToolCall(
      runId,
      "web_search",
      "human_search_assist_query_batch",
      { queries: stats.queries_planned, external_api_allowed: externalApiAllowed },
      { queries_executed: 0, candidates_created: 0, reason: "External API disabled or provider unavailable" },
    );
    return;
  }

  const supabase = getSupabaseAdmin();
  const createdCandidates: Array<Record<string, unknown>> = [];
  const seenHosts = new Set<string>();
  let spent = 0;

  for (const query of stats.queries_planned) {
    if (spent + estimatedBraveQueryCostEur > input.max_cost_eur) break;
    const results = await provider.search(query);
    stats.queries_executed += 1;
    spent += estimatedBraveQueryCostEur;
    stats.external_api_used = true;

    for (const result of results) {
      const candidate = await candidateFromSearchResult(result, query, region, input);
      if (!candidate) continue;
      const host = hostname(candidate.possible_website || candidate.source_url || "");
      if (!host || seenHosts.has(host)) continue;
      seenHosts.add(host);
      createdCandidates.push(candidate);
    }
  }

  stats.costs_eur = Number(spent.toFixed(4));
  stats.websites_found = createdCandidates.length;
  if (createdCandidates.length) {
    const { data, error } = await supabase
      .from("company_candidates")
      .upsert(createdCandidates, { onConflict: "source_url,name", ignoreDuplicates: true })
      .select("id");
    if (error) throw error;
    stats.candidates_created = data?.length || 0;
  }

  await insertStep(runId, "web_search_discovery", "Suchanbieter als Wegweiser genutzt", "completed", {
    provider: provider.name,
    queries_executed: stats.queries_executed,
    websites_found: stats.websites_found,
    candidates_created: stats.candidates_created,
    estimated_cost_eur: stats.costs_eur,
    google_maps_used: false,
    google_places_used: false,
  });
  await insertToolCall(
    runId,
    "web_search",
    provider.name,
    { queries: stats.queries_planned.slice(0, stats.queries_executed), cost_gate_eur: input.max_cost_eur },
    { queries_executed: stats.queries_executed, candidates_created: stats.candidates_created, google_maps_used: false, google_places_used: false },
  );
}

async function buildMunicipalityQueries(region: DbRegion, input: MunicipalityDiscoveryInput) {
  const tradeSlugs = await resolveTradeScope(input.trade_scope);
  const trades = await loadQueryTrades(tradeSlugs);
  const place = region.name;
  const county = input.county || region.county || defaultCounty;
  const queries: string[] = [];
  for (const trade of trades) {
    const terms = queryTermsForTrade(trade.slug, trade.name);
    for (const term of terms.slice(0, 2)) {
      queries.push(`${term} ${place}`);
      queries.push(`${term} ${place} Firma`);
      queries.push(`${term} ${place} Meisterbetrieb`);
      queries.push(`${term} ${place} GmbH`);
      queries.push(`${term} ${county}`);
      queries.push(`${term} Rosenheim Chiemgau`);
      queries.push(`${term} in der Nähe Rosenheim`);
    }
  }
  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, input.max_queries);
}

async function loadQueryTrades(tradeSlugs: string[]) {
  if (!tradeSlugs.length) {
    return prio1TradeSlugs.map((slug) => ({ slug, name: findTaxonomyTrade(slug)?.name || titleCase(slug.replace(/-/g, " ")) }));
  }
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("trades").select("name,slug").in("slug", tradeSlugs);
  if (data?.length) return data as Array<{ name: string; slug: string }>;
  return tradeSlugs.map((slug) => ({ slug, name: findTaxonomyTrade(slug)?.name || titleCase(slug.replace(/-/g, " ")) }));
}

function queryTermsForTrade(slug: string, name: string) {
  const presets: Record<string, string[]> = {
    elektroinstallation: ["Elektro", "Elektriker", "Elektrotechnik"],
    "sanitaer-heizung-klima": ["Heizung Sanitär", "SHK", "Wärmepumpe"],
    zimmererarbeiten: ["Zimmerei", "Holzbau", "Dachstuhl"],
    dachdeckerarbeiten: ["Dachdecker", "Bedachungen", "Dachsanierung"],
    spenglerarbeiten: ["Spengler", "Blechner", "Dachrinne"],
    tiefbau: ["Tiefbau", "Baggerbetrieb", "Erdbau"],
    pflasterbau: ["Pflasterbau", "Pflasterarbeiten", "Außenanlagen"],
    maurerarbeiten: ["Maurer", "Bauunternehmen", "Rohbau"],
    malerarbeiten: ["Maler", "Malerbetrieb", "Lackierer"],
    schreinerarbeiten: ["Schreinerei", "Schreiner", "Innenausbau"],
  };
  return presets[slug] || [name, slug.replace(/-/g, " ")];
}

async function candidateFromSearchResult(result: SearchResult, query: string, region: DbRegion, input: MunicipalityDiscoveryInput) {
  const sourceUrl = normalizeWebsite(result.url);
  if (!sourceUrl || isBlockedSearchResult(sourceUrl)) return null;
  const root = rootUrl(sourceUrl);
  if (!root || isBlockedSearchResult(root)) return null;

  const website = await analyzeCompanyWebsite(root, region.name);
  const text = `${result.title} ${result.snippet} ${website.text}`.slice(0, 12000);
  const tradeSlug = detectTradeFromText(text, input.trade_scope);
  const name = cleanCompanyName(website.companyName || result.title || hostname(root));
  if (!name || isGenericCompanyName(name)) return null;
  if (!tradeSlug) return null;

  return {
    name,
    city: website.city || region.name,
    postal_code: website.postalCode || region.postal_codes?.[0] || null,
    street: website.street,
    possible_trade: tradeSlug,
    possible_website: root,
    phone: website.phone,
    email: website.email,
    source_type: website.imprintFound ? "official_website" : "search_result",
    source_url: root,
    discovery_confidence: 80,
    identity_confidence: website.imprintFound ? 90 : 75,
    trade_confidence: 82,
    overall_score: website.imprintFound ? 88 : 78,
    status: "needs_review",
    duplicate_of_company_id: null,
    raw_evidence: {
      query,
      search_provider: result.source,
      search_title: result.title,
      search_snippet: result.snippet,
      pages_checked: website.pages,
      services_raw: website.services,
      google_maps_used: false,
      google_places_used: false,
    },
  };
}

async function analyzeCompanyWebsite(root: string, municipality: string) {
  const pages = [root, `${root.replace(/\/$/, "")}/impressum`, `${root.replace(/\/$/, "")}/kontakt`, `${root.replace(/\/$/, "")}/leistungen`];
  const parts: string[] = [];
  const checked: string[] = [];
  for (const page of pages) {
    const html = await fetchText(page);
    if (!html) continue;
    checked.push(page);
    parts.push(html);
  }
  const text = stripHtml(parts.join(" ")).slice(0, 20000);
  const postalCode = text.match(/\b(8[0-9]{4})\b/)?.[1] || null;
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = text.match(/(?:\+49|0)[\d\s./()-]{6,}/)?.[0]?.replace(/\s+/g, " ").trim() || null;
  const street = text.match(/\b([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .-]+(?:straße|str\.|weg|platz|gasse|ring|allee)\s+\d+[a-zA-Z]?)\b/)?.[1] || null;
  const title = text.split(/\s{2,}|\n/).find((line) => /gmbh|bau|elektro|zimmerei|schreinerei|maler|dach|sanit|heizung/i.test(line)) || "";
  const companyName = cleanCompanyName(title);
  return {
    text,
    pages: checked,
    companyName,
    city: text.toLowerCase().includes(municipality.toLowerCase()) ? municipality : null,
    postalCode,
    street,
    phone,
    email,
    imprintFound: /impressum|anbieterkennzeichnung/i.test(text),
    services: extractServices(text),
  };
}

async function fetchText(url: string) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "GewerkeListeResearchBot/0.1 (+https://gewerkeliste.com; contact: kontakt@gewerkeliste.com)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return "";
    return await response.text();
  } catch {
    return "";
  }
}

async function resolveTradeScope(scope: string) {
  if (scope === "all") return [];
  if (scope === "prio1") return prio1TradeSlugs;
  const slug = canonicalTradeSlug(scope);
  return slug ? [slug] : [];
}

async function classifyCandidates(candidates: DbCandidate[], input: MunicipalityDiscoveryInput): Promise<MunicipalityDiscoveryCandidate[]> {
  const classified: MunicipalityDiscoveryCandidate[] = [];
  for (const candidate of candidates) {
    const duplicateId = candidate.duplicate_of_company_id || (await findDuplicateCompanyId(candidate));
    const sourceText = `${candidate.source_type || ""} ${candidate.source_url || ""} ${candidate.possible_website || ""}`;
    const reasons: string[] = [];
    const confidence = Math.max(
      20,
      Math.min(100, Number(candidate.overall_score || candidate.identity_confidence || candidate.trade_confidence || candidate.discovery_confidence || 45)),
    );

    const hasName = candidate.name.trim().length >= 3;
    const hasPlace = Boolean(candidate.city?.toLowerCase().includes(input.municipality.toLowerCase()) || candidate.postal_code);
    const hasTrade = Boolean(canonicalTradeSlug(candidate.possible_trade || ""));
    const hasStrongSource = isStrongBusinessSource(candidate.source_type, candidate.possible_website, candidate.source_url);
    const weakOnly = isWeakHintSource(candidate.source_type) && !candidate.possible_website;
    const blockedSource = blockedSourcePattern.test(sourceText);

    if (!hasName) reasons.push("Firmenname fehlt oder ist zu schwach.");
    if (!hasPlace) reasons.push("Ort oder PLZ ist nicht ausreichend plausibel.");
    if (!hasTrade) reasons.push("Gewerk ist nicht ausreichend plausibel.");
    if (duplicateId) reasons.push("Moegliche Dublette vorhanden.");
    if (blockedSource) reasons.push("Quelle wirkt nicht wie oeffentliche Unternehmensquelle.");
    if (weakOnly) reasons.push("Nur schwache Hinweisquelle ohne Website.");

    let tier: MunicipalityDiscoveryTier = "B";
    if (blockedSource || !hasName || !hasPlace || !hasTrade) tier = "C";
    else if (!duplicateId && hasStrongSource && confidence >= 75) tier = "A";
    else tier = "B";

    if (tier === "A") reasons.push("Name, Ort, Gewerk und geschaeftliche Quelle sind plausibel.");
    if (tier === "B" && reasons.length === 0) reasons.push("Plausibel, aber Quelle oder Confidence reicht nicht fuer automatische Basisanlage.");

    classified.push({
      candidate_id: candidate.id,
      name: candidate.name,
      city: candidate.city,
      postal_code: candidate.postal_code,
      possible_trade: canonicalTradeSlug(candidate.possible_trade || "") || candidate.possible_trade,
      possible_website: normalizeWebsite(candidate.possible_website),
      source_type: candidate.source_type,
      source_url: candidate.source_url,
      tier,
      confidence_score: confidence,
      reasons,
      duplicate_company_id: duplicateId,
    });
  }
  return classified.sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || b.confidence_score - a.confidence_score);
}

async function findDuplicateCompanyId(candidate: DbCandidate) {
  const supabase = getSupabaseAdmin();
  const website = normalizeWebsite(candidate.possible_website);
  if (website) {
    const { data } = await supabase.from("companies").select("id").eq("website_url", website).limit(1);
    if (data?.[0]?.id) return data[0].id as string;
  }
  if (candidate.email) {
    const { data } = await supabase.from("companies").select("id").eq("email", candidate.email).limit(1);
    if (data?.[0]?.id) return data[0].id as string;
  }
  if (candidate.name && candidate.postal_code) {
    const { data } = await supabase.from("companies").select("id").eq("postal_code", candidate.postal_code).ilike("name", `%${candidate.name}%`).limit(1);
    if (data?.[0]?.id) return data[0].id as string;
  }
  return null;
}

async function createReviewItems(runId: string, region: DbRegion, candidates: MunicipalityDiscoveryCandidate[]) {
  const supabase = getSupabaseAdmin();
  const rows = candidates
    .filter((candidate) => candidate.tier !== "C")
    .map((candidate) => ({
      agent_run_id: runId,
      agent_id: agentId,
      review_type: "municipality_discovery_candidate",
      title: `${candidate.tier}: ${candidate.name}`,
      description: `${region.name}: ${candidate.reasons.join(" ")}`,
      status: "open",
      severity: candidate.tier === "A" ? "medium" : "high",
      region_id: region.id,
      candidate_id: candidate.candidate_id,
      source_url: candidate.possible_website || candidate.source_url,
      source_type: candidate.source_type,
      confidence_score: candidate.confidence_score,
      payload: {
        municipality: region.name,
        tier: candidate.tier,
        candidate_name: candidate.name,
        possible_trade: candidate.possible_trade,
        next_action: candidate.tier === "A" ? "Kann je nach Publish-Modus als unbestaetigter Basis-Eintrag vorbereitet werden." : "Manuell pruefen.",
        public_write_done: false,
        email_sent: false,
      },
    }));
  if (!rows.length) return;
  const { error } = await supabase.from("agent_review_items").insert(rows);
  if (error) throw error;
}

async function createPublicationApprovals(runId: string, region: DbRegion, candidates: MunicipalityDiscoveryCandidate[], input: MunicipalityDiscoveryInput) {
  const supabase = getSupabaseAdmin();
  const rows = candidates
    .filter((candidate) => candidate.tier === "A")
    .slice(0, input.max_publications)
    .map((candidate) => ({
      agent_run_id: runId,
      agent_id: agentId,
      action_type: "publish_company",
      risk_level: "high",
      title: `${region.name}: Basis-Eintrag anlegen anfragen - ${candidate.name}`,
      description: [
        "Freigabeanforderung fuer einen unbestaetigten oeffentlichen Basis-Eintrag.",
        "Diese Freigabe setzt nur den Status. Die Ausfuehrung ist in diesem Schritt nicht automatisiert.",
        `Quelle: ${candidate.possible_website || candidate.source_url || "nicht recorded"}`,
      ].join("\n"),
      proposed_payload: {
        requested_action: "publish_unverified_basis_entry",
        execution_built: false,
        source_table: "company_candidates",
        source_id: candidate.candidate_id,
        candidate_snapshot: candidate,
        guardrails: {
          creates_company_now: false,
          sends_email: false,
          verified_true: false,
          claim_status_changed: false,
        },
      },
      status: "pending",
      requested_by: "municipality-discovery-agent",
    }));
  if (!rows.length) return 0;
  const { error } = await supabase.from("agent_approvals").insert(rows);
  if (error) throw error;
  return rows.length;
}

async function publishTierA(
  runId: string,
  region: DbRegion,
  candidates: MunicipalityDiscoveryCandidate[],
  input: MunicipalityDiscoveryInput,
  stats: PublishStats,
) {
  const tierA = candidates.filter((candidate) => candidate.tier === "A").slice(0, input.max_publications);
  for (const candidate of tierA) {
    try {
      const published = await publishCandidate(runId, region, candidate, input.email_mode);
      if (published === "duplicate") stats.duplicates_blocked += 1;
      if (published === "created") stats.publications_created += 1;
      if (published === "outbox") {
        stats.publications_created += 1;
        stats.outbox_drafts_created += 1;
      }
    } catch (error) {
      stats.errors.push(`${candidate.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function publishCandidate(
  runId: string,
  region: DbRegion,
  candidate: MunicipalityDiscoveryCandidate,
  emailMode: MunicipalityDiscoveryEmailMode,
): Promise<"created" | "duplicate" | "outbox"> {
  const supabase = getSupabaseAdmin();
  const { data: dbCandidate, error: candidateError } = await supabase.from("company_candidates").select("*").eq("id", candidate.candidate_id).single();
  if (candidateError || !dbCandidate) throw candidateError || new Error("Kandidat wurde nicht gefunden.");
  if (dbCandidate.status === "promoted") return "duplicate";

  const name = String(dbCandidate.name || candidate.name).trim();
  const city = String(dbCandidate.city || candidate.city || region.name).trim();
  const postalCode = String(dbCandidate.postal_code || candidate.postal_code || knownPostalCodes(region.name)[0] || "").trim();
  const tradeSlug = candidate.possible_trade || canonicalTradeSlug(String(dbCandidate.possible_trade || ""));
  if (!name || !city || !/^[0-9]{5}$/.test(postalCode) || !tradeSlug) throw new Error("Name, Ort, PLZ und Gewerk sind fuer die Basisanlage erforderlich.");

  const duplicateId = candidate.duplicate_company_id || (await findDuplicateCompanyId(dbCandidate as DbCandidate));
  if (duplicateId) {
    await supabase.from("company_candidates").update({ status: "rejected", duplicate_of_company_id: duplicateId }).eq("id", candidate.candidate_id);
    return "duplicate";
  }

  const trade = await getTrade(tradeSlug);
  const slug = await getUniqueCompanySlug(companySlug(name, postalCode, city));
  const website = normalizeWebsite(dbCandidate.possible_website || candidate.possible_website);
  const sourceUrl = website || dbCandidate.source_url || candidate.source_url;
  const sourceLabel = sourceTypeLabel(dbCandidate.source_type || candidate.source_type);
  const description = [
    `${trade.name} in ${city}.`,
    "Öffentlicher unbestätigter Basis-Eintrag aus öffentlich zugänglichen Unternehmensquellen.",
    `Quelle: ${sourceLabel}${sourceUrl ? ` (${sourceUrl})` : ""}`,
    "Der Eintrag ist noch nicht vom Betrieb bestätigt. Korrektur oder Löschung kann jederzeit angefragt werden.",
  ].join("\n\n");

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      trade_id: trade.id,
      name,
      slug,
      description,
      email: dbCandidate.email || null,
      phone: dbCandidate.phone || null,
      website_url: website,
      street: dbCandidate.street || null,
      city,
      postal_code: postalCode,
      latitude: 0,
      longitude: 0,
      public_visible: true,
      claim_status: "unclaimed",
      verified: false,
    })
    .select("id,slug")
    .single();
  if (companyError || !company) throw companyError || new Error("Basis-Eintrag konnte nicht angelegt werden.");

  await supabase.from("company_sources").insert({
    company_id: company.id,
    source_type: dbCandidate.source_type || "municipality_discovery",
    source_url: sourceUrl,
    title: `Municipality Discovery: ${name}`,
    snippet: sourceLabel,
    content: null,
  });

  await upsertCompanyTrade(company.id, trade.id, candidate.confidence_score, sourceUrl);
  await supabase.from("company_candidates").update({ status: "promoted", possible_trade: trade.slug, possible_website: website }).eq("id", candidate.candidate_id);
  await supabase.from("review_queue").update({ assigned_status: "resolved" }).eq("candidate_id", candidate.candidate_id);

  const hasDraft = await maybeCreateOutboxDraft(runId, company.id, candidate.candidate_id, name, dbCandidate.email, emailMode);
  return hasDraft ? "outbox" : "created";
}

async function getTrade(tradeSlug: string): Promise<DbTrade> {
  const supabase = getSupabaseAdmin();
  const canonical = findTaxonomyTrade(tradeSlug)?.slug || canonicalTradeSlug(tradeSlug);
  const { data, error } = await supabase.from("trades").select("id,name,slug").eq("slug", canonical).maybeSingle();
  if (error) throw error;
  if (data) return data as DbTrade;

  const taxonomyTrade = findTaxonomyTrade(canonical);
  const { data: created, error: createError } = await supabase
    .from("trades")
    .insert({ name: taxonomyTrade?.name || titleCase(canonical.replace(/-/g, " ")), slug: canonical })
    .select("id,name,slug")
    .single();
  if (createError || !created) throw createError || new Error(`Gewerk konnte nicht angelegt werden: ${canonical}`);
  return created as DbTrade;
}

async function upsertCompanyTrade(companyId: string, tradeId: string, confidenceScore: number, sourceUrl: string | null) {
  const supabase = getSupabaseAdmin();
  const row = {
    company_id: companyId,
    trade_id: tradeId,
    confidence_score: Math.max(75, Math.min(100, confidenceScore)),
    source: "municipality-discovery-agent",
    evidence: sourceUrl ? `Quelle: ${sourceUrl}` : "Municipality Discovery Agent",
  };
  const { error } = await supabase.from("company_trades").upsert({ ...row, status: "agent_suggested", visibility_level: "basis_public" }, { onConflict: "company_id,trade_id" });
  if (!error) return;
  if (error.code !== "PGRST204") throw error;
  const { error: fallbackError } = await supabase.from("company_trades").upsert(row, { onConflict: "company_id,trade_id" });
  if (fallbackError) throw fallbackError;
}

async function maybeCreateOutboxDraft(
  runId: string,
  companyId: string,
  candidateId: string,
  companyName: string,
  recipient: string | null,
  emailMode: MunicipalityDiscoveryEmailMode,
) {
  if (emailMode !== "draft_only" || !recipient) return false;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_outbox").insert({
    agent_run_id: runId,
    agent_id: agentId,
    channel: "email",
    recipient,
    subject: "Bitte um kurze Prüfung Ihres kostenlosen Basiseintrags auf GewerkeListe.com",
    body: [
      "Servus,",
      "",
      "ich bin Andreas Moser, gelernter Maurer und Bauingenieur aus dem Landkreis Rosenheim.",
      "",
      "Ich baue gerade GewerkeListe.com auf - eine regionale Gewerke-Suche fuer professionelle Bauprojekte. Ziel ist kein Leadportal, sondern eine strukturierte Übersicht, damit Planer, Bauleiter und Auftraggeber passende Betriebe nach Gewerk, Leistung und Region besser finden.",
      "",
      `Für Ihren Betrieb ${companyName} wurde aus öffentlich zugänglichen Unternehmensquellen ein kostenloser, unbestätigter Basiseintrag vorbereitet.`,
      "",
      "Bitte prüfen Sie kurz:",
      "",
      "* Stimmen Name, Ort, Website und Gewerk?",
      "* Sollen wir etwas korrigieren?",
      "* Möchten Sie den Eintrag übernehmen oder löschen lassen?",
      "",
      "Der Basiseintrag ist kostenlos. Es gibt keine Leadgebühr und keine Auftragsvermittlung.",
      "",
      "Viele Grüße",
      "Andreas Moser",
    ].join("\n"),
    status: "draft",
    company_id: companyId,
    candidate_id: candidateId,
    requires_approval: true,
  });
  if (error) throw error;
  return true;
}

async function insertStep(agentRunId: string, stepKey: string, stepName: string, status: string, output: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_run_steps").insert({
    agent_run_id: agentRunId,
    step_key: stepKey,
    step_name: stepName,
    status,
    output,
    confidence_score: 90,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function insertToolCall(agentRunId: string, toolClass: string, toolName: string, requestSummary: Record<string, unknown>, responseSummary: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRunId,
    tool_class: toolClass,
    tool_name: toolName,
    status: "completed",
    request_summary: requestSummary,
    response_summary: responseSummary,
    source_type: "internal_database",
    cost_estimate: 0,
    actual_cost: 0,
  });
  if (error) throw error;
}

async function insertCostEvent(agentRunId: string, regionId: string, input: MunicipalityDiscoveryInput, stats: PublishStats) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("agent_cost_events").insert({
    agent_run_id: agentRunId,
    agent_id: agentId,
    cost_center: "municipality_discovery",
    provider: "internal",
    tool_name: "municipality_discovery_workflow",
    region_id: regionId,
    estimated_cost: stats.costs_eur,
    actual_cost: stats.costs_eur,
    currency: "EUR",
    metadata: {
      max_cost_eur: input.max_cost_eur,
      external_api_used: stats.external_api_used,
      queries_executed: stats.queries_executed,
      websites_found: stats.websites_found,
    },
  });
  if (error) throw error;
}

function buildResult(
  runId: string,
  region: DbRegion,
  input: MunicipalityDiscoveryInput,
  candidates: MunicipalityDiscoveryCandidate[],
  stats: PublishStats,
): MunicipalityDiscoveryResult {
  return {
    agent_id: agentId,
    run_id: runId,
    mode: input.publish_mode === "review_only" ? "dry_run" : input.publish_mode === "manual_approval" ? "approval_required" : "live",
    municipality: input.municipality,
    county: input.county,
    region_slug: region.slug,
    publish_mode: input.publish_mode,
    email_mode: input.email_mode,
    queries_planned: stats.queries_planned.length,
    queries_executed: stats.queries_executed,
    manual_queries: stats.external_api_used ? [] : stats.queries_planned,
    external_api_used: stats.external_api_used,
    costs_eur: stats.costs_eur,
    websites_found: stats.websites_found,
    candidates_created: stats.candidates_created,
    candidates,
    tier_counts: tierCounts(candidates),
    publications_created: stats.publications_created,
    approvals_created: stats.approvals_created,
    review_items_created: stats.review_items_created,
    outbox_drafts_created: stats.outbox_drafts_created,
    duplicates_blocked: stats.duplicates_blocked,
    blocked_candidates: stats.blocked_candidates,
    guardrails: [
      "Keine E-Mails gesendet.",
      "Keine Verifizierung gesetzt.",
      "Keine Claim-Status-Uebernahme gesetzt.",
      "Keine Google-Maps-Scrapes.",
      stats.external_api_used ? "Externe API wurde nur mit Gate und Kostenlimit genutzt." : "Keine externe API genutzt; Suchliste wurde als manueller Batch erzeugt.",
      input.publish_mode === "tier_a_unverified_basis"
        ? "Tier-A-Kandidaten wurden nur bis zum gesetzten max_publications-Limit als unbestaetigte Basis-Eintraege angelegt."
        : "Keine oeffentlichen Firmen automatisch angelegt.",
    ],
    errors: stats.errors,
  };
}

function tierCounts(candidates: MunicipalityDiscoveryCandidate[]): Record<MunicipalityDiscoveryTier, number> {
  return {
    A: candidates.filter((candidate) => candidate.tier === "A").length,
    B: candidates.filter((candidate) => candidate.tier === "B").length,
    C: candidates.filter((candidate) => candidate.tier === "C").length,
  };
}

function knownPostalCodes(municipality: string) {
  const key = municipality.toLowerCase();
  if (key.includes("bad aibling")) return ["83043"];
  if (key.includes("stephanskirchen")) return ["83071"];
  if (key.includes("riedering")) return ["83083"];
  if (key.includes("rosenheim")) return ["83022", "83024", "83026"];
  return [];
}

function normalizeWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function sourceTypeLabel(sourceType: string) {
  const value = sourceType.toLowerCase();
  if (value.includes("official") || value.includes("website") || value.includes("impressum")) return "Eigene Website";
  if (value.includes("municipality")) return "Gemeinde-/Unternehmensverzeichnis";
  if (value.includes("osm")) return "OpenStreetMap-Hinweisquelle";
  if (value.includes("directory") || value.includes("branchenbuch")) return "Branchenverzeichnis-Hinweisquelle";
  return "Öffentliche Unternehmensquelle";
}

function isStrongBusinessSource(sourceType: string, website: string | null, sourceUrl: string | null) {
  const value = sourceType.toLowerCase();
  if (!website && !sourceUrl) return false;
  if (value.includes("official") || value.includes("impressum") || value.includes("company_website")) return true;
  if (value.includes("brave") || value.includes("search_result")) return Boolean(website);
  if (value.includes("municipality") || value.includes("gemeinde")) return true;
  return Boolean(website) && !isWeakHintSource(sourceType);
}

function isWeakHintSource(sourceType: string) {
  const value = sourceType.toLowerCase();
  return value.includes("osm") || value.includes("directory") || value.includes("branchenbuch") || value.includes("hint");
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function tierRank(tier: MunicipalityDiscoveryTier) {
  if (tier === "A") return 1;
  if (tier === "B") return 2;
  return 3;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function isPublishMode(value: unknown): value is MunicipalityDiscoveryInput["publish_mode"] {
  return value === "review_only" || value === "manual_approval" || value === "tier_a_unverified_basis";
}

function isEmailMode(value: unknown): value is MunicipalityDiscoveryInput["email_mode"] {
  return value === "none" || value === "draft_only" || value === "send_after_approval";
}

function isDiscoveryMode(value: unknown): value is NonNullable<MunicipalityDiscoveryInput["discovery_mode"]> {
  return value === "local_candidates" || value === "human_search_assist" || value === "web_search_discovery";
}

function isBlockedSearchResult(url: string) {
  const host = hostname(url);
  return !host || blockedHostPattern.test(host) || blockedSourcePattern.test(url);
}

function rootUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname.replace(/^www\./, "")}`;
  } catch {
    return null;
  }
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCompanyName(value: string) {
  return stripHtml(value)
    .replace(/\b(Startseite|Home|Willkommen|Impressum|Kontakt|Leistungen|Datenschutz)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function isGenericCompanyName(value: string) {
  const normalized = value.toLowerCase();
  return !normalized || normalized.length < 4 || /^(home|startseite|impressum|kontakt|leistungen|datenschutz|firma|unternehmen)$/.test(normalized);
}

function detectTradeFromText(text: string, fallbackScope: string) {
  const normalized = text.toLowerCase();
  const signals: Array<[string, RegExp]> = [
    ["elektroinstallation", /elektro|elektriker|elektrotechnik|photovoltaik|netzwerk|blitzschutz/],
    ["sanitaer-heizung-klima", /sanitär|sanitaer|heizung|shk|wärmepumpe|waermepumpe|lüftung|lueftung|klima/],
    ["zimmererarbeiten", /zimmerei|zimmerer|holzbau|dachstuhl|holzrahmenbau/],
    ["dachdeckerarbeiten", /dachdecker|bedachung|dachsanierung|flachdach|steildach/],
    ["spenglerarbeiten", /spengler|blechner|dachrinne|blechdach|kaminverkleidung/],
    ["tiefbau", /tiefbau|erdbau|bagger|kanalbau|entwässerung|entwaesserung/],
    ["pflasterbau", /pflaster|außenanlagen|aussenanlagen|einfahrt|terrasse|naturstein/],
    ["maurerarbeiten", /maurer|mauerwerk|rohbau|hochbau|massivbau/],
    ["malerarbeiten", /maler|lackierer|anstrich|fassadenanstrich|beschichtung/],
    ["schreinerarbeiten", /schreiner|schreinerei|innenausbau|möbel|moebel|türen|tueren/],
    ["metallbau", /metallbau|schlosserei|stahlbau|geländer|gelaender/],
  ];
  for (const [slug, pattern] of signals) {
    if (pattern.test(normalized)) return slug;
  }
  const canonical = canonicalTradeSlug(fallbackScope);
  return canonical && canonical !== "prio1" && canonical !== "all" ? canonical : null;
}

function extractServices(text: string) {
  const normalized = text.toLowerCase();
  const services = [
    "Elektroinstallation",
    "Photovoltaik",
    "Heizung",
    "Sanitär",
    "Wärmepumpe",
    "Zimmerei",
    "Holzbau",
    "Dachdeckerarbeiten",
    "Spenglerarbeiten",
    "Tiefbau",
    "Pflasterbau",
    "Maurerarbeiten",
    "Malerarbeiten",
    "Schreinerarbeiten",
    "Metallbau",
  ];
  return services.filter((service) => normalized.includes(service.toLowerCase())).slice(0, 8);
}

function escapeOrValue(value: string) {
  return value.replace(/[,%]/g, "");
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("static generation store missing")) throw error;
  }
}
