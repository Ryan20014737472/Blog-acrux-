/**
 * Initial Supabase contract aligned with the migration in `supabase/migrations`.
 * Regenerate this file with `supabase gen types typescript` after connecting a
 * production project, then keep the generated output as the source of truth.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Role = "admin" | "editor" | "visitor";
type Status = "draft" | "published" | "archived";
type EmptyRelationships = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar_path: string | null; role: Role; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; avatar_path?: string | null; role?: Role };
        Update: { display_name?: string | null; avatar_path?: string | null; role?: Role };
        Relationships: EmptyRelationships;
      };
      seasons: {
        Row: { id: string; slug: string; label: string; year: number; summary: string | null; is_current: boolean; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; label: string; year: number; summary?: string | null; is_current?: boolean; is_published?: boolean };
        Update: { slug?: string; label?: string; year?: number; summary?: string | null; is_current?: boolean; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      team_members: {
        Row: { id: string; profile_id: string | null; slug: string; name: string; area: string | null; role_title: string | null; short_bio: string | null; photo_path: string | null; display_order: number; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; profile_id?: string | null; slug: string; name: string; area?: string | null; role_title?: string | null; short_bio?: string | null; photo_path?: string | null; display_order?: number; is_published?: boolean };
        Update: { profile_id?: string | null; slug?: string; name?: string; area?: string | null; role_title?: string | null; short_bio?: string | null; photo_path?: string |null; display_order?: number; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      categories: {
        Row: { id: string; slug: string; name: string; description: string | null; created_at: string };
        Insert: { id?: string; slug: string; name: string; description?: string | null };
        Update: { slug?: string; name?: string; description?: string | null };
        Relationships: EmptyRelationships;
      };
      projects: {
        Row: { id: string; season_id: string | null; slug: string; title: string; category: string; description: string | null; cover_path: string | null; body: string | null; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; season_id?: string | null; slug: string; title: string; category: string; description?: string | null; cover_path?: string | null; body?: string | null; is_published?: boolean };
        Update: { season_id?: string | null; slug?: string; title?: string; category?: string; description?: string | null; cover_path?: string | null; body?: string | null; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      competitions: {
        Row: { id: string; season_id: string | null; slug: string; organization: string | null; event_name: string; starts_at: string | null; ends_at: string | null; location: string | null; result: string | null; awards: Json; report: string | null; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; season_id?: string | null; slug: string; organization?: string | null; event_name: string; starts_at?: string | null; ends_at?: string | null; location?: string | null; result?: string | null; awards?: Json; report?: string | null; is_published?: boolean };
        Update: { season_id?: string | null; slug?: string; organization?: string | null; event_name?: string; starts_at?: string | null; ends_at?: string | null; location?: string | null; result?: string | null; awards?: Json; report?: string | null; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      robots: {
        Row: { id: string; season_id: string | null; slug: string; name: string; description: string | null; mechanisms: Json; components: Json; specifications: Json; cover_path: string | null; cad_embed_url: string | null; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; season_id?: string | null; slug: string; name: string; description?: string | null; mechanisms?: Json; components?: Json; specifications?: Json; cover_path?: string | null; cad_embed_url?: string | null; is_published?: boolean };
        Update: { season_id?: string | null; slug?: string; name?: string; description?: string | null; mechanisms?: Json; components?: Json; specifications?: Json; cover_path?: string | null; cad_embed_url?: string | null; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      achievements: {
        Row: { id: string; season_id: string | null; competition_id: string | null; title: string; achieved_on: string | null; placement: string | null; description: string | null; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; season_id?: string | null; competition_id?: string | null; title: string; achieved_on?: string | null; placement?: string | null; description?: string | null; is_published?: boolean };
        Update: { season_id?: string | null; competition_id?: string | null; title?: string; achieved_on?: string | null; placement?: string | null; description?: string | null; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      galleries: {
        Row: { id: string; season_id: string | null; competition_id: string | null; project_id: string | null; slug: string; title: string; category: string | null; description: string | null; cover_path: string | null; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; season_id?: string | null; competition_id?: string | null; project_id?: string | null; slug: string; title: string; category?: string | null; description?: string | null; cover_path?: string | null; is_published?: boolean };
        Update: { season_id?: string | null; competition_id?: string | null; project_id?: string | null; slug?: string; title?: string; category?: string | null; description?: string | null; cover_path?: string | null; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      gallery_images: {
        Row: { id: string; gallery_id: string; storage_bucket: string; storage_path: string; alt_text: string; caption: string | null; display_order: number; created_at: string };
        Insert: { id?: string; gallery_id: string; storage_bucket?: string; storage_path: string; alt_text: string; caption?: string | null; display_order?: number };
        Update: { gallery_id?: string; storage_bucket?: string; storage_path?: string; alt_text?: string; caption?: string | null; display_order?: number };
        Relationships: EmptyRelationships;
      };
      posts: {
        Row: { id: string; season_id: string | null; author_id: string | null; slug: string; title: string; excerpt: string; body: string; cover_path: string | null; tags: string[]; status: Status; is_featured: boolean; published_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; season_id?: string | null; author_id?: string | null; slug: string; title: string; excerpt: string; body: string; cover_path?: string | null; tags?: string[]; status?: Status; is_featured?: boolean; published_at?: string | null };
        Update: { season_id?: string | null; author_id?: string | null; slug?: string; title?: string; excerpt?: string; body?: string; cover_path?: string | null; tags?: string[]; status?: Status; is_featured?: boolean; published_at?: string | null };
        Relationships: EmptyRelationships;
      };
      post_categories: {
        Row: { post_id: string; category_id: string };
        Insert: { post_id: string; category_id: string };
        Update: { post_id?: string; category_id?: string };
        Relationships: EmptyRelationships;
      };
      sponsors: {
        Row: { id: string; name: string; website_url: string | null; logo_path: string | null; tier: string | null; display_order: number; is_published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; website_url?: string | null; logo_path?: string | null; tier?: string | null; display_order?: number; is_published?: boolean };
        Update: { name?: string; website_url?: string | null; logo_path?: string | null; tier?: string | null; display_order?: number; is_published?: boolean };
        Relationships: EmptyRelationships;
      };
      media_assets: {
        Row: { id: string; bucket_id: string; storage_path: string; alt_text: string | null; caption: string | null; uploaded_by: string | null; created_at: string };
        Insert: { id?: string; bucket_id: string; storage_path: string; alt_text?: string | null; caption?: string | null; uploaded_by?: string | null };
        Update: { bucket_id?: string; storage_path?: string; alt_text?: string | null; caption?: string | null; uploaded_by?: string | null };
        Relationships: EmptyRelationships;
      };
      robot_team_members: {
        Row: { robot_id: string; team_member_id: string };
        Insert: { robot_id: string; team_member_id: string };
        Update: { robot_id?: string; team_member_id?: string };
        Relationships: EmptyRelationships;
      };
      project_team_members: {
        Row: { project_id: string; team_member_id: string };
        Insert: { project_id: string; team_member_id: string };
        Update: { project_id?: string; team_member_id?: string };
        Relationships: EmptyRelationships;
      };
      competition_team_members: {
        Row: { competition_id: string; team_member_id: string };
        Insert: { competition_id: string; team_member_id: string };
        Update: { competition_id?: string; team_member_id?: string };
        Relationships: EmptyRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_editor: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { app_role: Role; publication_status: Status };
    CompositeTypes: Record<string, never>;
  };
}

