# Notificações privadas de conteúdo

Alterações confirmadas no banco geram um histórico privado, com seção, registro, horário, usuário e campos anteriores/atuais. A captura cobre as 19 tabelas públicas de conteúdo, incluindo categorias, imagens, vínculos de integrantes e perfis. Um salvamento transacional é consolidado por registro; alterações sem efeito e transações desfeitas não geram avisos. Valores extensos aparecem como trechos.

O painel e os e-mails apresentam um resumo dos campos afetados e explicações específicas: quantas imagens foram adicionadas ou removidas, mudanças na ordem, legendas e descrições de imagens, categorias e integrantes vinculados ou retirados, alterações de permissão e revisão de textos. Os nomes dos itens relacionados aparecem quando estão no histórico. Criação e exclusão são descritas como dados iniciais e últimos valores registrados, respectivamente. Quando o histórico guarda apenas um trecho, o aviso informa essa limitação e não calcula quantidades ou tamanho a partir do trecho. As regras de descrição ficam em `supabase/functions/_shared/notification-descriptions.ts`, compartilhadas pelo painel e pela função de e-mail. Cada cartão destaca até seis campos e cada e-mail até dez; os valores completos registrados continuam disponíveis nos detalhes, respeitando os limites já existentes de tamanho do histórico e do e-mail.

O destinatário é uma única conta de Auth definida por um operador autorizado no banco. O papel de administrador, isoladamente, não concede acesso ao histórico ou à configuração de e-mail. Visitantes, editores e outros administradores não podem listar, marcar leitura, alterar o destinatário ou acessar as credenciais. Operações sem identidade de usuário, como manutenção interna do banco, são identificadas como sistema; o histórico não inventa um autor.

## Implantação

1. Aplicar as migrações `owner_content_notifications`, `configure_content_notification_delivery` e `personalize_content_notification_opening` antes de publicar o painel.
2. Identificar a conta do proprietário pelo e-mail informado, conferir que corresponde a exatamente um usuário de Auth com acesso ao painel e gravar seu UUID em `private.content_notification_config`. Não inserir e-mail, UUID pessoal ou credenciais no código público. O destinatário não é configurável pelo navegador.
3. Implantar a Edge Function `content-notification-mail` com `verify_jwt = false`. O handler verifica explicitamente a sessão em Auth e o proprietário no banco para as ações do painel. O agendamento exige um token privado gerado e armazenado no Vault, validado por RPC exclusivo da service-role.
4. No painel do proprietário, abrir Notificações → Avisos por e-mail, informar uma chave de envio do Resend e um remetente autorizado. A chave é transmitida somente ao servidor e armazenada criptografada no Vault. Não é retornada à interface nem persistida no navegador.
5. Usar “Enviar e-mail de teste para mim”. O destinatário é resolvido no servidor a partir da conta configurada; não existe parâmetro `to` aceito do cliente.

O remetente `onboarding@resend.dev` funciona somente para o endereço cadastrado na conta do Resend. Para outro destinatário, o serviço exige um remetente de domínio verificado. Pausar e-mails mantém o histórico no painel e preserva os avisos aguardando envio.

Em Notificações → Avisos por e-mail, o proprietário pode editar a **Abertura do e-mail**, conferir a prévia e usar **Salvar abertura**. São até 500 caracteres de texto, com quebras de linha. Deixar vazio remove a saudação. A abertura antecede os dados em cada aviso e também no teste; não altera o assunto nem os detalhes da mudança. HTML digitado aparece como texto. É possível salvar a abertura mesmo sem configurar o Resend; essa ação não ativa o envio, não substitui a chave e não muda o destinatário. A configuração de entrega e a abertura são salvas separadamente, com proteção de rascunhos ao sair.

O modelo HTML dos avisos e do teste usa a logo oficial como marca-d’água sobre fundo azul escuro. Usuário responsável, horário, títulos dos campos e link do painel recebem o tom da estrela da ACRUX (`#fbf406`). A imagem é carregada da pasta pública `brand` do site. Fundos sólidos mantêm a leitura em clientes que bloqueiam imagens ou não exibem transparência. O conteúdo acompanha a largura disponível, com texto a partir de 16px e quebra de valores longos. O formato de texto simples continua disponível para leitores que não usam HTML.

O cron `acrux-private-content-notifications` verifica a fila a cada minuto e chama a função somente quando há avisos prontos e envio habilitado/configurado. A fila possui leases, identificadores estáveis de idempotência e novas tentativas com intervalo crescente. Falhas de envio não bloqueiam salvamentos. O estado “enviado” indica aceitação pelo serviço de e-mail, não confirmação de leitura ou chegada à caixa de entrada.

## Validação

```sh
node --experimental-strip-types --test tests/*.test.mjs
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/content-notifications.test.sql
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/content-notification-delivery.test.sql
pnpm lint
pnpm typecheck
pnpm build
powershell -File tools/update-graph.ps1
```

Executar testes SQL apenas em banco descartável e as interações de edição com backend simulado. Os testes locais de entrega usam stubs do Vault, cron e pg_net em PostgreSQL; a instalação e o agendamento reais devem ser conferidos no Supabase hospedado. Nenhum teste precisa alterar conteúdo público nem enviar e-mails reais a terceiros.

O painel consulta novidades a cada 30 segundos quando visível e permite atualizar manualmente. Ele oferece filtros de leitura, detalhes antes/depois e paginação. A captura começa quando as migrações estão instaladas e a conta destinatária definida; não reconstrói alterações anteriores à instalação nem alterações do código-fonte que não gravam conteúdo no banco.
