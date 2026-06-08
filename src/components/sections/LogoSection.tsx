import Image from "next/image";

import { EmptyState } from "@/components/ui/EmptyState";
import type { Logo } from "@/lib/content-schema";

function LogoPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-10 w-10 text-foreground/40"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.75" />
      <path d="m4 17 4.5-4.5a2 2 0 0 1 2.83 0L17 18" />
    </svg>
  );
}

/**
 * First section a visitor sees after scanning the QR code (PRD §3 / §4.1).
 * Presentation-only: receives validated content as a prop and renders —
 * never fetches data itself (that stays `app/page.tsx`'s job).
 */
export function LogoSection({ logo }: { logo: Logo }) {
  return (
    <section className="flex w-full flex-col items-center gap-3 px-6 pt-12 pb-6 sm:pt-16">
      {logo.imageUrl ? (
        <div className="relative h-28 w-28 sm:h-32 sm:w-32">
          <Image
            src={logo.imageUrl}
            alt={logo.title}
            fill
            sizes="(min-width: 640px) 8rem, 7rem"
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <EmptyState message="הלוגו יתווסף בקרוב" icon={<LogoPlaceholderIcon />} />
      )}
      {logo.title ? (
        <p className="text-center text-lg font-medium text-foreground">{logo.title}</p>
      ) : null}
    </section>
  );
}
