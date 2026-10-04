# Graph Report - Blog-acrux-notifications  (2026-10-04)

## Corpus Check
- 154 files · ~73,493 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 895 nodes · 2169 edges · 66 communities (43 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e46d904`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- public-metadata.ts
- react
- package.json
- getSupabasePublicConfig
- createSupabaseBrowserClient
- robots-manager.tsx
- publicPageMetadata
- projects-manager.tsx
- admin-users/index.ts
- compilerOptions
- content-service.ts
- content-notification-mail/handler.ts
- ACRUX ROBOCEP — site oficial
- postcss.config.mjs
- AGENTS.md
- client.ts
- competitions-manager.tsx
- blog-index.tsx
- ArrowLink
- GalleryIndex
- 20260904000000_initial_acrux_schema.sql
- competitions-index.tsx
- seasons-index.tsx
- notifications-manager.tsx
- 20261004031230_owner_content_notifications.sql
- deno.json
- functions/README.md
- blog-manager.tsx
- sponsors-manager.tsx
- next
- gallery-manager.tsx
- SiteLogo
- layout.tsx
- slugify
- team-index.tsx
- getPublicImageUrl
- uploadPublicImage
- team-manager.tsx
- 20261003000738_repair_gallery_cover_on_image_delete.sql
- 20261004031236_configure_content_notification_delivery.sql
- users-manager.tsx
- 20260922020000_home_gallery_featured_limit.sql
- public.team_members
- 20260905000000_refine_editor_permissions.sql
- 20260922010000_home_team_featured_limit.sql
- 20260924234002_about_page.sql
- 20260924010000_team_area_order.sql
- save-post.test.sql
- admin-section.tsx
- UsersManager
- pg_temp.assert
- pg_temp.assert
- Notificações privadas de conteúdo
- content-notification-mail/deno.json
- AdminWorkspace

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

## Communities (66 total, 23 thin omitted)

### Community 0 - "public-metadata.ts"
Cohesion: 0.24
Nodes (9): Supabase, dynamic, robots(), dynamic, sitemap(), siteConfig, copyPostLink(), PublicPageMetadataOptions (+1 more)

### Community 1 - "react"
Cohesion: 0.15
Nodes (16): react, AdminPage(), metadata, AdminDashboard(), AdminDashboardContent(), signOut(), dashboardCards, AdminGate() (+8 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (39): compat, eslintConfig, dependencies, gsap, motion, next, react, react-dom (+31 more)

### Community 3 - "getSupabasePublicConfig"
Cohesion: 0.18
Nodes (12): @supabase/ssr, @supabase/supabase-js, ActivationState, AdminAccess, getAdminAccess(), requireAdminAccess(), createActivationClient(), createSupabaseAdminClient() (+4 more)

### Community 4 - "createSupabaseBrowserClient"
Cohesion: 0.15
Nodes (20): CompetitionRelations(), changeRelation(), loadRelations(), ProjectRelations(), changeRelation(), loadRelations(), Member, RobotMembers() (+12 more)

### Community 5 - "robots-manager.tsx"
Cohesion: 0.19
Nodes (19): metadata, RobotsPage(), editableSpecifications(), emptyRobot(), isTextList(), RobotDraft, robotPayload(), RobotRow (+11 more)

### Community 6 - "publicPageMetadata"
Cohesion: 0.09
Nodes (23): BlogPostPage(), BlogPostPageProps, dynamicParams, generateMetadata(), CompetitionDetailPage(), CompetitionDetailPageProps, dynamicParams, generateMetadata() (+15 more)

### Community 7 - "projects-manager.tsx"
Cohesion: 0.25
Nodes (16): SeasonOption, emptyProject(), projectCategories, ProjectDraft, projectPayload(), ProjectRow, projectToDraft(), ProjectForm() (+8 more)

### Community 8 - "admin-users/index.ts"
Cohesion: 0.11
Nodes (10): Account, createHandler(), Profile, Role, roles, UserService, options, update() (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 10 - "content-service.ts"
Cohesion: 0.18
Nodes (8): PublicContentService, Competition, Post, Project, Robot, Season, Sponsor, TeamMember

### Community 11 - "content-notification-mail/handler.ts"
Cohesion: 0.09
Nodes (30): actionText(), bounded(), createHandler(), sendMail(), dateText(), Dependencies, errorMessages, escapeHtml() (+22 more)

### Community 12 - "ACRUX ROBOCEP — site oficial"
Cohesion: 0.29
Nodes (6): ACRUX ROBOCEP — site oficial, Configuração local, Conteúdo pendente, Estrutura principal, Logo, Stack

### Community 16 - "client.ts"
Cohesion: 0.12
Nodes (20): PlaceholderMedia(), PlaceholderMediaProps, Album, CompetitionRelationsProps, Member, Album, Member, ProjectRelationsProps (+12 more)

### Community 17 - "competitions-manager.tsx"
Cohesion: 0.23
Nodes (18): CompetitionForm(), CompetitionFormProps, CompetitionDraft, competitionError(), CompetitionRow, competitionToDraft(), editableAwards(), emptyCompetitionDraft() (+10 more)

### Community 18 - "blog-index.tsx"
Cohesion: 0.15
Nodes (17): BlogPage(), metadata, BlogIndex(), closePost(), loadPosts(), openPost(), updatePostUrl(), CategoryRow (+9 more)

### Community 19 - "ArrowLink"
Cohesion: 0.06
Nodes (48): Banco e publicação, Comportamento corrigido, Correções da auditoria de 2 de outubro de 2026, Verificação, gsap, motion, NotFound(), Home() (+40 more)

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
Cohesion: 0.11
Nodes (36): useAdminDraftProtection(), MailReply, mailRequest(), MailSettings, NotificationEmailSettings(), save(), sendTest(), refreshContentNotificationStatus() (+28 more)

### Community 25 - "20261004031230_owner_content_notifications.sql"
Cohesion: 0.09
Nodes (10): content_notification_outbox_ready_idx, content_notifications_recipient_cursor_idx, private.content_change_batches, private.content_entity_snapshot(), private.content_notification_config, private.content_notification_email_outbox, private.content_notification_receipts, private.content_notification_status() (+2 more)

### Community 26 - "deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 30 - "blog-manager.tsx"
Cohesion: 0.15
Nodes (16): BlogManager(), createCategory(), deletePost(), savePost(), updateTitle(), CategoryRow, emptyDraft, ManagedPost (+8 more)

### Community 31 - "sponsors-manager.tsx"
Cohesion: 0.18
Nodes (17): compareSponsors(), normalizedSponsorTier(), SponsorTier, sponsorTiers, blank, Draft, fromRow(), Sponsor (+9 more)

### Community 32 - "next"
Cohesion: 0.29
Nodes (7): nextConfig, next, AdminLoginPage(), metadata, LoginErrorNotice(), LoginForm(), handleSubmit()

### Community 33 - "gallery-manager.tsx"
Cohesion: 0.20
Nodes (10): AdminSession, AdminWorkspaceProps, BlogManagerProps, emptyDraft, GalleryDraft, GalleryImageRow, GalleryManagerProps, GalleryRow (+2 more)

### Community 34 - "SiteLogo"
Cohesion: 0.18
Nodes (10): ActivateAccountPage(), metadata, metadata, PasswordRecoveryPage(), ActivateAccountForm(), getActivationUrl(), PasswordRecoveryForm(), handleSubmit() (+2 more)

### Community 35 - "layout.tsx"
Cohesion: 0.21
Nodes (8): metadata, RootLayout(), RootLayoutProps, siteUrl, viewport, Footer(), Header(), publicNavigation

### Community 36 - "slugify"
Cohesion: 0.13
Nodes (24): useAdminConfirm(), selectDraft(), updateName(), GalleryImageEditor(), deleteImage(), GalleryManager(), deleteGallery(), imageDeleted() (+16 more)

### Community 37 - "team-index.tsx"
Cohesion: 0.23
Nodes (9): metadata, TeamPage(), TeamAreaRow, TeamIndex(), loadMembers(), TeamMemberRow, groupTeamMembers(), TeamArea (+1 more)

### Community 38 - "getPublicImageUrl"
Cohesion: 0.39
Nodes (6): metadata, ProjectsPage(), ProjectsIndex(), load(), load(), getPublicImageUrl()

### Community 39 - "uploadPublicImage"
Cohesion: 0.22
Nodes (10): uploadImages(), saveImage(), uploadImage(), numericOrder(), chooseFile(), chooseFile(), uploadPhoto(), createStoragePath() (+2 more)

### Community 40 - "team-manager.tsx"
Cohesion: 0.17
Nodes (15): AdminConfirmationProvider(), AskConfirmation, ConfirmationContext, ConfirmationOptions, AdminDraftProtectionProvider(), AskConfirmation, DraftProtection, DraftProtectionContext (+7 more)

### Community 41 - "20261003000738_repair_gallery_cover_on_image_delete.sql"
Cohesion: 0.47
Nodes (3): gallery_images_lock_album_before_delete, gallery_images_repair_cover_after_delete, private.repair_gallery_cover_after_image_delete()

### Community 42 - "20261004031236_configure_content_notification_delivery.sql"
Cohesion: 0.17
Nodes (4): private.configure_content_notification_mail(), private.content_notification_mail_credentials(), private.content_notification_mail_settings(), private.verify_content_notification_dispatch_token()

### Community 43 - "users-manager.tsx"
Cohesion: 0.33
Nodes (8): roleLabels, UserAccessForm(), userField, ManagedUser, usersRequest(), UsersResponse, TeamArea, UserRole

### Community 55 - "admin-section.tsx"
Cohesion: 0.21
Nodes (9): AdminSectionPage(), AdminSectionPageProps, dynamicParams, metadata, sections, AdminSection(), AdminSectionContent(), AdminSectionProps (+1 more)

### Community 59 - "UsersManager"
Cohesion: 0.46
Nodes (7): UsersManager(), askMutation(), invite(), mutate(), recoverUser(), removeUser(), saveUser()

### Community 62 - "Notificações privadas de conteúdo"
Cohesion: 0.50
Nodes (3): Implantação, Notificações privadas de conteúdo, Validação

### Community 63 - "content-notification-mail/deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 64 - "AdminWorkspace"
Cohesion: 0.67
Nodes (3): useAdminNavigationProtection(), AdminWorkspace(), signOut()

## Knowledge Gaps
- **208 isolated node(s):** `compat`, `eslintConfig`, `nextConfig`, `name`, `version` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 313 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseBrowserClient()` connect `createSupabaseBrowserClient` to `react`, `getSupabasePublicConfig`, `robots-manager.tsx`, `projects-manager.tsx`, `client.ts`, `competitions-manager.tsx`, `blog-index.tsx`, `ArrowLink`, `GalleryIndex`, `competitions-index.tsx`, `seasons-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `sponsors-manager.tsx`, `next`, `gallery-manager.tsx`, `SiteLogo`, `slugify`, `team-index.tsx`, `getPublicImageUrl`, `uploadPublicImage`, `team-manager.tsx`, `users-manager.tsx`, `AdminWorkspace`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `public-metadata.ts`, `react`, `package.json`, `getSupabasePublicConfig`, `layout.tsx`, `SiteLogo`, `publicPageMetadata`, `projects-manager.tsx`, `robots-manager.tsx`, `getPublicImageUrl`, `client.ts`, `competitions-manager.tsx`, `blog-index.tsx`, `ArrowLink`, `admin-section.tsx`, `blog-manager.tsx`, `sponsors-manager.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `getSupabasePublicConfig`, `createSupabaseBrowserClient`, `robots-manager.tsx`, `publicPageMetadata`, `projects-manager.tsx`, `client.ts`, `competitions-manager.tsx`, `blog-index.tsx`, `ArrowLink`, `competitions-index.tsx`, `seasons-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `sponsors-manager.tsx`, `next`, `gallery-manager.tsx`, `SiteLogo`, `layout.tsx`, `slugify`, `team-index.tsx`, `getPublicImageUrl`, `team-manager.tsx`, `users-manager.tsx`, `admin-section.tsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `compat`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `publicPageMetadata` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._
- **Should `admin-users/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._