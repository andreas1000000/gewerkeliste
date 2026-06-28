import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const target = new URLSearchParams();
  const query = stringParam(params.query) || stringParam(params.q);
  const trade = stringParam(params.gewerk);
  const trades = stringParam(params.trades);
  const service = stringParam(params.leistung);
  const location = stringParam(params.ort);
  const radius = stringParam(params.umkreis);

  if (query) target.set("query", query);
  if (trade || trades) target.set("gewerk", [trade, trades].filter(Boolean).join(","));
  if (service) target.set("leistung", service);
  if (location) target.set("ort", location);
  if (radius) target.set("umkreis", radius);

  const suffix = target.toString();
  redirect(suffix ? `/betriebe?${suffix}` : "/betriebe");
}

function stringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean).join(",");
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
