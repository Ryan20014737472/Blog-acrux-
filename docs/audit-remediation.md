# Correções da auditoria de 2 de outubro de 2026

O relatório identificou condições de corrida nos formulários, perda de categorias em salvamento parcial, descarte de rascunhos, capas removidas, metadados incorretos e limite de cinco posts na listagem.

## Comportamento corrigido

- Uploads de fotos e logos ficam associados ao cadastro que iniciou o envio. Seleção e navegação aguardam a conclusão de operações em andamento.
- A galeria limpa as imagens ao trocar de álbum e descarta respostas de carregamentos anteriores. Edições de legendas e texto alternativo participam da proteção de rascunhos.
- `save_post` salva a postagem e seus vínculos de categorias em uma transação. Falhas de validação, categoria inexistente ou permissão revertem a operação inteira. Uma versão mais recente da postagem gera conflito e preserva o rascunho local.
- A exclusão de uma imagem usada como capa escolhe a primeira imagem restante do mesmo álbum e bucket, ou limpa a referência quando não há outra imagem. Exclusões simultâneas são serializadas por álbum. O formulário recarrega a capa depois da exclusão.
- Os gestores compartilham uma proteção de navegação para alterações não salvas e operações em andamento. Links, Voltar/Avançar e o botão Sair usam a mesma confirmação de descarte; cancelar mantém a seção e o rascunho.
- Indisponibilidade temporária durante a verificação do perfil mostra um erro com opção de tentar novamente, sem encerrar uma sessão válida ou afirmar falta de permissão.
- O blog apresenta todos os posts filtrados. A leitura tem endereço compartilhável `/blog/?post=<slug>`, sincronização com o histórico e cópia automática ou manual do link.
- Cada seção pública possui canonical e metadados sociais próprios. Rotas de detalhe ainda em preparação não são indexadas. O sitemap e os caminhos do robots consideram o prefixo do GitHub Pages.
- Conteúdo envolvido por `ScrollReveal` permanece visível no HTML inicial, inclusive sem JavaScript. O layout explica que JavaScript é necessário para carregar o conteúdo atualizado do banco.
- O botão dos cartões da equipe na Home diz “Ver a equipe”, conforme seu destino real.

Os textos “a” da página Sobre e erros ortográficos das biografias foram corrigidos diretamente no conteúdo publicado, comparando os valores anteriores para preservar alterações concorrentes. A categoria “sssss” foi mantida: o relatório não confirmou que fosse um erro ou qual seria o nome pretendido. Áreas vazias ou em preparação não receberam informações inventadas.

## Banco e publicação

Aplicar estas migrações antes de publicar o formulário que utiliza o RPC:

1. `supabase/migrations/20261003000726_save_post_atomically.sql`
2. `supabase/migrations/20261003000738_repair_gallery_cover_on_image_delete.sql`

As funções utilizam `SECURITY INVOKER` e caminho de busca vazio. O RPC é executável apenas por `authenticated`; as políticas de acesso existentes e o bloqueio de publicação para editores continuam vigentes. Os helpers de exclusão ficam no schema privado e não têm execução direta concedida a visitantes ou usuários autenticados.

## Verificação

As regressões SQL usam fixtures próprias e `ROLLBACK`. Devem ser executadas somente em um Supabase local ou banco descartável, após aplicar as migrações do projeto:

```sh
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/save-post.test.sql
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/gallery-cover.test.sql
```

Também verificar:

```sh
pnpm lint
pnpm typecheck
node --experimental-strip-types --test tests/*.test.mjs
pnpm build
powershell -File tools/update-graph.ps1
```

Os testes de navegador dos editores usam sessão, uploads e respostas de gravação simulados. Não se deve alterar conteúdo real para validar layout. As dimensões mínimas incluem 320, 390, 768 e 1024 pixels, celular na horizontal e desktop, conforme a meta permanente em `AGENTS.md`.

O link do post usa uma query na seção exportada para funcionar no GitHub Pages sem servidor dinâmico. Seu canonical e os metadados sociais permanecem os da seção Blog; metadados individuais por publicação e páginas individuais de integrantes ainda exigem outra estratégia de geração ou hospedagem.
