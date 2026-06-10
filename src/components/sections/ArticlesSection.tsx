import type { Article } from "@/lib/content-schema";

import { EmptyState } from "@/components/ui/EmptyState";

function ArticlesPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-10 w-10 text-foreground/40"
    >
      <path d="M4 6h16M4 10h10M4 14h12M4 18h8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * News/media article links section (FR6 / PRD §4.4). Articles with empty
 * url or title are filtered out — they cannot fulfill the "opens in a new tab"
 * requirement and must not render as broken links.
 */
export function ArticlesSection({ articles }: { articles: Article[] }) {
  const populated = articles.filter((a) => a.url.trim() && a.title.trim());

  if (populated.length === 0) {
    return (
      <section className="flex w-full flex-col items-center gap-3 px-6 py-10">
        <EmptyState message="הכתבות יתווספו בקרוב" icon={<ArticlesPlaceholderIcon />} />
      </section>
    );
  }

  return (
    <section className="w-full px-6 py-10">
      <ul className="mx-auto flex w-full max-w-md flex-col gap-3">
        {populated.map((article, index) => (
          <li key={index}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 transition hover:bg-foreground/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="text-base font-medium leading-snug">{article.title}</span>
              {article.sourceName.trim() ? (
                <span className="text-sm text-foreground/60">{article.sourceName}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
