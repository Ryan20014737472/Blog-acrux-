import { AboutContentView } from "@/features/about/about-content-view";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/sobre/",
  title: "Sobre",
  description: "Conheça a história, propósito e trajetória da ACRUX ROBOCEP.",
});

export default function AboutPage() {
  return <AboutContentView />;
}
