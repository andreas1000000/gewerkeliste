import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "checkout_disabled", message: "Der Checkout ist aktuell noch nicht live." },
    { status: 404 }
  );
}
