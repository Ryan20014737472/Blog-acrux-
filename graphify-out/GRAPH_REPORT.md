# Graph Report - Blog-acrux-audit-fixes  (2026-10-03)

## Corpus Check
- 140 files · ~59,235 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 748 nodes · 1885 edges · 59 communities (38 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e462193`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
- admin-section.tsx
- package.json
- getSupabasePublicConfig
- createSupabaseBrowserClient
- robots-manager.tsx
- publicPageMetadata
- projects-manager.tsx
- index.ts
- compilerOptions
- content.ts
- ArrowLink
- ACRUX ROBOCEP — site oficial
- postcss.config.mjs
- AGENTS.md
- client.ts
- competitions-manager.tsx
- BlogIndex
- about-manager.tsx
- GalleryIndex
- 20260904000000_initial_acrux_schema.sql
- competitions-index.tsx
- temporadas/page.tsx
- blog-index.tsx
- hero.tsx
- deno.json
- functions/README.md
- blog-manager.tsx
- sponsors-manager.tsx
- react
- gallery-manager.tsx
- SiteLogo
- layout.tsx
- seasons-manager.tsx
- team-index.tsx
- getPublicImageUrl
- uploadPublicImage
- password-recovery-form.tsx
- 20261003000738_repair_gallery_cover_on_image_delete.sql
- competicoes/[slug]/page.tsx
- Correções da auditoria de 2 de outubro de 2026
- 20260922020000_home_gallery_featured_limit.sql
- public.team_members
- 20260905000000_refine_editor_permissions.sql
- 20260922010000_home_team_featured_limit.sql
- 20260924234002_about_page.sql
- 20260924010000_team_area_order.sql
- save-post.test.sql

## God Nodes (most connected - your core abstractions)
1. `createSupabaseBrowserClient()` - 113 edges
2. `react` - 52 edges
3. `next` - 44 edges
4. `getPublicImageUrl()` - 34 edges
5. `ArrowLink()` - 33 edges
6. `Database` - 28 edges
7. `AdminWorkspace()` - 26 edges
8. `slugify()` - 26 edges
9. `focusAdminEditor()` - 25 edges
10. `ProjectsManager()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Comportamento corrigido` --references--> `ScrollReveal()`  [INFERRED]
  docs/audit-remediation.md → src/components/animations/scroll-reveal.tsx
- `Supabase` --references--> `robots()`  [INFERRED]
  README.md → src/app/robots.ts
- `draft()` --calls--> `emptyCompetitionDraft()`  [EXTRACTED]
  tests/competition-form.test.mjs → src/features/admin/competition-form-model.ts
- `valid()` --calls--> `emptyProject()`  [EXTRACTED]
  tests/project-form.test.mjs → src/features/admin/project-form-model.ts
- `draft()` --calls--> `emptyRobot()`  [EXTRACTED]
  tests/robot-form.test.mjs → src/features/admin/robot-form-model.ts

## Import Cycles
- None detected.

## Communities (59 total, 21 thin omitted)

### Community 0 - "next"
Cohesion: 0.23
Nodes (9): nextConfig, next, dynamic, dynamic, sitemap(), publicNavigation, siteConfig, PublicPageMetadataOptions (+1 more)

### Community 1 - "admin-section.tsx"
Cohesion: 0.05
Nodes (58): AdminPage(), metadata, AdminSectionPage(), AdminSectionPageProps, dynamicParams, metadata, sections, AdminConfirmationProvider() (+50 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (39): compat, eslintConfig, dependencies, gsap, motion, next, react, react-dom (+31 more)

### Community 3 - "getSupabasePublicConfig"
Cohesion: 0.15
Nodes (13): @supabase/ssr, @supabase/supabase-js, ActivateAccountForm(), ActivationState, AdminAccess, getAdminAccess(), requireAdminAccess(), createActivationClient() (+5 more)

### Community 4 - "createSupabaseBrowserClient"
Cohesion: 0.22
Nodes (15): AdminWorkspace(), signOut(), GalleryImageEditor(), deleteImage(), saveImage(), getNumber(), TeamManager(), addArea() (+7 more)

### Community 5 - "robots-manager.tsx"
Cohesion: 0.16
Nodes (22): metadata, RobotsPage(), editableSpecifications(), emptyRobot(), isTextList(), RobotDraft, robotPayload(), RobotRow (+14 more)

### Community 6 - "publicPageMetadata"
Cohesion: 0.11
Nodes (18): BlogPostPage(), BlogPostPageProps, dynamicParams, generateMetadata(), dynamicParams, generateMetadata(), TeamMemberDetailPage(), TeamMemberDetailPageProps (+10 more)

### Community 7 - "projects-manager.tsx"
Cohesion: 0.17
Nodes (21): emptyProject(), projectCategories, ProjectDraft, projectPayload(), ProjectRow, projectToDraft(), ProjectForm(), Props (+13 more)

### Community 8 - "index.ts"
Cohesion: 0.10
Nodes (10): Account, createHandler(), Profile, Role, roles, UserService, options, update() (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 10 - "content.ts"
Cohesion: 0.20
Nodes (9): PublicContentService, Competition, Post, Project, Robot, Season, Sponsor, TeamArea (+1 more)

### Community 11 - "ArrowLink"
Cohesion: 0.25
Nodes (16): NotFound(), Home(), metadata, ArrowLink(), AboutPreview(), GalleryPreviewCards(), HomePage(), AchievementsAndCompetitionPreview() (+8 more)

### Community 12 - "ACRUX ROBOCEP — site oficial"
Cohesion: 0.22
Nodes (8): ACRUX ROBOCEP — site oficial, Configuração local, Conteúdo pendente, Estrutura principal, Logo, Stack, Supabase, robots()

### Community 16 - "client.ts"
Cohesion: 0.11
Nodes (21): PlaceholderMedia(), PlaceholderMediaProps, Album, CompetitionRelationsProps, Member, GalleryImageRow, GalleryRow, Gallery (+13 more)

### Community 17 - "competitions-manager.tsx"
Cohesion: 0.19
Nodes (22): CompetitionForm(), CompetitionFormProps, CompetitionDraft, competitionError(), CompetitionRow, competitionToDraft(), editableAwards(), emptyCompetitionDraft() (+14 more)

### Community 18 - "BlogIndex"
Cohesion: 0.24
Nodes (10): BlogPage(), metadata, BlogIndex(), closePost(), copyPostLink(), loadPosts(), openPost(), updatePostUrl() (+2 more)

### Community 19 - "about-manager.tsx"
Cohesion: 0.13
Nodes (17): gsap, AboutPage(), metadata, AboutContentView(), AboutContent, aboutFromRow(), AboutMilestone, aboutPlaceholder (+9 more)

### Community 20 - "GalleryIndex"
Cohesion: 0.25
Nodes (4): GalleryPage(), metadata, GalleryIndex(), loadGallery()

### Community 21 - "20260904000000_initial_acrux_schema.sql"
Cohesion: 0.10
Nodes (37): achievements_set_updated_at, competitions_public_index, competitions_set_updated_at, galleries_public_index, galleries_set_updated_at, on_auth_user_created, posts_public_index, posts_set_updated_at (+29 more)

### Community 22 - "competitions-index.tsx"
Cohesion: 0.29
Nodes (8): CompetitionsPage(), metadata, Competition, CompetitionDate(), CompetitionsIndex(), loadCompetitions(), dateFormatter, normalizeSearch()

### Community 23 - "temporadas/page.tsx"
Cohesion: 0.50
Nodes (4): metadata, SeasonsPage(), addCounts(), SeasonsIndex()

### Community 24 - "blog-index.tsx"
Cohesion: 0.25
Nodes (8): CategoryRow, PostCategoryRow, PostRow, PublicPost, PostImage(), PostImageProps, NewsPreviewCards(), Post

### Community 25 - "hero.tsx"
Cohesion: 0.47
Nodes (4): branches, HeroConstellation(), stars, Hero()

### Community 26 - "deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 30 - "blog-manager.tsx"
Cohesion: 0.11
Nodes (25): BlogManager(), createCategory(), deletePost(), savePost(), selectDraft(), updateTitle(), BlogManagerProps, CategoryRow (+17 more)

### Community 31 - "sponsors-manager.tsx"
Cohesion: 0.18
Nodes (16): useAdminDraftProtection(), compareSponsors(), normalizedSponsorTier(), SponsorTier, sponsorTiers, blank, Draft, fromRow() (+8 more)

### Community 32 - "react"
Cohesion: 0.19
Nodes (8): motion, react, ScrollReveal(), ScrollRevealProps, PlaceholderPageProps, ArrowLinkProps, Member, cn()

### Community 33 - "gallery-manager.tsx"
Cohesion: 0.17
Nodes (15): emptyDraft, GalleryDraft, GalleryImageRow, GalleryManager(), deleteGallery(), imageDeleted(), saveGallery(), selectGallery() (+7 more)

### Community 34 - "SiteLogo"
Cohesion: 0.22
Nodes (9): ActivateAccountPage(), metadata, AdminLoginPage(), metadata, LoginErrorNotice(), LoginForm(), handleSubmit(), SiteLogo() (+1 more)

### Community 35 - "layout.tsx"
Cohesion: 0.24
Nodes (7): metadata, RootLayout(), RootLayoutProps, siteUrl, viewport, Footer(), Header()

### Community 36 - "seasons-manager.tsx"
Cohesion: 0.31
Nodes (9): useAdminConfirm(), blank, Draft, fromRow(), Season, SeasonsManager(), remove(), save() (+1 more)

### Community 37 - "team-index.tsx"
Cohesion: 0.31
Nodes (7): metadata, TeamPage(), TeamAreaRow, TeamIndex(), loadMembers(), TeamMemberRow, groupTeamMembers()

### Community 38 - "getPublicImageUrl"
Cohesion: 0.33
Nodes (7): metadata, ProjectsPage(), sponsorCards(), ProjectsIndex(), load(), load(), getPublicImageUrl()

### Community 39 - "uploadPublicImage"
Cohesion: 0.29
Nodes (8): uploadImages(), chooseFile(), chooseFile(), uploadLogo(), uploadPhoto(), createStoragePath(), uploadPublicImage(), validateImageFile()

### Community 40 - "password-recovery-form.tsx"
Cohesion: 0.43
Nodes (5): metadata, PasswordRecoveryPage(), getActivationUrl(), PasswordRecoveryForm(), handleSubmit()

### Community 41 - "20261003000738_repair_gallery_cover_on_image_delete.sql"
Cohesion: 0.47
Nodes (3): gallery_images_lock_album_before_delete, gallery_images_repair_cover_after_delete, private.repair_gallery_cover_after_image_delete()

### Community 42 - "competicoes/[slug]/page.tsx"
Cohesion: 0.33
Nodes (4): CompetitionDetailPage(), CompetitionDetailPageProps, dynamicParams, generateMetadata()

### Community 43 - "Correções da auditoria de 2 de outubro de 2026"
Cohesion: 0.40
Nodes (4): Banco e publicação, Comportamento corrigido, Correções da auditoria de 2 de outubro de 2026, Verificação

## Knowledge Gaps
- **187 isolated node(s):** `compat`, `eslintConfig`, `nextConfig`, `name`, `version` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 257 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseBrowserClient()` connect `createSupabaseBrowserClient` to `admin-section.tsx`, `getSupabasePublicConfig`, `robots-manager.tsx`, `projects-manager.tsx`, `ArrowLink`, `client.ts`, `competitions-manager.tsx`, `BlogIndex`, `about-manager.tsx`, `GalleryIndex`, `competitions-index.tsx`, `temporadas/page.tsx`, `blog-index.tsx`, `blog-manager.tsx`, `sponsors-manager.tsx`, `react`, `gallery-manager.tsx`, `SiteLogo`, `seasons-manager.tsx`, `team-index.tsx`, `getPublicImageUrl`, `uploadPublicImage`, `password-recovery-form.tsx`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `admin-section.tsx`, `package.json`, `getSupabasePublicConfig`, `robots-manager.tsx`, `publicPageMetadata`, `projects-manager.tsx`, `client.ts`, `competitions-manager.tsx`, `about-manager.tsx`, `blog-index.tsx`, `hero.tsx`, `blog-manager.tsx`, `sponsors-manager.tsx`, `react`, `SiteLogo`, `layout.tsx`, `getPublicImageUrl`, `password-recovery-form.tsx`, `competicoes/[slug]/page.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `next`, `admin-section.tsx`, `package.json`, `getSupabasePublicConfig`, `robots-manager.tsx`, `projects-manager.tsx`, `client.ts`, `competitions-manager.tsx`, `about-manager.tsx`, `competitions-index.tsx`, `blog-index.tsx`, `hero.tsx`, `blog-manager.tsx`, `sponsors-manager.tsx`, `gallery-manager.tsx`, `SiteLogo`, `layout.tsx`, `seasons-manager.tsx`, `team-index.tsx`, `getPublicImageUrl`, `password-recovery-form.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `compat`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin-section.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05228070175438596 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `publicPageMetadata` be split into smaller, more focused modules?**
  _Cohesion score 0.11076923076923077 - nodes in this community are weakly interconnected._