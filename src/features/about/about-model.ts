import type { Database } from "@/types/database";

export interface AboutMilestone {
  title: string;
  description: string;
}

export interface AboutContent {
  headline: string;
  introduction: string;
  institutionalNote: string;
  mission: string;
  vision: string;
  values: string;
  robocep: string;
  partnersTitle: string;
  partnersBody: string;
  homeHeadline: string;
  homeIntroduction: string;
  homeHistory: string;
  homeMission: string;
  homeValues: string;
  homeTrajectory: string;
  milestones: AboutMilestone[];
  isPublished: boolean;
}

type AboutRow = Database["public"]["Tables"]["about_page"]["Row"];

export const emptyAboutContent: AboutContent = {
  headline: "",
  introduction: "",
  institutionalNote: "",
  mission: "",
  vision: "",
  values: "",
  robocep: "",
  partnersTitle: "",
  partnersBody: "",
  homeHeadline: "",
  homeIntroduction: "",
  homeHistory: "",
  homeMission: "",
  homeValues: "",
  homeTrajectory: "",
  milestones: [],
  isPublished: false,
};

export const aboutPlaceholder: AboutContent = {
  ...emptyAboutContent,
  headline: "Uma história que será preservada por temporadas.",
  introduction: "Esta página está pronta para reunir a origem da equipe, a relação com a ROBOCEP, missão, visão, valores, trajetória e participações em competições.",
  institutionalNote: "Conteúdo da equipe será adicionado posteriormente. Nenhum dado institucional foi inventado nesta etapa.",
  partnersTitle: "Apoiadores e parceiros serão apresentados aqui.",
  partnersBody: "A equipe poderá cadastrar nomes, logotipos e links oficiais pelo painel administrativo.",
};

export function aboutFromRow(row: AboutRow): AboutContent {
  const milestones = Array.isArray(row.milestones) ? row.milestones
    .filter((item): item is { title: string; description: string } => item !== null && typeof item === "object" && !Array.isArray(item) && "title" in item && "description" in item && typeof item.title === "string" && typeof item.description === "string")
    .map(({ title, description }) => ({ title, description })) : [];

  return {
    headline: row.headline,
    introduction: row.introduction,
    institutionalNote: row.institutional_note,
    mission: row.mission,
    vision: row.vision,
    values: row.values_text,
    robocep: row.robocep,
    partnersTitle: row.partners_title,
    partnersBody: row.partners_body,
    homeHeadline: row.home_headline,
    homeIntroduction: row.home_introduction,
    homeHistory: row.home_history,
    homeMission: row.home_mission,
    homeValues: row.home_values,
    homeTrajectory: row.home_trajectory,
    milestones,
    isPublished: row.is_published,
  };
}

