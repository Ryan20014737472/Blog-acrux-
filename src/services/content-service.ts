import type { Competition, Post, Project, Robot, Season, Sponsor, TeamMember } from "@/types/content";

/**
 * Future data source contract. Its Supabase-backed implementation belongs here
 * once the project credentials and generated database types are available.
 */
export interface PublicContentService {
  getFeaturedPosts(): Promise<Post[]>;
  getPublishedTeamMembers(): Promise<TeamMember[]>;
  getPublishedRobots(): Promise<Robot[]>;
  getPublishedProjects(): Promise<Project[]>;
  getPublishedCompetitions(): Promise<Competition[]>;
  getPublishedSeasons(): Promise<Season[]>;
  getPublishedSponsors(): Promise<Sponsor[]>;
}

