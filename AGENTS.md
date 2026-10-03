## Meta permanente: experiência em celular e telas menores

A experiência em celular é uma prioridade do projeto, tanto para visitantes quanto para editores e administradores. Toda alteração de interface deve considerar esse objetivo desde o início.

- Conferir layouts a partir de 320px, incluindo 390px, 768px, 1024px e celular na horizontal, além do desktop.
- Manter conteúdo, menus, imagens, filtros e ações acessíveis sem cortes ou rolagem horizontal da página. Usar quebra de texto e colunas flexíveis para nomes, títulos e links longos.
- Oferecer alvos de toque de pelo menos 44px e campos de texto com fonte de pelo menos 16px. Manter rótulos, foco visível, teclado e mensagens de erro acessíveis.
- Usar menus e diálogos que caibam na altura disponível, respeitem áreas seguras e permitam fechar, rolar e retornar ao controle anterior.
- Facilitar o percurso entre listas e formulários de edição no celular. Preservar rascunhos, validações, confirmação de ações e permissões ao ajustar a interface.
- Validar os fluxos afetados em navegador: navegação pública, leitura/galeria e edição com dados longos. Usar sessões e dados simulados para testes que gravam conteúdo; não alterar dados reais para verificar layout.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Install `graphifyy[sql]` so AST updates include database migrations and SQL functions as well as application code. Run the update script with PowerShell (`powershell` on Windows or `pwsh` on Linux/macOS).

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `powershell -File tools/update-graph.ps1`. This single command runs `graphify update .` (AST-only, no API cost) and automatically reapplies the ACRUX interactive viewer theme to the regenerated `graphify-out/graph.html`.

