# Graph Report - Blog-acrux-notification-details  (2026-10-05)

## Corpus Check
- 156 files · ~77,224 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 930 nodes · 2254 edges · 66 communities (42 shown, 24 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8016364`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- public-metadata.ts
- AdminWorkspace
- package.json
- database.ts
- slugify
- getPublicImageUrl
- publicPageMetadata
- ProjectsManager
- admin-users/index.ts
- compilerOptions
- users-manager.tsx
- content-notification-mail/handler.ts
- ACRUX ROBOCEP — site oficial
- postcss.config.mjs
- AGENTS.md
- competition-form-model.ts
- devDependencies
- blog-index.tsx
- about-content-view.tsx
- admin-section.tsx
- 20260904000000_initial_acrux_schema.sql
- competitions-index.tsx
- dependencies
- notifications-manager.tsx
- 20261004031230_owner_content_notifications.sql
- deno.json
- functions/README.md
- blog-manager.tsx
- sponsors-preview.tsx
- next
- createSupabaseBrowserClient
- ArrowLink
- SiteLogo
- react
- password-recovery-form.tsx
- sponsors-manager.tsx
- AboutManager
- team-manager.tsx
- 20261003000738_repair_gallery_cover_on_image_delete.sql
- 20261004031236_configure_content_notification_delivery.sql
- eslint.config.mjs
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
- scripts

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
- `setup()` --calls--> `createHandler()`  [EXTRACTED]
  tests/content-notification-mail.test.mjs → supabase/functions/content-notification-mail/handler.ts
- `draft()` --calls--> `emptyCompetitionDraft()`  [EXTRACTED]
  tests/competition-form.test.mjs → src/features/admin/competition-form-model.ts
- `notificationSummary()` --calls--> `notificationOverview()`  [EXTRACTED]
  src/features/admin/notification-model.ts → supabase/functions/_shared/notification-descriptions.ts

## Import Cycles
- None detected.

## Communities (66 total, 24 thin omitted)

### Community 0 - "public-metadata.ts"
Cohesion: 0.21
Nodes (10): Supabase, dynamic, robots(), dynamic, sitemap(), adminNavigation, siteConfig, copyPostLink() (+2 more)

### Community 1 - "AdminWorkspace"
Cohesion: 0.17
Nodes (15): AdminPage(), metadata, AdminDashboard(), AdminDashboardContent(), signOut(), dashboardCards, useAdminNavigationProtection(), AdminRole (+7 more)

### Community 2 - "package.json"
Cohesion: 0.15
Nodes (12): name, private, version, eslint, eslint-config-next, react-dom, tailwindcss, @tailwindcss/postcss (+4 more)

### Community 3 - "database.ts"
Cohesion: 0.06
Nodes (41): @supabase/ssr, @supabase/supabase-js, metadata, TeamPage(), metadata, SeasonsPage(), ActivationState, Album (+33 more)

### Community 4 - "slugify"
Cohesion: 0.16
Nodes (18): updateTitle(), fromRow(), SeasonsManager(), changeLabel(), remove(), save(), select(), getNumber() (+10 more)

### Community 5 - "getPublicImageUrl"
Cohesion: 0.13
Nodes (26): metadata, ProjectsPage(), metadata, RobotsPage(), SeasonOption, editableSpecifications(), emptyRobot(), isTextList() (+18 more)

### Community 6 - "publicPageMetadata"
Cohesion: 0.09
Nodes (22): BlogPostPage(), BlogPostPageProps, dynamicParams, generateMetadata(), CompetitionDetailPage(), CompetitionDetailPageProps, dynamicParams, generateMetadata() (+14 more)

### Community 7 - "ProjectsManager"
Cohesion: 0.23
Nodes (15): emptyProject(), projectCategories, ProjectDraft, projectPayload(), ProjectRow, projectToDraft(), ProjectForm(), Props (+7 more)

### Community 8 - "admin-users/index.ts"
Cohesion: 0.11
Nodes (10): Account, createHandler(), Profile, Role, roles, UserService, options, update() (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+12 more)

### Community 10 - "users-manager.tsx"
Cohesion: 0.10
Nodes (25): PostDraft, roleLabels, UserAccessForm(), userField, ManagedUser, usersRequest(), UsersResponse, UsersManager() (+17 more)

### Community 11 - "content-notification-mail/handler.ts"
Cohesion: 0.07
Nodes (43): actionText(), bounded(), createHandler(), sendMail(), dateText(), Dependencies, errorMessages, escapeHtml() (+35 more)

### Community 12 - "ACRUX ROBOCEP — site oficial"
Cohesion: 0.29
Nodes (6): ACRUX ROBOCEP — site oficial, Configuração local, Conteúdo pendente, Estrutura principal, Logo, Stack

### Community 16 - "competition-form-model.ts"
Cohesion: 0.19
Nodes (19): CompetitionForm(), CompetitionFormProps, CompetitionDraft, competitionError(), CompetitionRow, competitionToDraft(), editableAwards(), emptyCompetitionDraft() (+11 more)

### Community 17 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, @eslint/eslintrc, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 18 - "blog-index.tsx"
Cohesion: 0.17
Nodes (15): BlogPage(), metadata, BlogIndex(), closePost(), loadPosts(), openPost(), updatePostUrl(), CategoryRow (+7 more)

### Community 19 - "about-content-view.tsx"
Cohesion: 0.21
Nodes (11): gsap, motion, AboutPage(), metadata, AboutContentView(), AboutContent, AboutMilestone, aboutPlaceholder (+3 more)

### Community 20 - "admin-section.tsx"
Cohesion: 0.27
Nodes (9): AdminGate(), verifyAccess(), AdminLoadingState(), isAdminRole(), AdminSection(), AdminSectionContent(), AdminSectionProps, copy (+1 more)

### Community 21 - "20260904000000_initial_acrux_schema.sql"
Cohesion: 0.10
Nodes (37): achievements_set_updated_at, competitions_public_index, competitions_set_updated_at, galleries_public_index, galleries_set_updated_at, on_auth_user_created, posts_public_index, posts_set_updated_at (+29 more)

### Community 22 - "competitions-index.tsx"
Cohesion: 0.29
Nodes (8): CompetitionsPage(), metadata, Competition, CompetitionDate(), CompetitionsIndex(), loadCompetitions(), dateFormatter, normalizeSearch()

### Community 23 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, gsap, motion, next, react, react-dom, @supabase/ssr, @supabase/supabase-js

### Community 24 - "notifications-manager.tsx"
Cohesion: 0.11
Nodes (35): mailRequest(), NotificationEmailSettings(), save(), saveOpening(), sendTest(), refreshContentNotificationStatus(), ContentNotification, ContentNotificationPage (+27 more)

### Community 25 - "20261004031230_owner_content_notifications.sql"
Cohesion: 0.09
Nodes (10): content_notification_outbox_ready_idx, content_notifications_recipient_cursor_idx, private.content_change_batches, private.content_entity_snapshot(), private.content_notification_config, private.content_notification_email_outbox, private.content_notification_receipts, private.content_notification_status() (+2 more)

### Community 26 - "deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 30 - "blog-manager.tsx"
Cohesion: 0.12
Nodes (22): BlogManager(), createCategory(), deletePost(), savePost(), selectDraft(), uploadImages(), BlogManagerProps, CategoryRow (+14 more)

### Community 31 - "sponsors-preview.tsx"
Cohesion: 0.35
Nodes (8): compareSponsors(), normalizedSponsorTier(), SponsorTier, sponsorTiers, Sponsor, SponsorsPreview(), sponsorCards(), tierStyles

### Community 32 - "next"
Cohesion: 0.29
Nodes (7): nextConfig, next, AdminLoginPage(), metadata, LoginErrorNotice(), LoginForm(), handleSubmit()

### Community 33 - "createSupabaseBrowserClient"
Cohesion: 0.16
Nodes (22): CompetitionRelations(), changeRelation(), loadRelations(), GalleryImageEditor(), deleteImage(), saveImage(), GalleryManager(), deleteGallery() (+14 more)

### Community 34 - "ArrowLink"
Cohesion: 0.06
Nodes (45): Banco e publicação, Comportamento corrigido, Correções da auditoria de 2 de outubro de 2026, Verificação, GalleryPage(), metadata, NotFound(), Home() (+37 more)

### Community 35 - "SiteLogo"
Cohesion: 0.15
Nodes (13): ActivateAccountPage(), metadata, metadata, RootLayout(), RootLayoutProps, siteUrl, viewport, ActivateAccountForm() (+5 more)

### Community 36 - "react"
Cohesion: 0.13
Nodes (21): react, useAdminConfirm(), useAdminDraftProtection(), AdminGateProps, AdminSession, AdminWorkspaceProps, MailReply, MailSettings (+13 more)

### Community 37 - "password-recovery-form.tsx"
Cohesion: 0.43
Nodes (5): metadata, PasswordRecoveryPage(), getActivationUrl(), PasswordRecoveryForm(), handleSubmit()

### Community 38 - "sponsors-manager.tsx"
Cohesion: 0.29
Nodes (9): blank, Draft, fromRow(), Sponsor, SponsorsManager(), remove(), save(), selectSponsor() (+1 more)

### Community 39 - "AboutManager"
Cohesion: 0.38
Nodes (4): aboutFromRow(), AboutManager(), load(), save()

### Community 40 - "team-manager.tsx"
Cohesion: 0.16
Nodes (16): AdminConfirmationProvider(), AskConfirmation, ConfirmationContext, ConfirmationOptions, AdminDraftProtectionProvider(), AskConfirmation, DraftProtection, DraftProtectionContext (+8 more)

### Community 41 - "20261003000738_repair_gallery_cover_on_image_delete.sql"
Cohesion: 0.47
Nodes (3): gallery_images_lock_album_before_delete, gallery_images_repair_cover_after_delete, private.repair_gallery_cover_after_image_delete()

### Community 42 - "20261004031236_configure_content_notification_delivery.sql"
Cohesion: 0.17
Nodes (4): private.configure_content_notification_mail(), private.content_notification_mail_credentials(), private.content_notification_mail_settings(), private.verify_content_notification_dispatch_token()

### Community 43 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (3): compat, eslintConfig, @eslint/eslintrc

### Community 55 - "[section]/page.tsx"
Cohesion: 0.29
Nodes (5): AdminSectionPage(), AdminSectionPageProps, dynamicParams, metadata, sections

### Community 62 - "Notificações privadas de conteúdo"
Cohesion: 0.50
Nodes (3): Implantação, Notificações privadas de conteúdo, Validação

### Community 63 - "content-notification-mail/deno.json"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, imports

### Community 64 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, typecheck

## Knowledge Gaps
- **211 isolated node(s):** `compat`, `eslintConfig`, `nextConfig`, `name`, `version` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 323 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseBrowserClient()` connect `createSupabaseBrowserClient` to `AdminWorkspace`, `database.ts`, `slugify`, `getPublicImageUrl`, `ProjectsManager`, `users-manager.tsx`, `competition-form-model.ts`, `blog-index.tsx`, `about-content-view.tsx`, `admin-section.tsx`, `competitions-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `sponsors-preview.tsx`, `next`, `ArrowLink`, `react`, `password-recovery-form.tsx`, `sponsors-manager.tsx`, `AboutManager`, `team-manager.tsx`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `AdminWorkspace`, `package.json`, `database.ts`, `getPublicImageUrl`, `ProjectsManager`, `users-manager.tsx`, `competition-form-model.ts`, `blog-index.tsx`, `about-content-view.tsx`, `admin-section.tsx`, `competitions-index.tsx`, `notifications-manager.tsx`, `blog-manager.tsx`, `sponsors-preview.tsx`, `next`, `ArrowLink`, `SiteLogo`, `password-recovery-form.tsx`, `sponsors-manager.tsx`, `team-manager.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `public-metadata.ts`, `AdminWorkspace`, `package.json`, `database.ts`, `SiteLogo`, `react`, `publicPageMetadata`, `password-recovery-form.tsx`, `ArrowLink`, `sponsors-manager.tsx`, `getPublicImageUrl`, `blog-index.tsx`, `about-content-view.tsx`, `admin-section.tsx`, `blog-manager.tsx`, `sponsors-preview.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `compat`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `database.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05747126436781609 - nodes in this community are weakly interconnected._
- **Should `getPublicImageUrl` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Should `publicPageMetadata` be split into smaller, more focused modules?**
  _Cohesion score 0.0907258064516129 - nodes in this community are weakly interconnected._