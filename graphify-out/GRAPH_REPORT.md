# Graph Report - Blog-acrux-404  (2026-10-10)

## Corpus Check
- 156 files · ~77,523 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 932 nodes · 2255 edges · 61 communities (37 shown, 24 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06217cf9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- client.ts
- team-index.tsx
- package.json
- getSupabasePublicConfig
- seasons-manager.tsx
- robots-manager.tsx
- publicPageMetadata
- projects-manager.tsx
- admin-users/index.ts
- compilerOptions
- admin-gate.tsx
- content-notification-mail/handler.ts
- ACRUX ROBOCEP — site oficial
- postcss.config.mjs
- AGENTS.md
- competitions-manager.tsx
- GalleryIndex
- blog-index.tsx
- about-manager.tsx
- getPublicImageUrl
- 20260904000000_initial_acrux_schema.sql
- competitions-index.tsx
- hero.tsx
- notifications-manager.tsx
- 20261004031230_owner_content_notifications.sql
- deno.json
- functions/README.md
- blog-manager.tsx
- Correções da auditoria de 2 de outubro de 2026
- createSupabaseBrowserClient
- ArrowLink
- react
- gallery-manager.tsx
- slugify
- team-manager.tsx
- 20261003000738_repair_gallery_cover_on_image_delete.sql
- 20261004031236_configure_content_notification_delivery.sql
- 20260922020000_home_gallery_featured_limit.sql
- public.team_members
- 20260905000000_refine_editor_permissions.sql
- 20260922010000_home_team_featured_limit.sql
- 20260924234002_about_page.sql
- 20260924010000_team_area_order.sql
- save-post.test.sql
- admin-section.tsx
- 20261004035248_personalize_content_notification_opening.sql
- pg_temp.assert
- pg_temp.assert
- Notificações privadas de conteúdo
- content-notification-mail/deno.json

## God Nodes (most connected - your core abstractions)
1. `createSupabaseBrowserClient()` - 122 edges
2. `react` - 55 edges
3. `next` - 45 edges
4. `getPublicImageUrl()` - 34 edges
5. `ArrowLink()` - 31 edges
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
- `notificationSummary()` --calls--> `notificationOverview()`  [EXTRACTED]
  src/features/admin/notification-model.ts → supabase/functions/_shared/notification-descriptions.ts
- `notificationChangeDescription()` --calls--> `describeNotificationChange()`  [EXTRACTED]
  src/features/admin/notification-model.ts → supabase/functions/_shared/notification-descriptions.ts

## Import Cycles
- None detected.

## Communities (61 total, 24 thin omitted)

### Community 0 - "client.ts"
Cohesion: 0.12
Nodes (20): PlaceholderMedia(), PlaceholderMediaProps, Album, CompetitionRelationsProps, Member, Album, Member, ProjectRelationsProps (+12 more)

### Community 1 - "team-index.tsx"
Cohesion: 0.23
Nodes (9): metadata, TeamPage(), TeamAreaRow, TeamIndex(), loadMembers(), TeamMemberRow, groupTeamMembers(), TeamArea (+1 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (39): compat, eslintConfig, dependencies, gsap, motion, next, react, react-dom (+31 more)

### Community 3 - "getSupabasePublicConfig"
Cohesion: 0.15
Nodes (13): @supabase/ssr, @supabase/supabase-js, ActivateAccountForm(), ActivationState, AdminAccess, getAdminAccess(), requireAdminAccess(), createActivationClient() (+5 more)

### Community 4 - "seasons-manager.tsx"
Cohesion: 0.27
Nodes (10): useAdminConfirm(), blank, Draft, fromRow(), Season, SeasonsManager(), changeLabel(), remove() (+2 more)

### Community 5 - "robots-manager.tsx"
Cohesion: 0.18
Nodes (21): metadata, RobotsPage(), SeasonOption, editableSpecifications(), emptyRobot(), isTextList(), RobotDraft, robotPayload() (+13 more)

### Community 6 - "publicPageMetadata"
Cohesion: 0.07
Nodes (30): BlogPostPage(), BlogPostPageProps, dynamicParams, generateMetadata(), CompetitionDetailPage(), CompetitionDetailPageProps, dynamicParams, generateMetadata() (+22 more)

### Community 7 - "projects-manager.tsx"
Cohesion: 0.19
Nodes (21): uploadImages(), emptyProject(), projectCategories, ProjectDraft, projectPayload(), ProjectRow, projectToDraft(), ProjectForm() (+13 more)

### Community 8 - "admin-users/index.ts"
Cohesion: 0.11
Nodes (10): Account, createHandler(), Profile, Role, roles, UserService, options, update() (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+12 more)

### Community 10 - "admin-gate.tsx"
Cohesion: 0.09
Nodes (29): AdminGate(), verifyAccess(), AdminGateProps, AdminLoadingState(), isAdminRole(), AdminSetupNotice(), roleLabels, UserAccessForm() (+21 more)

### Community 11 - "content-notification-mail/handler.ts"
Cohesion: 0.07
Nodes (44): actionText(), bounded(), createHandler(), sendMail(), dateText(), Dependencies, errorMessages, escapeHtml() (+36 more)

### Community 12 - "ACRUX ROBOCEP — site oficial"
Cohesion: 0.25
Nodes (7): ACRUX ROBOCEP — site oficial, Configuração local, Conteúdo pendente, Estrutura principal, Logo, Publicação no GitHub Pages e página 404, Stack

### Community 16 - "competitions-manager.tsx"
Cohesion: 0.23
Nodes (18): CompetitionForm(), CompetitionFormProps, CompetitionDraft, competitionError(), CompetitionRow, competitionToDraft(), editableAwards(), emptyCompetitionDraft() (+10 more)

### Community 17 - "GalleryIndex"
Cohesion: 0.25
Nodes (4): GalleryPage(), metadata, GalleryIndex(), loadGallery()

### Community 18 - "blog-index.tsx"
Cohesion: 0.13
Nodes (18): motion, BlogPage(), metadata, ArrowLinkProps, BlogIndex(), closePost(), loadPosts(), openPost() (+10 more)

### Community 19 - "about-manager.tsx"
Cohesion: 0.13
Nodes (17): gsap, AboutPage(), metadata, AboutContentView(), AboutContent, aboutFromRow(), AboutMilestone, aboutPlaceholder (+9 more)

### Community 20 - "getPublicImageUrl"
Cohesion: 0.48
Nodes (5): metadata, ProjectsPage(), ProjectsIndex(), load(), getPublicImageUrl()

### Community 21 - "20260904000000_initial_acrux_schema.sql"
Cohesion: 0.10
Nodes (37): achievements_set_updated_at, competitions_public_index, competitions_set_updated_at, galleries_public_index, galleries_set_updated_at, on_auth_user_created, posts_public_index, posts_set_updated_at (+29 more)

### Community 22 - "competitions-index.tsx"
Cohesion: 0.29
Nodes (8): CompetitionsPage(), metadata, Competition, CompetitionDate(), CompetitionsIndex(), loadCompetitions(), dateFormatter, normalizeSearch()

### Community 23 - "hero.tsx"
Cohesion: 0.47
Nodes (4): branches, HeroConstellation(), stars, Hero()

### Community 24 - "notifications-manager.tsx"
Cohesion: 0.10
Nodes (40): MailReply, mailRequest(), MailSettings, NotificationEmailSettings(), save(), saveOpening(), sendTest(), refreshContentNotificationStatus() (+32 more)

### Community 25 - "20261004031230_owner_content_notifications.sql"
Cohesion: 0.09
Nodes (10): content_notification_outbox_ready_idx, content_notifications_recipient_cursor_idx, private.content_change_batches, private.content_entity_snapshot(), private.content_notification_config, private.content_notification_email_outbox, private.content_notification_receipts, private.content_notification_status() (+2 more)

### Community 26 - "deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 30 - "blog-manager.tsx"
Cohesion: 0.18
Nodes (12): CategoryRow, emptyDraft, ManagedPost, PostCategoryRow, PostDraft, PostRow, statusLabel(), toDraft() (+4 more)

### Community 31 - "Correções da auditoria de 2 de outubro de 2026"
Cohesion: 0.40
Nodes (4): Banco e publicação, Comportamento corrigido, Correções da auditoria de 2 de outubro de 2026, Verificação

### Community 33 - "createSupabaseBrowserClient"
Cohesion: 0.07
Nodes (45): signOut(), AdminWorkspace(), signOut(), compareSponsors(), normalizedSponsorTier(), SponsorTier, sponsorTiers, CompetitionRelations() (+37 more)

### Community 34 - "ArrowLink"
Cohesion: 0.27
Nodes (16): Home(), metadata, ScrollReveal(), ArrowLink(), AboutPreview(), HomePage(), AchievementsAndCompetitionPreview(), ClosingCta() (+8 more)

### Community 35 - "react"
Cohesion: 0.06
Nodes (46): nextConfig, Supabase, next, react, ActivateAccountPage(), metadata, AdminLoginPage(), metadata (+38 more)

### Community 36 - "gallery-manager.tsx"
Cohesion: 0.20
Nodes (10): AdminSession, AdminWorkspaceProps, BlogManagerProps, emptyDraft, GalleryDraft, GalleryImageRow, GalleryManagerProps, GalleryRow (+2 more)

### Community 38 - "slugify"
Cohesion: 0.14
Nodes (19): BlogManager(), createCategory(), deletePost(), savePost(), selectDraft(), updateTitle(), messageFromError(), updateName() (+11 more)

### Community 40 - "team-manager.tsx"
Cohesion: 0.14
Nodes (17): AdminConfirmationProvider(), AskConfirmation, ConfirmationContext, ConfirmationOptions, AdminDraftProtectionProvider(), AskConfirmation, DraftProtection, DraftProtectionContext (+9 more)

### Community 41 - "20261003000738_repair_gallery_cover_on_image_delete.sql"
Cohesion: 0.47
Nodes (3): gallery_images_lock_album_before_delete, gallery_images_repair_cover_after_delete, private.repair_gallery_cover_after_image_delete()

### Community 42 - "20261004031236_configure_content_notification_delivery.sql"
Cohesion: 0.17
Nodes (4): private.configure_content_notification_mail(), private.content_notification_mail_credentials(), private.content_notification_mail_settings(), private.verify_content_notification_dispatch_token()

### Community 55 - "admin-section.tsx"
Cohesion: 0.21
Nodes (9): AdminSectionPage(), AdminSectionPageProps, dynamicParams, metadata, sections, AdminSection(), AdminSectionContent(), AdminSectionProps (+1 more)

### Community 62 - "Notificações privadas de conteúdo"
Cohesion: 0.50
Nodes (3): Implantação, Notificações privadas de conteúdo, Validação

### Community 63 - "content-notification-mail/deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

## Knowledge Gaps
- **213 isolated node(s):** `compat`, `eslintConfig`, `nextConfig`, `name`, `version` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 326 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseBrowserClient()` connect `createSupabaseBrowserClient` to `client.ts`, `team-index.tsx`, `getSupabasePublicConfig`, `seasons-manager.tsx`, `robots-manager.tsx`, `publicPageMetadata`, `projects-manager.tsx`, `admin-gate.tsx`, `competitions-manager.tsx`, `GalleryIndex`, `blog-index.tsx`, `about-manager.tsx`, `getPublicImageUrl`, `competitions-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `ArrowLink`, `react`, `gallery-manager.tsx`, `slugify`, `team-manager.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `client.ts`, `team-index.tsx`, `package.json`, `getSupabasePublicConfig`, `seasons-manager.tsx`, `robots-manager.tsx`, `publicPageMetadata`, `projects-manager.tsx`, `admin-gate.tsx`, `competitions-manager.tsx`, `blog-index.tsx`, `about-manager.tsx`, `getPublicImageUrl`, `competitions-index.tsx`, `hero.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `createSupabaseBrowserClient`, `ArrowLink`, `gallery-manager.tsx`, `team-manager.tsx`, `admin-section.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `next` connect `react` to `client.ts`, `createSupabaseBrowserClient`, `package.json`, `getSupabasePublicConfig`, `robots-manager.tsx`, `publicPageMetadata`, `projects-manager.tsx`, `admin-gate.tsx`, `competitions-manager.tsx`, `blog-index.tsx`, `about-manager.tsx`, `hero.tsx`, `getPublicImageUrl`, `admin-section.tsx`, `blog-manager.tsx`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **What connects `compat`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `publicPageMetadata` be split into smaller, more focused modules?**
  _Cohesion score 0.07087486157253599 - nodes in this community are weakly interconnected._