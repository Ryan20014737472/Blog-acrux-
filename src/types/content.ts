export type UserRole = "admin" | "editor" | "visitor";
export type PublicationStatus = "draft" | "published" | "archived";

export type TeamArea =
  | "CAD"
  | "Programação"
  | "Mecânica"
  | "Elétrica"
  | "Gestão"
  | "Marketing"
  | "Impacto STEAM";

export interface Season {
  id: string;
  slug: string;
  label: string;
  year: number;
  summary: string | null;
  isCurrent: boolean;
  isPublished: boolean;
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  area: TeamArea | null;
  roleTitle: string | null;
  shortBio: string | null;
  photoPath: string | null;
  isPublished: boolean;
}

export interface Robot {
  id: string;
  slug: string;
  name: string;
  seasonId: string | null;
  description: string | null;
  coverPath: string | null;
  mechanisms: string[];
  components: string[];
  isPublished: boolean;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  coverPath: string | null;
  isPublished: boolean;
}

export interface Competition {
  id: string;
  slug: string;
  title: string;
  organization: string | null;
  seasonId: string | null;
  eventDate: string | null;
  location: string | null;
  result: string | null;
  isPublished: boolean;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverPath: string | null;
  authorId: string | null;
  status: PublicationStatus;
  publishedAt: string | null;
  featured: boolean;
  tags: string[];
}

export interface Sponsor {
  id: string;
  name: string;
  websiteUrl: string | null;
  logoPath: string | null;
  tier: string | null;
  isPublished: boolean;
}

