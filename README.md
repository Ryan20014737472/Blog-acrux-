# ACRUX ROBOCEP — site oficial

Primeira etapa do site oficial da ACRUX ROBOCEP. A Home concentra a direção visual da marca; as demais rotas e o painel administrativo estão preparados para receber conteúdo oficial.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- Motion para interações e transições de interface
- GSAP + ScrollTrigger para Hero e timeline
- Supabase Auth, Database e Storage

## Estrutura principal

```text
src/
  app/                 # rotas públicas, admin, metadata, robots e sitemap
  components/          # layout, UI, animações e componentes administrativos
  features/            # Home e Blog
  config/              # navegação e metadados do site
  hooks/               # hooks de interface
  lib/                 # Supabase e controle de acesso
  services/            # contratos de serviços de conteúdo
  types/               # tipos de domínio e contrato inicial do banco
  utils/               # utilitários pequenos
public/brand/          # asset oficial da ACRUX, sem alteração
supabase/migrations/   # schema, RLS e buckets de Storage
```

## Logo

O arquivo original foi preservado byte a byte em `public/brand/acrux-logo.jpg`. Ele não deve ser redesenhado, recolorido ou substituído por uma versão gerada por IA.

## Configuração local

1. Instale as dependências com `pnpm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha as variáveis do Supabase.
4. Aplique as migrações de `supabase/migrations/` em ordem cronológica no projeto Supabase.
5. Inicie com `pnpm dev`.

Para validar a aplicação:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Supabase

Variáveis necessárias:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

No Supabase:

1. Crie um novo projeto.
2. Aplique a migração inicial.
3. Desative o cadastro público em **Authentication > Providers**.
4. Crie as contas autorizadas pelo painel do Supabase ou por um fluxo server-side seguro.
5. A trigger cria um perfil com papel `visitor`. Promova apenas as contas necessárias em uma sessão administrativa segura, por exemplo:

```sql
update public.profiles
set role = 'admin'
where id = '<uuid-da-conta-autorizada>';
```

Os buckets `avatars`, `blog`, `robots`, `projects`, `gallery` e `sponsors` são criados pela migração. As políticas RLS deixam conteúdo publicado público, permitem que editores gerenciem posts e mídias, e reservam a administração de usuários e conteúdo estrutural aos administradores.

Para usar várias imagens por postagem, aplique também `supabase/migrations/20260930230220_add_post_image_paths.sql` antes de publicar a atualização do site. No painel do blog, selecione uma ou mais imagens, escolha a capa e salve a postagem. A capa continua em `posts.cover_path`; a lista de imagens fica em `posts.image_paths` e usa o bucket `blog` existente. Postagens antigas com apenas uma capa continuam funcionando. Remover uma imagem da postagem não apaga seu arquivo do acervo.

`SUPABASE_SECRET_KEY` é exclusivamente server-side: nunca a use com prefixo `NEXT_PUBLIC_` e nunca a exponha no navegador. O projeto também aceita os nomes legados `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` quando necessário.

## Conteúdo pendente

Nenhum integrante, conquista, patrocinador, resultado, temporada, competição ou texto institucional foi inventado. Todos os dados visíveis que dependem de confirmação da equipe estão marcados como conteúdo em preparação.

