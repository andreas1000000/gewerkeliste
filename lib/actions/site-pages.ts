"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEditablePageKey, normalizePageContent, type EditablePageKey } from "@/lib/site-page-content";

export async function saveSitePageDraft(formData: FormData) {
  const pageKey = readPageKey(formData);
  const content = readContent(formData, pageKey);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_page_content").upsert(
    {
      page_key: pageKey,
      draft_content: content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_key" },
  );

  if (error) throw new Error(error.message);
  revalidateEditor(pageKey);
}

export async function publishSitePage(formData: FormData) {
  const pageKey = readPageKey(formData);
  const content = readContent(formData, pageKey);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_page_content").upsert(
    {
      page_key: pageKey,
      draft_content: content,
      published_content: content,
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    },
    { onConflict: "page_key" },
  );

  if (error) throw new Error(error.message);
  revalidateEditor(pageKey);
  revalidatePath(publicPath(pageKey));
}

function readPageKey(formData: FormData) {
  const value = String(formData.get("page_key") || "");
  if (!isEditablePageKey(value)) throw new Error("Unbekannte Seite.");
  return value;
}

function readContent(formData: FormData, pageKey: EditablePageKey) {
  const raw = String(formData.get("content_json") || "{}");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Der Seiteninhalt ist nicht lesbar.");
  }
  return normalizePageContent(pageKey, value);
}

function revalidateEditor(pageKey: EditablePageKey) {
  revalidatePath("/admin/site-editor");
  revalidatePath(publicPath(pageKey));
}

function publicPath(pageKey: EditablePageKey) {
  if (pageKey === "home") return "/";
  if (pageKey === "prices") return "/preise";
  return "/ueber-gewerkeliste";
}
