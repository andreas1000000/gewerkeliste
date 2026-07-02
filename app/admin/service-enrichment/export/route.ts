import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const CSV_PATH = path.join(process.cwd(), "reports", "service-enrichment-review-2026-07-01.csv");

export async function GET() {
  const csv = await readFile(CSV_PATH, "utf8");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="service-enrichment-review-2026-07-01.csv"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
