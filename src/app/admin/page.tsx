import { getContent } from "@/lib/content-store";
import { LogoEditor } from "@/components/admin/LogoEditor";
import { SliderEditor } from "@/components/admin/SliderEditor";
import { ContentEditorForm } from "@/components/admin/ContentEditorForm";
import { logoutAction } from "./actions";

// Admin page must always reflect the latest saved content — never serve a
// cached/stale snapshot across saves.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const content = await getContent();

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold">ניהול תוכן</h1>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-foreground/20 px-4 py-2 text-sm transition hover:bg-foreground/5"
            >
              יציאה
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-6">
          <LogoEditor content={content} />
          <SliderEditor content={content} />
          <ContentEditorForm content={content} />
        </div>
      </div>
    </main>
  );
}
