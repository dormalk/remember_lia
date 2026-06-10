import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { LogoSection } from "@/components/sections/LogoSection";
import { ShareSection } from "@/components/sections/ShareSection";
import { SliderSection } from "@/components/sections/SliderSection";
import { SocialLinksSection } from "@/components/sections/SocialLinksSection";
import { StorySection } from "@/components/sections/StorySection";
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
      <StorySection story={content.story} />
      <ArticlesSection articles={content.articles} />
      <SocialLinksSection social={content.social} />
      <ContactSection contact={content.contact} />
      <ShareSection share={content.share} />
    </main>
  );
}
