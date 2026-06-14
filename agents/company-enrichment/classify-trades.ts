export type TradeClassification = {
  slug: string;
  name: string;
  confidenceScore: number;
  evidence: string;
};

export function splitTradeClassifications(items: TradeClassification[]) {
  return {
    auto: items.filter((item) => item.confidenceScore >= 75),
    review: items.filter((item) => item.confidenceScore >= 50 && item.confidenceScore < 75),
    ignored: items.filter((item) => item.confidenceScore < 50),
  };
}
