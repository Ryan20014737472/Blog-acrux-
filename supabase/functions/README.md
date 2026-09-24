# Gestão de usuários

`admin-users` atende a página estática `/admin/usuarios`. Usa `getUser(token)`
para validar a sessão e consulta o papel atual em `profiles` a cada requisição.
Listagem Auth, convites e recuperação usam a service-role **somente no servidor**;
consultas e alterações em profiles usam o JWT do solicitante, mantendo RLS.

O deploy utiliza `verify_jwt = false` porque a função valida explicitamente o
token com Auth antes de qualquer operação, inclusive para JWTs com assinatura
assimétrica. Não remover essa autenticação do handler.

Segredos padrões do ambiente Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Nenhum novo segredo vai ao frontend.

Em Authentication → URL Configuration, autorize exatamente:
`https://ryan20014737472.github.io/Blog-acrux-/admin/ativar-conta/`.
O template de convite deve usar `{{ .ConfirmationURL }}` para respeitar o destino.
Configure SMTP e limites de envio antes de convidar muitas pessoas.

Operações: list (50 contas por página), invite (editor/admin), update (nome e papel),
recover (link de definição de senha) e delete (contas não administradoras).
Delete remove a conta de Auth, o perfil e convites pendentes; referências de autoria
nos posts e vínculos da equipe tornam-se nulas, sem apagar esse conteúdo.
Administradores não podem ser rebaixados nem excluídos por este endpoint;
remoções deliberadas continuam pelo Supabase, verificando que outro administrador ativo permaneça.
Esse bloqueio é do endpoint; administradores do banco mantêm seus poderes existentes.
Visitantes e editores não podem chamar nenhuma operação.

Falhas após enviar convite são informadas como conclusão parcial; atualize a lista
e ajuste o perfil sem reenviar o convite. A busca e filtros se aplicam à página atual.

Teste isolado (sem e-mails reais):
`node --experimental-strip-types --test tests/admin-users.test.mjs`

O runtime Deno é separado do TypeScript do Next.js. A implantação Supabase valida
o bundle do entrypoint; os testes Node exercitam o handler com serviços simulados.

