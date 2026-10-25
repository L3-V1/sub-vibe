---
titulo: M0 · Fundação do projeto (Sub-vibe)
data: 2026-10-25
status: implementado
tipo: milestone
numero: "00"
pai: roadmaps/roadmap-01
triagem: ok
---

# M0 · Fundação do projeto (Sub-vibe)

## Contexto

O repositório tem só o modelo de domínio (`GLOSSARY.md`, `docs/adr/`) e o roadmap aprovado
(`.plans/roadmaps/roadmap-01/roadmap-01-implementacao-sub-vibe.md`). O M0 cria o esqueleto em que
os marcos M1 a M6 vão se apoiar: projeto Vite + React + TS, lint/format, testes, estrutura de pastas,
layout com navegação em pt-BR e o repositório git.

**Pronto quando:** `npm run dev`, `npm test` e `npm run build` passam.

Decisões já tomadas com o usuário: estilização com **Tailwind CSS**; **commit inicial** no fim.

Ambiente verificado: Node 22.20, npm 10.9, git 2.42 (Windows).

## Premissas

- Só entram dependências que o M0 usa. Dexie, Zod e date-fns ficam para M1/M2, quando forem usados.
- React Router entra já, porque a navegação do layout precisa de rotas. Uso `createBrowserRouter`
  (o roteamento para GitHub Pages, se precisar de hash, é decisão do M6).
- `src/domain/` e `src/db/` ficam vazios até M1/M2; para o git registrá-los, levam um `.gitkeep`.
- Formatação pt-BR em `src/shared/` com `Intl` nativo (sem date-fns por ora): `formatarMoeda(centavos)`
  e `formatarData(data)`. Isso dá ao `npm test` testes reais desde o início.
- As telas são placeholders (título + texto curto); o conteúdo de verdade vem em M3/M4.

## Etapas

1. **Scaffold sem tocar nos arquivos existentes** → verificar: `GLOSSARY.md`, `docs/`, `.plans/`, `CLAUDE.md` intactos.
   - `npm create vite@latest` com template `react-ts` **na scratchpad** e copiar o resultado para a raiz
     (o create-vite em pasta não vazia oferece apagar os arquivos; evitar esse risco).
   - Ajustar `package.json` (`name: "sub-vibe"`), `index.html` (`<html lang="pt-BR">`, `<title>Sub-vibe</title>`),
     remover os assets e o CSS de demonstração do template.
   - `npm install`.

2. **Tailwind v4** → verificar: classe utilitária aplicada no `npm run dev`.
   - `tailwindcss` + `@tailwindcss/vite`; plugin em `vite.config.ts`; `src/index.css` com `@import "tailwindcss";`.

3. **ESLint + Prettier** → verificar: `npm run lint` e `npm run format:check` sem erros.
   - Manter o ESLint flat config do template; acrescentar `eslint-config-prettier`.
   - `prettier` + `prettier-plugin-tailwindcss`, `.prettierrc` mínimo, `.prettierignore`.
   - Scripts: `lint`, `format`, `format:check`.

4. **Vitest + Testing Library** → verificar: `npm test` termina e passa.
   - `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
   - Bloco `test` em `vite.config.ts` (`environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`),
     setup importa `@testing-library/jest-dom/vitest`. Sem globals (imports explícitos).
   - Scripts: `test` = `vitest run`, `test:watch` = `vitest`.
   - Garantir que `tsc -b` do build aceita os arquivos de teste (tipos do jest-dom no tsconfig.app).

5. **Estrutura de pastas e formatação pt-BR** → verificar: testes de `src/shared/formatacao.test.ts` passam.
   ```
   src/
     domain/.gitkeep
     db/.gitkeep
     features/
       painel/PainelPage.tsx
       assinaturas/AssinaturasPage.tsx
       categorias/CategoriasPage.tsx
       configuracoes/ConfiguracoesPage.tsx
     shared/
       formatacao.ts        # formatarMoeda(centavos) → "R$ 1.234,56"; formatarData → "25/10/2026"
       formatacao.test.ts
       Layout.tsx           # cabeçalho + nav (NavLink) + <Outlet/>
     router.tsx
     main.tsx
     index.css
     test/setup.ts
   ```
   - Testes de formatação: centavos inteiros, zero, valores grandes, separador de milhar; data dd/MM/aaaa.
     (Cuidado: `Intl` usa espaço não separável em "R$ 1,00"; o teste compara com ` `.)

6. **Layout base e navegação** → verificar: teste de `Layout` e checagem manual no dev.
   - Rotas: `/` Painel, `/assinaturas`, `/categorias`, `/configuracoes`; rota desconhecida → "Página não encontrada".
   - `NavLink` com estado ativo destacado; layout responsivo simples (nav no topo, quebra em telas estreitas).
   - Teste em `src/shared/Layout.test.tsx` com `createMemoryRouter`: os quatro links aparecem e
     clicar em "Assinaturas" mostra o título da tela.

7. **Git e documentação** → verificar: `git status` limpo depois do commit.
   - `git init`, `.gitignore` (o do template + `coverage/`).
   - Atualizar a seção "Estado atual" e "Comandos" do `CLAUDE.md` com os comandos e a estrutura reais.
   - Commit inicial `chore: fundação do projeto (M0)` incluindo glossário, ADRs e planos.

## Arquivos críticos

- `package.json`, `vite.config.ts`, `tsconfig.app.json`, `eslint.config.js`, `.prettierrc`, `index.html`
- `src/router.tsx`, `src/shared/Layout.tsx`, `src/shared/formatacao.ts` (+ testes)
- `CLAUDE.md` (atualização da seção de estado e comandos)

## Verificação

- `npm test` → todos os testes passam (formatação + layout/navegação).
- `npm run build` → `tsc -b` sem erros de tipo e bundle gerado.
- `npm run lint` e `npm run format:check` → limpos.
- `npm run dev` → abrir no navegador (skill `run` ou Playwright): navegar pelas quatro telas, link ativo
  destacado, Tailwind aplicado, `lang="pt-BR"`, sem erros no console.
