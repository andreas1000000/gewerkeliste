import type { ClaimStatus } from "@/lib/types";

const claimStyles: Record<ClaimStatus, string> = {
  unclaimed: "border-line bg-white text-muted",
  pending: "border-[#d8b85d] bg-[#fff7db] text-[#7a5a00]",
  claimed: "border-[#8ab9aa] bg-[#e8f3ef] text-[#25584c]",
  rejected: "border-[#da9a8a] bg-[#fff0ed] text-[#8e2f1f]",
};

const claimLabels: Record<ClaimStatus, string> = {
  unclaimed: "Nicht beansprucht",
  pending: "Übernahme angefragt",
  claimed: "Eintrag übernommen",
  rejected: "Abgelehnt",
};

export function ClaimBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${claimStyles[status]}`}>
      {claimLabels[status]}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        verified ? "border-[#8ab9aa] bg-[#e8f3ef] text-[#25584c]" : "border-line bg-white text-muted"
      }`}
    >
      {verified ? "Verifiziert" : "Nicht verifiziert"}
    </span>
  );
}
