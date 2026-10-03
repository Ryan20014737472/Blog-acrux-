import { TeamIndex } from "@/features/team/team-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/equipe/",
  title: "Equipe",
  description: "Conheça os integrantes e áreas da ACRUX ROBOCEP.",
});

export default function TeamPage() {
  return <TeamIndex />;
}
