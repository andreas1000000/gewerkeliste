export type EnrichmentReportSection = {
  title: string;
  rows: unknown[];
};

export function summarizeReport(sections: EnrichmentReportSection[]) {
  return sections.map((section) => ({ title: section.title, count: section.rows.length }));
}
