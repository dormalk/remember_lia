import { LogoSection } from "@/components/sections/LogoSection";
import { SliderSection } from "@/components/sections/SliderSection";
import { getContent } from "@/lib/content-store";

/**
 * Public memorial page — the only place `getContent()` is called, guaranteeing
 * every section renders from one consistent snapshot. Sections render in the
 * fixed PRD §3 order (Logo → Slider → Story → Articles → Social → Contact);
 * each later story appends its section directly below the previous one here.
 */
export default async function Home() {
  const content = await getContent();

  return (
    <main className="flex min-h-full w-full flex-1 flex-col items-center bg-background">
      <LogoSection logo={content.logo} />
      <SliderSection slider={content.slider} />
    </main>
  );
}
