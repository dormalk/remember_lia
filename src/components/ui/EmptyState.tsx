import type { ReactNode } from "react";

/**
 * Shared, presentation-only placeholder for any section whose content hasn't
 * been populated yet (FR12 / PRD §5.4 — the page must look complete and
 * trustworthy while content arrives gradually). Every `*Section` component
 * renders this instead of leaving a blank gap or a broken element.
 */
export function EmptyState({
  message,
  icon,
  className,
}: {
  message: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.03] px-6 py-10 text-center ${className ?? ""}`}
    >
      {icon}
      <p className="max-w-xs text-base leading-relaxed text-foreground/70">{message}</p>
    </div>
  );
}
