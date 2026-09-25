import { AboutPreview } from "@/features/home/about-preview";
import { AchievementsAndCompetitionPreview, ClosingCta, GalleryAndSponsorsPreview, NewsPreview, RobotsAndProjectsPreview, TeamPreview } from "@/features/home/home-sections";
import { Hero } from "@/features/home/hero";

export function HomePage() {
  return (
    <main className="home-page">
      <Hero />
      <AboutPreview />
      <NewsPreview />
      <TeamPreview />
      <RobotsAndProjectsPreview />
      <AchievementsAndCompetitionPreview />
      <GalleryAndSponsorsPreview />
      <ClosingCta />
    </main>
  );
}

