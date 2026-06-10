import { EmptyState } from "@/components/ui/EmptyState";

function StoryPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-10 w-10 text-foreground/40"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Rich-text memorial story section (FR5 / PRD §4.3). Renders sanitized HTML
 * stored in content.story — HTML is sanitized on save via lib/sanitize.ts
 * (architecture "Single Save Path" rule), so dangerouslySetInnerHTML is safe
 * here and sanitize-html must never be imported into this public-bundle component.
 */
export function StorySection({ story }: { story: string }) {
  if (!story.trim()) {
    return (
      <section className="flex w-full flex-col items-center gap-3 px-6 py-10">
        <EmptyState message="הסיפור יתווסף בקרוב" icon={<StoryPlaceholderIcon />} />
      </section>
    );
  }

  return (
    <section className="w-full px-6 py-10">
      <div
        className="rich-text mx-auto max-w-prose"
        dangerouslySetInnerHTML={{ __html: story }}
      />
    </section>
  );
}
