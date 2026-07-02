import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

type ServiceCandidate = {
  company_id: string;
  company_name: string;
  city: string;
  trade_slug: string;
  trade_name: string;
  service_slug: string;
  service_name: string;
  confidence: "high" | "medium" | "low";
  source_field: string;
  evidence_text: string;
  reason: string;
  suggested_action: string;
};

type ServiceEnrichmentReport = {
  candidates: ServiceCandidate[];
  conflicts: Array<{ company_id: string; term: string; type: string }>;
};

const REPORT_PATH = path.join(process.cwd(), "reports", "service-enrichment-dry-run-2026-07-01.json");
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    company_id?: string;
    service_slug?: string;
    source_field?: string;
  } | null;
  const companyId = body?.company_id?.trim();
  const serviceSlug = body?.service_slug?.trim();
  const sourceField = body?.source_field?.trim();

  if (!companyId || !serviceSlug || !sourceField) {
    return privateJson(
      { status: "error", message: "company_id, service_slug and source_field are required." },
      { status: 400 },
    );
  }

  const report = await loadReport();
  const candidate = report.candidates.find((item) =>
    item.company_id === companyId && item.service_slug === serviceSlug && item.source_field === sourceField
  );

  if (!candidate) {
    return privateJson({ status: "error", message: "Candidate not found in dry-run report." }, { status: 404 });
  }

  const reviewCategory = reviewCategoryFor(candidate, report.conflicts);
  const confidenceScore = confidenceScoreFor(candidate.confidence);

  return privateJson(
    {
      status: "dry_run_only",
      writes_enabled: false,
      message: "No database write was performed. This endpoint only previews the explicit admin approval payload.",
      candidate: {
        company_id: candidate.company_id,
        company_name: candidate.company_name,
        city: candidate.city,
        trade_slug: candidate.trade_slug,
        trade_name: candidate.trade_name,
        service_slug: candidate.service_slug,
        service_name: candidate.service_name,
        confidence: candidate.confidence,
        review_category: reviewCategory,
        source_field: candidate.source_field,
        evidence_text: candidate.evidence_text,
        reason: candidate.reason,
        suggested_action: candidate.suggested_action,
      },
      would_write: {
        service_enrichment_reviews: {
          company_id: candidate.company_id,
          service_slug: candidate.service_slug,
          service_name: candidate.service_name,
          trade_slug: candidate.trade_slug,
          trade_name: candidate.trade_name,
          confidence: candidate.confidence,
          review_category: "APPROVED",
          source_field: candidate.source_field,
          evidence_text: candidate.evidence_text,
          reason: candidate.reason,
          suggested_action: candidate.suggested_action,
          reviewer_decision: "approved",
          reviewed_by: "admin",
        },
        company_services: {
          company_id: candidate.company_id,
          service_slug: candidate.service_slug,
          confidence_score: confidenceScore,
          source: "service_enrichment_review",
          status: "confirmed",
          evidence: candidate.evidence_text,
          approved_by: "admin",
        },
      },
    },
    { status: 200 },
  );
}

async function loadReport() {
  const raw = await readFile(REPORT_PATH, "utf8");
  return JSON.parse(raw) as ServiceEnrichmentReport;
}

function reviewCategoryFor(candidate: ServiceCandidate, conflicts: ServiceEnrichmentReport["conflicts"]) {
  if (candidate.confidence === "low") return "DO_NOT_AUTO_APPLY_LOW";
  if (conflicts.some((conflict) => conflict.company_id === candidate.company_id)) return "AMBIGUOUS";
  if (!candidate.evidence_text.trim()) return "INSUFFICIENT_EVIDENCE";
  if (candidate.confidence === "high") return "AUTO_CANDIDATE_HIGH";
  return "REVIEW_REQUIRED_MEDIUM";
}

function confidenceScoreFor(confidence: ServiceCandidate["confidence"]) {
  if (confidence === "high") return 95;
  if (confidence === "medium") return 80;
  return 45;
}

function privateJson(body: unknown, init: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      ...PRIVATE_HEADERS,
      ...init.headers,
    },
  });
}
