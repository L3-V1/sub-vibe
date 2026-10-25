---
titulo: M6 · Polimento e distribuição (Sub-vibe)
data: 2026-10-25
status: aprovado
tipo: milestone
numero: "06"
pai: roadmaps/roadmap-01
triagem: ok
---

# M6 · Polimento e distribuição (Sub-vibe)

## Contexto

M0 a M5 concluídos e commitados (árvore limpa na `main`, sem remote). O M6 do roadmap é opcional e tem três partes:
polimento de UI, PWA e deploy estático. Ele deixa o app usável no celular e publicado num endereço fixo. Os dados
continuam só no IndexedDB de cada navegador (ADR 0001).

## Decisões tomadas com o usuário

- **Entram:** polimento de UI (responsividade, acessibilidade, auditoria `ui-ux-kit:ui-guidelines`) e deploy estático.
- **Fica de fora:** PWA (`vite-plugin-pwa`). Pode virar um marco à parte depois.
- **Deploy:** GitHub Pages via GitHub Actions, num repositório **público** `L3-V1/sub-vibe` criado com `gh`
  (já autenticado com os escopos `repo` e `workflow`). Peço confirmação antes de criar o repositório e de dar push.
- **Ícone:** um SVG próprio e simples (monograma "S" em índigo, a cor do app) no lugar do logo do Vite.

## Premissas (me corrija se alguma estiver errada)

- **URL:** `https://l3-v1.github.io/sub-vibe/`. Por isso o build usa `base: '/sub-vibe/'`, e o dev continua em `/`
  (`defineConfig(({ command }) => ({ base: command === 'build' ? '/sub-vibe/' : '/', ... }))`). O `vite preview`
  serve em `/sub-vibe/`, igual ao Pages.
- **Router:** `createBrowserRouter(rotas, { basename: import.meta.env.BASE_URL })`. Os testes usam `rotas` via
  `renderizar` e não mudam.
- **Rotas profundas no Pages:** o workflow copia `dist/index.html` para `dist/404.html`. Assim, recarregar
  `/sub-vibe/assinaturas/123` abre o app, embora a resposta HTTP venha com status 404, o que é aceitável num app
  pessoal. A alternativa seria trocar para `createHashRouter`, mas as URLs ficariam com `#`.
- **Polimento:** não sei de antemão o que a auditoria vai apontar. Ela audita **e corrige**, e cada correção é uma mudança
  cirúrgica de classe ou marcação, sem mudar o comportamento. Os testes existentes precisam continuar passando. Já vi
  que as duas tabelas (Assinaturas e Gasto por Categoria) têm `overflow-x-auto` e que a navegação usa `flex-wrap`.
- **Dados no endereço publicado:** o IndexedDB é por origem. Os dados do `localhost` não aparecem no Pages, e a
  migração é feita com Exportar → Importar backup. A origem `l3-v1.github.io` é compartilhada com qualquer outro site
  de projeto do Pages da conta. Registro isso no `CLAUDE.md`.

## Etapas

### Parte A · Polimento de UI

1. Rodar a skill `ui-ux-kit:ui-guidelines` sobre `src/features/` e `src/shared/`, aplicando as correções que ela
   apontar (contraste, estados vazios, padding, feedback, validação em pt-BR, travessões etc.).
   → verificar: `npm test`, `npm run lint`.
2. Responsividade com o Playwright (`npm run dev`, viewport 375×812) em `/`, `/assinaturas`, `/assinaturas/nova`,
   `/assinaturas/:id` (com dados), `/categorias`, `/backup` e `/configuracoes`, além dos diálogos de ação. Os
   critérios são: nada de rolagem horizontal na página (só dentro das tabelas), navegação usável, formulários
   em uma coluna e diálogos cabendo na tela. Corrijo o que falhar.
3. Acessibilidade, também com o Playwright (snapshot da árvore de acessibilidade) e navegação só por teclado. Os
   critérios são: todo campo com rótulo associado, hierarquia de títulos (`h1` por tela), foco visível em links e
   botões (se faltar, acrescento `focus-visible:outline-2 focus-visible:outline-indigo-600` às classes de
   `src/shared/estilos.ts` e ao `NavLink`), `aria-current` na navegação (o `NavLink` já dá) e foco preso/devolvido
   no `Dialogo` (o `<dialog>` nativo já faz isso). Corrijo o que falhar.
4. Ícone: substituir `public/favicon.svg` por um SVG próprio (quadrado arredondado índigo `#4338ca` com um "S" branco).
   → verificar: aba do navegador no dev.

### Parte B · Deploy no GitHub Pages

5. `vite.config.ts`: `base` condicional (premissa acima). `src/router.tsx`: `basename: import.meta.env.BASE_URL`.
   → verificar: `npm run build && npm run preview`, abrir `/sub-vibe/`, navegar e recarregar numa rota interna
   (com o preview, o fallback é do próprio Vite; o do Pages é testado na etapa 8).
6. `.github/workflows/deploy.yml`, disparado por `push` na `main` e por `workflow_dispatch`, com
   `permissions: { contents: read, pages: write, id-token: write }` e `concurrency: pages`:
   - job `build`: `actions/checkout`, `actions/setup-node` (Node LTS, `cache: npm`), `npm ci`, `npm run lint`,
     `npm test`, `npm run build`, `cp dist/index.html dist/404.html` e `actions/upload-pages-artifact` (`path: dist`);
   - job `deploy`: `actions/deploy-pages`, no environment `github-pages`.
7. Atualizar o `CLAUDE.md`: no "Estado atual", o M6 concluído (polimento + deploy, PWA de fora); em "Comandos", o
   `npm run preview` em `/sub-vibe/`; em "Arquitetura" ou "Decisões", o `base`/`basename`, o `404.html`, a URL publicada
   e a nota sobre a origem e a migração via backup.
   → verificar: `npm test`, `npm run test:coverage` (domínio em 100%), `npm run lint`, `npm run format:check`,
   `npm run build`.
8. **Publicar (com confirmação sua antes):** commit do M6, depois `gh repo create L3-V1/sub-vibe --public
   --source . --push`, depois ativar o Pages com `gh api -X POST repos/L3-V1/sub-vibe/pages -f build_type=workflow`
   (se o primeiro run já tiver falhado por falta do Pages, rodo de novo com `gh workflow run deploy.yml`), e
   acompanho com `gh run watch`.
   → verificar: abrir `https://l3-v1.github.io/sub-vibe/` e uma rota profunda recarregada.

## Arquivos críticos

- Novos: `.github/workflows/deploy.yml`
- Alterados: `vite.config.ts`, `src/router.tsx`, `public/favicon.svg`, `CLAUDE.md`, mais as telas e os componentes que a
  auditoria tocar (`src/features/**`, `src/shared/Layout.tsx`, `src/shared/estilos.ts`, `src/shared/Dialogo.tsx`)
- Reutilizados: `rotas` e `renderizar` (testes inalterados), as classes de `src/shared/estilos.ts`, `Dialogo`,
  `ListaErros`, `useAvisos`

## Verificação

- Automática: os comandos da etapa 7 e o workflow verde no GitHub Actions.
- Manual (Playwright, a 375 px e no desktop, no endereço publicado):
  1. Navegar por todas as telas, sem rolagem horizontal na página.
  2. Recarregar `/sub-vibe/assinaturas` e `/sub-vibe/configuracoes`: o app abre na tela certa.
  3. Cadastrar uma Assinatura, exportar o backup, limpar os dados do site, importar e ver tudo de volta.
  4. Percorrer uma tela só com Tab/Enter/Esc (abrir e fechar um diálogo), com o foco sempre visível.
