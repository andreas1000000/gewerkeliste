"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function hideCompanyFromPublicDirectory(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .update({ public_visible: false })
    .eq("id", id)
    .select("slug")
    .single();

  if (error) throw error;
  revalidateCompanyViews(data?.slug || "");
}

export async function restoreCompanyToPublicDirectory(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .update({ public_visible: true })
    .eq("id", id)
    .select("slug")
    .single();

  if (error) throw error;
  revalidateCompanyViews(data?.slug || "");
}

function revalidateCompanyViews(slug: string) {
  revalidatePath("/admin/companies");
  revalidatePath("/betriebe");
  revalidatePath("/suche");
  revalidatePath("/gewerke");
  revalidatePath("/");
  if (slug) revalidatePath(`/firma/${slug}`);
}
