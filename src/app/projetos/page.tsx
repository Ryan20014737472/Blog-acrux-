import { ProjectsIndex } from "@/features/projects/projects-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/projetos/",
  title: "Projetos",
  description: "Conheça os projetos de engenharia, robótica e impacto STEAM da ACRUX ROBOCEP.",
});

export default function ProjectsPage() { return <ProjectsIndex />; }

