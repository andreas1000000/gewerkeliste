export type DuplicateSignal = {
  companyId: string;
  reason: string;
  score: number;
};

export function requiresDuplicateReview(signals: DuplicateSignal[]) {
  return signals.some((signal) => signal.score >= 70);
}
