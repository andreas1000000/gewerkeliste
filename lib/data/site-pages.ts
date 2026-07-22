import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import {
  defaultPageContent,
  editablePageDefinitions,
  normalizePageContent,
  type EditablePageContent,
  type EditablePageKey,
} from "@/lib/site-page-content";

type SitePageRow = {
  page_key: string;
  draft_content: unknown;
  published_content: unknown;
  updated_at: string | null;
  published_at: string | null;
};

export type AdminSitePage = {
  key: EditablePageKey;
  label: string;
  description: string;
  draft: EditablePageContent;
  published: EditablePageContent;
  updatedAt: string | null;
  publishedAt: string | null;
};

export async function getPublishedPageContent(pageKey: EditablePageKey) {
  if (!isSupabaseConfigured()) return defaultPageContent[pageKey];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_page_content")
      .select("published_content")
      .eq("page_key", pageKey)
      .maybeSingle();

    if (error || !data) return defaultPageContent[pageKey];
    return normalizePageContent(pageKey, data.published_content);
  } catch {
    return defaultPageContent[pageKey];
  }
}

export async function getAdminSitePages(): Promise<AdminSitePage[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_page_content")
    .select("page_key, draft_content, published_content, updated_at, published_at")
    .in("page_key", editablePageDefinitions.map((page) => page.key));

  if (error) throw new Error(error.message);

  const rows = new Map((data as SitePageRow[] | null)?.map((row) => [row.page_key, row]) || []);
  return editablePageDefinitions.map((definition) => {
    const row = rows.get(definition.key);
    return {
      ...definition,
      key: definition.key,
      draft: normalizePageContent(definition.key, row?.draft_content),
      published: normalizePageContent(definition.key, row?.published_content),
      updatedAt: row?.updated_at || null,
      publishedAt: row?.published_at || null,
    };
  });
}
