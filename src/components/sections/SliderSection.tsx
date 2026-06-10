"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState, useSyncExternalStore, type KeyboardEvent, type TouchEvent } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import type { SliderImage } from "@/lib/content-schema";

const AUTO_ADVANCE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// useSyncExternalStore (not useState+useEffect) is the React-recommended way to read a
// browser API like matchMedia: it has no client-only initial render, so it can't mismatch
// the server-rendered HTML, and there's no setState-in-effect cascade to worry about.
function subscribeToReducedMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function SliderPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-10 w-10 text-foreground/40"
    >
      <rect x="3" y="6" width="14" height="12" rx="2" />
      <rect x="7" y="3" width="14" height="12" rx="2" />
      <circle cx="12.5" cy="9.5" r="1.25" />
      <path d="m9 15 2.5-2.5a1.5 1.5 0 0 1 2.12 0L17 15" />
    </svg>
  );
}

/**
 * Chevron pointing toward the reading-order "start" (right under dir="rtl")
 * or "end" (left) — see the RTL navigation note in SliderSection below.
 */
function ChevronIcon({ pointing }: { pointing: "start" | "end" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`h-5 w-5 ${pointing === "end" ? "rotate-180" : ""}`}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M7 5v14l12-7z" />
    </svg>
  );
}

type PlaybackState = "playing" | "paused";

function togglePlaybackState(state: PlaybackState): PlaybackState {
  return state === "playing" ? "paused" : "playing";
}

const controlButtonClassName =
  "flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/**
 * Gallery of the memorialized person's photos (FR3 / PRD §4.2). The first
 * interactive section in the project — owns local UI state (current slide,
 * playback, reduced-motion preference), exactly the "local client state"
 * the architecture reserves for useState/useReducer. Still presentation-only
 * with respect to data: receives validated content as a prop, never fetches.
 */
export function SliderSection({ slider }: { slider: SliderImage[] }) {
  const [index, setIndex] = useState(0);
  const [playback, togglePlayback] = useReducer(togglePlaybackState, "playing");
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotionPreference,
    getReducedMotionPreference,
    getReducedMotionServerSnapshot,
  );
  const touchStartXRef = useRef<number | null>(null);

  const hasMultiple = slider.length > 1;

  useEffect(() => {
    if (!hasMultiple || playback === "paused" || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slider.length);
    }, AUTO_ADVANCE_INTERVAL_MS);

    // Re-running on every `index` change is what gives manual navigation its
    // "temporarily suspend, then resume" behavior (AC2): any manual move
    // (arrow/dot/swipe) clears this timer and starts a fresh one, so the next
    // auto-advance always lands a full interval after the visitor's last action
    // — distinct from the persistent `paused` state, which this effect skips entirely.
    return () => clearInterval(timer);
  }, [hasMultiple, playback, prefersReducedMotion, slider.length, index]);

  if (slider.length === 0) {
    return (
      <section className="flex w-full flex-col items-center gap-3 px-6 py-10">
        <EmptyState message="התמונות יתווספו בקרוב" icon={<SliderPlaceholderIcon />} />
      </section>
    );
  }

  const current = slider[index];

  const goToNext = () => setIndex((value) => (value + 1) % slider.length);
  const goToPrevious = () => setIndex((value) => (value - 1 + slider.length) % slider.length);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToNext(); // RTL: ArrowLeft = toward logical end = next slide
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToPrevious(); // RTL: ArrowRight = toward logical start = previous slide
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    // RTL navigation: under dir="rtl" the "next" photo sits toward the
    // reading-order end (visually left, where the left-pointing arrow below
    // also lives), so a rightward drag — pulling that hidden content into
    // view — means "next". This mirrors the familiar LTR "swipe left = next".
    if (deltaX > 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="גלריית תמונות"
      className="flex w-full flex-col items-center gap-4 px-6 py-10"
    >
      {hasMultiple ? (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {`תמונה ${index + 1} מתוך ${slider.length}`}
        </div>
      ) : null}
      <div
        className="relative w-full max-w-md touch-pan-y"
        tabIndex={hasMultiple ? 0 : undefined}
        onKeyDown={hasMultiple ? handleKeyDown : undefined}
        onTouchStart={hasMultiple ? handleTouchStart : undefined}
        onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
      >
        <div
          role="group"
          aria-roledescription="שקופית"
          aria-label={`תמונה ${index + 1} מתוך ${slider.length}`}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
        >
          <Image
            src={current.imageUrl}
            alt={current.caption}
            fill
            sizes="(min-width: 640px) 28rem, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goToNext}
              aria-label="התמונה הבאה"
              className={`absolute top-1/2 end-3 -translate-y-1/2 ${controlButtonClassName}`}
            >
              <ChevronIcon pointing="end" />
            </button>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="התמונה הקודמת"
              className={`absolute top-1/2 start-3 -translate-y-1/2 ${controlButtonClassName}`}
            >
              <ChevronIcon pointing="start" />
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              aria-pressed={playback === "paused"}
              aria-label={
                playback === "playing" ? "השהה את התצוגה האוטומטית" : "המשך את התצוגה האוטומטית"
              }
              className={`absolute bottom-3 end-3 ${controlButtonClassName}`}
            >
              {playback === "playing" ? <PauseIcon /> : <PlayIcon />}
            </button>
          </>
        ) : null}
      </div>

      {current.caption.trim() ? (
        <p className="max-w-md text-center text-base text-foreground/80">{current.caption}</p>
      ) : null}

      {hasMultiple ? (
        <div className="flex items-center gap-2">
          {slider.map((image, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => setIndex(dotIndex)}
              aria-label={`עבור לתמונה ${dotIndex + 1}`}
              aria-current={dotIndex === index}
              className={`h-2.5 w-2.5 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                dotIndex === index ? "bg-foreground" : "bg-foreground/25 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
