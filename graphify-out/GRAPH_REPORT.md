# Graph Report - Blog-acrux-mail-opening  (2026-10-04)

## Corpus Check
- 155 files · ~74,746 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 908 nodes · 2187 edges · 67 communities (43 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d83c4d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- public-metadata.ts
- react
- package.json
- getSupabasePublicConfig
- createSupabaseBrowserClient
- RobotsManager
- publicPageMetadata
- ProjectsManager
- admin-users/index.ts
- compilerOptions
- users-manager.tsx
- content-notification-mail/handler.ts
- ACRUX ROBOCEP — site oficial
- postcss.config.mjs
- AGENTS.md
- getPublicImageUrl
- competitions-manager.tsx
- blog-index.tsx
- about-content-view.tsx
- GalleryIndex
- 20260904000000_initial_acrux_schema.sql
- competitions-index.tsx
- seasons-index.tsx
- notifications-manager.tsx
- 20261004031230_owner_content_notifications.sql
- deno.json
- functions/README.md
- blog-manager.tsx
- sponsors-preview.tsx
- next
- gallery-manager.tsx
- ArrowLink
- layout.tsx
- admin-section.tsx
- TeamIndex
- sponsors-manager.tsx
- arrow-link.tsx
- team-manager.tsx
- 20261003000738_repair_gallery_cover_on_image_delete.sql
- 20261004031236_configure_content_notification_delivery.sql
- cn
- 20260922020000_home_gallery_featured_limit.sql
- public.team_members
- 20260905000000_refine_editor_permissions.sql
- 20260922010000_home_team_featured_limit.sql
- 20260924234002_about_page.sql
- 20260924010000_team_area_order.sql
- save-post.test.sql
- [section]/page.tsx
- 20261004035248_personalize_content_notification_opening.sql
- pg_temp.assert
- pg_temp.assert
- Notificações privadas de conteúdo
- content-notification-mail/deno.json
- projects-manager.tsx
- Correções da auditoria de 2 de outubro de 2026

## God Nodes (most connected - your core abstractions)
1. `createSupabaseBrowserClient()` - 122 edges
2. `react` - 55 edges
3. `next` - 44 edges
4. `getPublicImageUrl()` - 34 edges
5. `ArrowLink()` - 33 edges
6. `AdminWorkspace()` - 29 edges
7. `Database` - 28 edges
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

## Communities (67 total, 24 thin omitted)

### Community 0 - "public-metadata.ts"
Cohesion: 0.22
Nodes (10): dynamic, robots(), dynamic, sitemap(), adminNavigation, publicNavigation, siteConfig, copyPostLink() (+2 more)

### Community 1 - "react"
Cohesion: 0.12
Nodes (22): react, AdminPage(), metadata, AdminDashboard(), AdminDashboardContent(), signOut(), dashboardCards, AdminGate() (+14 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (39): compat, eslintConfig, dependencies, gsap, motion, next, react, react-dom (+31 more)

### Community 3 - "getSupabasePublicConfig"
Cohesion: 0.13
Nodes (15): @supabase/ssr, @supabase/supabase-js, ActivateAccountPage(), metadata, ActivateAccountForm(), ActivationState, AdminAccess, getAdminAccess() (+7 more)

### Community 4 - "createSupabaseBrowserClient"
Cohesion: 0.20
Nodes (15): Member, RobotMembers(), load(), toggle(), getNumber(), TeamManager(), addArea(), askDeleteArea() (+7 more)

### Community 5 - "RobotsManager"
Cohesion: 0.09
Nodes (40): metadata, RobotsPage(), CompetitionForm(), CompetitionFormProps, CompetitionDraft, competitionError(), CompetitionRow, competitionToDraft() (+32 more)

### Community 6 - "publicPageMetadata"
Cohesion: 0.09
Nodes (22): BlogPostPage(), BlogPostPageProps, dynamicParams, generateMetadata(), CompetitionDetailPage(), CompetitionDetailPageProps, dynamicParams, generateMetadata() (+14 more)

### Community 7 - "ProjectsManager"
Cohesion: 0.16
Nodes (19): metadata, ProjectsPage(), emptyProject(), projectCategories, ProjectDraft, projectPayload(), ProjectRow, projectToDraft() (+11 more)

### Community 8 - "admin-users/index.ts"
Cohesion: 0.11
Nodes (10): Account, createHandler(), Profile, Role, roles, UserService, options, update() (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 10 - "users-manager.tsx"
Cohesion: 0.10
Nodes (25): PostDraft, roleLabels, UserAccessForm(), userField, ManagedUser, usersRequest(), UsersResponse, UsersManager() (+17 more)

### Community 11 - "content-notification-mail/handler.ts"
Cohesion: 0.08
Nodes (31): actionText(), bounded(), createHandler(), sendMail(), dateText(), Dependencies, errorMessages, escapeHtml() (+23 more)

### Community 12 - "ACRUX ROBOCEP — site oficial"
Cohesion: 0.25
Nodes (7): ACRUX ROBOCEP — site oficial, Configuração local, Conteúdo pendente, Estrutura principal, Logo, Stack, Supabase

### Community 16 - "getPublicImageUrl"
Cohesion: 0.14
Nodes (20): PlaceholderMedia(), PlaceholderMediaProps, GalleryImageRow, GalleryRow, Gallery, GalleryPreviewCards(), shapes, Post (+12 more)

### Community 17 - "competitions-manager.tsx"
Cohesion: 0.29
Nodes (6): Album, CompetitionRelations(), changeRelation(), loadRelations(), CompetitionRelationsProps, Member

### Community 18 - "blog-index.tsx"
Cohesion: 0.17
Nodes (15): BlogPage(), metadata, BlogIndex(), closePost(), loadPosts(), openPost(), updatePostUrl(), CategoryRow (+7 more)

### Community 19 - "about-content-view.tsx"
Cohesion: 0.16
Nodes (14): gsap, AboutPage(), metadata, AboutContentView(), AboutContent, aboutFromRow(), AboutMilestone, aboutPlaceholder (+6 more)

### Community 20 - "GalleryIndex"
Cohesion: 0.25
Nodes (4): GalleryPage(), metadata, GalleryIndex(), loadGallery()

### Community 21 - "20260904000000_initial_acrux_schema.sql"
Cohesion: 0.10
Nodes (37): achievements_set_updated_at, competitions_public_index, competitions_set_updated_at, galleries_public_index, galleries_set_updated_at, on_auth_user_created, posts_public_index, posts_set_updated_at (+29 more)

### Community 22 - "competitions-index.tsx"
Cohesion: 0.29
Nodes (8): CompetitionsPage(), metadata, Competition, CompetitionDate(), CompetitionsIndex(), loadCompetitions(), dateFormatter, normalizeSearch()

### Community 23 - "seasons-index.tsx"
Cohesion: 0.31
Nodes (7): metadata, SeasonsPage(), addCounts(), Count, Counts, Season, SeasonsIndex()

### Community 24 - "notifications-manager.tsx"
Cohesion: 0.14
Nodes (30): mailRequest(), NotificationEmailSettings(), save(), saveOpening(), sendTest(), refreshContentNotificationStatus(), ContentNotification, ContentNotificationPage (+22 more)

### Community 25 - "20261004031230_owner_content_notifications.sql"
Cohesion: 0.09
Nodes (10): content_notification_outbox_ready_idx, content_notifications_recipient_cursor_idx, private.content_change_batches, private.content_entity_snapshot(), private.content_notification_config, private.content_notification_email_outbox, private.content_notification_receipts, private.content_notification_status() (+2 more)

### Community 26 - "deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 30 - "blog-manager.tsx"
Cohesion: 0.13
Nodes (23): BlogManager(), createCategory(), deletePost(), savePost(), updateTitle(), uploadImages(), BlogManagerProps, CategoryRow (+15 more)

### Community 31 - "sponsors-preview.tsx"
Cohesion: 0.35
Nodes (8): compareSponsors(), normalizedSponsorTier(), SponsorTier, sponsorTiers, Sponsor, SponsorsPreview(), sponsorCards(), tierStyles

### Community 32 - "next"
Cohesion: 0.17
Nodes (14): nextConfig, next, AdminLoginPage(), metadata, metadata, PasswordRecoveryPage(), LoginErrorNotice(), LoginForm() (+6 more)

### Community 33 - "gallery-manager.tsx"
Cohesion: 0.15
Nodes (18): useAdminConfirm(), emptyDraft, GalleryDraft, GalleryImageEditor(), deleteImage(), saveImage(), GalleryImageRow, GalleryManager() (+10 more)

### Community 34 - "ArrowLink"
Cohesion: 0.23
Nodes (16): NotFound(), Home(), metadata, AdminSetupNotice(), ArrowLink(), AboutPreview(), HomePage(), AchievementsAndCompetitionPreview() (+8 more)

### Community 35 - "layout.tsx"
Cohesion: 0.25
Nodes (6): metadata, RootLayout(), RootLayoutProps, siteUrl, viewport, Footer()

### Community 36 - "admin-section.tsx"
Cohesion: 0.14
Nodes (20): useAdminDraftProtection(), useAdminNavigationProtection(), AdminSection(), AdminSectionContent(), AdminSectionProps, copy, AdminWorkspace(), signOut() (+12 more)

### Community 37 - "TeamIndex"
Cohesion: 0.29
Nodes (6): metadata, TeamPage(), TeamIndex(), groupTeamMembers(), TeamArea, TeamMember

### Community 38 - "sponsors-manager.tsx"
Cohesion: 0.18
Nodes (13): selectDraft(), selectGallery(), blank, Draft, fromRow(), Sponsor, SponsorsManager(), remove() (+5 more)

### Community 39 - "arrow-link.tsx"
Cohesion: 0.24
Nodes (7): motion, PlaceholderPageProps, ArrowLinkProps, branches, HeroConstellation(), stars, Hero()

### Community 40 - "team-manager.tsx"
Cohesion: 0.16
Nodes (16): AdminConfirmationProvider(), AskConfirmation, ConfirmationContext, ConfirmationOptions, AdminDraftProtectionProvider(), AskConfirmation, DraftProtection, DraftProtectionContext (+8 more)

### Community 41 - "20261003000738_repair_gallery_cover_on_image_delete.sql"
Cohesion: 0.47
Nodes (3): gallery_images_lock_album_before_delete, gallery_images_repair_cover_after_delete, private.repair_gallery_cover_after_image_delete()

### Community 42 - "20261004031236_configure_content_notification_delivery.sql"
Cohesion: 0.17
Nodes (4): private.configure_content_notification_mail(), private.content_notification_mail_credentials(), private.content_notification_mail_settings(), private.verify_content_notification_dispatch_token()

### Community 43 - "cn"
Cohesion: 0.29
Nodes (6): ScrollReveal(), ScrollRevealProps, Header(), PostImage(), PostImageProps, cn()

### Community 55 - "[section]/page.tsx"
Cohesion: 0.29
Nodes (5): AdminSectionPage(), AdminSectionPageProps, dynamicParams, metadata, sections

### Community 62 - "Notificações privadas de conteúdo"
Cohesion: 0.50
Nodes (3): Implantação, Notificações privadas de conteúdo, Validação

### Community 63 - "content-notification-mail/deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 64 - "projects-manager.tsx"
Cohesion: 0.29
Nodes (6): Album, Member, ProjectRelations(), changeRelation(), loadRelations(), ProjectRelationsProps

### Community 66 - "Correções da auditoria de 2 de outubro de 2026"
Cohesion: 0.40
Nodes (4): Banco e publicação, Comportamento corrigido, Correções da auditoria de 2 de outubro de 2026, Verificação

## Knowledge Gaps
- **208 isolated node(s):** `compat`, `eslintConfig`, `nextConfig`, `name`, `version` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 319 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseBrowserClient()` connect `createSupabaseBrowserClient` to `react`, `getSupabasePublicConfig`, `RobotsManager`, `ProjectsManager`, `users-manager.tsx`, `getPublicImageUrl`, `competitions-manager.tsx`, `blog-index.tsx`, `about-content-view.tsx`, `GalleryIndex`, `competitions-index.tsx`, `seasons-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `sponsors-preview.tsx`, `next`, `gallery-manager.tsx`, `ArrowLink`, `admin-section.tsx`, `TeamIndex`, `sponsors-manager.tsx`, `team-manager.tsx`, `projects-manager.tsx`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `public-metadata.ts`, `react`, `package.json`, `getSupabasePublicConfig`, `createSupabaseBrowserClient`, `RobotsManager`, `publicPageMetadata`, `ProjectsManager`, `getPublicImageUrl`, `competitions-manager.tsx`, `blog-index.tsx`, `about-content-view.tsx`, `blog-manager.tsx`, `sponsors-preview.tsx`, `layout.tsx`, `admin-section.tsx`, `sponsors-manager.tsx`, `arrow-link.tsx`, `cn`, `projects-manager.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `getSupabasePublicConfig`, `createSupabaseBrowserClient`, `RobotsManager`, `ProjectsManager`, `users-manager.tsx`, `getPublicImageUrl`, `competitions-manager.tsx`, `blog-index.tsx`, `about-content-view.tsx`, `competitions-index.tsx`, `seasons-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `sponsors-preview.tsx`, `next`, `gallery-manager.tsx`, `layout.tsx`, `admin-section.tsx`, `sponsors-manager.tsx`, `arrow-link.tsx`, `team-manager.tsx`, `cn`, `projects-manager.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `compat`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `getSupabasePublicConfig` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._