import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

  if (!stripeSecretKey) {
    return NextResponse.redirect(new URL("/preise?stripe=missing-env", request.url), { status: 303 });
  }

  if (stripeSecretKey.startsWith("sk_live_")) {
    return NextResponse.redirect(new URL("/preise?stripe=live-blocked", request.url), { status: 303 });
  }

  if (!stripeSecretKey.startsWith("sk_test_")) {
    return NextResponse.redirect(new URL("/preise?stripe=missing-env", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const companyName = String(formData.get("company_name") || "").trim();
  const origin = request.nextUrl.origin;
  const priceId = process.env.STRIPE_PRICE_FOUNDING_MEMBER_YEARLY || "";

  const body = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/zahlung-erfolgreich?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/zahlung-abgebrochen`,
    "metadata[product]": "founding_member_rosenheim",
    "metadata[company_name]": companyName,
    "subscription_data[metadata][product]": "founding_member_rosenheim",
    "subscription_data[metadata][company_name]": companyName,
  });

  if (email) {
    body.set("customer_email", email);
  }

  if (priceId) {
    body.set("line_items[0][price]", priceId);
    body.set("line_items[0][quantity]", "1");
  } else {
    body.set("line_items[0][price_data][currency]", "eur");
    body.set("line_items[0][price_data][unit_amount]", "9900");
    body.set("line_items[0][price_data][recurring][interval]", "year");
    body.set("line_items[0][price_data][product_data][name]", "Gründungsmitglied Landkreis Rosenheim");
    body.set(
      "line_items[0][price_data][product_data][description]",
      "Founding-Member-Angebot für GewerkeListe.com im Landkreis Rosenheim"
    );
    body.set("line_items[0][quantity]", "1");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/preise?stripe=checkout-error", request.url), { status: 303 });
  }

  const session = (await response.json()) as { url?: string };
  if (!session.url) {
    return NextResponse.redirect(new URL("/preise?stripe=checkout-error", request.url), { status: 303 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
