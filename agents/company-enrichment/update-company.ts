export type CompanyFieldChange = {
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  sourceUrl: string;
  confidenceScore: number;
};

export function shouldApplyFieldChange(change: CompanyFieldChange) {
  if (!change.newValue || change.confidenceScore < 75) return false;
  if (!change.oldValue) return true;
  return change.oldValue.trim().toLowerCase() !== change.newValue.trim().toLowerCase() && change.confidenceScore >= 85;
}
