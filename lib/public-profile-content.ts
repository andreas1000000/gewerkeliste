import { extractServiceListFromDescription, groupServicesForDisplay } from "./company-display.ts";
import type { PublicCompanyServiceRelation, PublicCompanyWithTrade } from "./types/public-directory.ts";

export type PublicServiceDisplayItem = {
  label: string;
  slug?: string;
};

export type PublicServiceDisplayGroup = {
  label: string;
  items: PublicServiceDisplayItem[];
};

export type PublicServiceDisplay = {
  groups: PublicServiceDisplayGroup[];
  totalCount: number;
  sourceLabel: string;
};

type ServiceCandidate = {
  label: string;
  slug?: string;
  family?: string;
  source: "confirmed" | "selected" | "specialization" | "description";
};

export function buildPublicServiceDisplay(
  company: Pick<PublicCompanyWithTrade, "company_services" | "selected_services" | "specializations" | "description">,
): PublicServiceDisplay {
  const candidates = [
    ...confirmedServiceCandidates(company.company_services || []),
    ...namedServiceCandidates(company.selected_services, "selected"),
    ...namedServiceCandidates(company.specializations, "specialization"),
  ];

  const grouped = groupCandidates(candidates);
  if (grouped.totalCount) {
    const hasConfirmed = candidates.some((candidate) => candidate.source === "confirmed");
    const hasSubmissionServices = candidates.some((candidate) => candidate.source === "selected" || candidate.source === "specialization");
    return {
      ...grouped,
      sourceLabel:
        hasConfirmed && hasSubmissionServices
          ? "Strukturierte und freigegebene Leistungen aus dem öffentlichen Profil."
          : hasConfirmed
            ? "Strukturierte Leistungen aus dem öffentlichen Profil."
            : "Leistungen aus dem öffentlichen Betriebseintrag.",
    };
  }

  const descriptionGroups = groupCandidates(namedServiceCandidates(extractServiceListFromDescription(company.description), "description"));
  return {
    ...descriptionGroups,
    sourceLabel: descriptionGroups.totalCount ? "Leistungen aus der öffentlichen Profilbeschreibung." : "",
  };
}

function confirmedServiceCandidates(services: PublicCompanyServiceRelation[]): ServiceCandidate[] {
  return services
    .filter((match) => match.status === "confirmed" && Boolean(match.services?.name))
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
    .map((match) => ({
      label: match.services?.name || "",
      slug: match.services?.slug,
      family: match.services?.service_families?.name || "Weitere Leistungen",
      source: "confirmed" as const,
    }))
    .filter((candidate) => Boolean(candidate.label));
}

function namedServiceCandidates(values: unknown, source: ServiceCandidate["source"]): ServiceCandidate[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((label) => ({ label, source }));
}

function groupCandidates(candidates: ServiceCandidate[]) {
  const seen = new Set<string>();
  const groupsByLabel = new Map<string, PublicServiceDisplayItem[]>();

  for (const candidate of candidates) {
    const key = normalizeServiceKey(candidate.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const family = candidate.family || groupServicesForDisplay([candidate.label])[0]?.label || "Weitere Leistungen";
    const current = groupsByLabel.get(family) || [];
    current.push({ label: candidate.label, slug: candidate.slug });
    groupsByLabel.set(family, current);
  }

  const groups = Array.from(groupsByLabel.entries()).map(([label, items]) => ({ label, items }));
  return {
    groups,
    totalCount: groups.reduce((count, group) => count + group.items.length, 0),
  };
}

function normalizeServiceKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
