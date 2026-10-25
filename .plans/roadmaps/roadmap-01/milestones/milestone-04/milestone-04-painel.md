---
titulo: M4 · Painel (Sub-vibe)
data: 2026-10-25
status: implementado
tipo: milestone
numero: "04"
pai: roadmaps/roadmap-01
triagem: ok
---

# M4 · Painel (Sub-vibe)

## Contexto

M0 a M3 estão concluídos. O domínio já calcula tudo o que o Painel precisa: `custoMensalEquivalente`
(devolve 0 para uma Assinatura Cancelada), `gastoAcumulado` e `gastoPorCategoria` em `src/domain/custos.ts`,
e `cobrancasNoIntervalo` em `src/domain/cobrancas.ts`. A persistência já tem `preferencias.janelaVencimentosDias`
(padrão 7, validada pelo Zod), além de `preferenciasRepo.atualizar` e `usePreferencias`. Mas
`PainelPage` e `ConfiguracoesPage` ainda são placeholders. O M4 liga esses cálculos às duas telas.

**Pronto quando** (roadmap): os números do Painel batem com os cálculos de domínio para um conjunto de dados de teste.

## Decisões tomadas com o usuário

- Gráfico de Gasto por Categoria em **barras horizontais** feitas com divs e Tailwind, sem dependência nova.
  A tabela de apoio fica logo abaixo.
- **Um só seletor de período** vale para o Gasto acumulado e para o Gasto por Categoria, para os totais baterem.

## Premissas (me corrija se alguma estiver errada)

- **Períodos** (gasto já ocorrido, então `ate = hoje`):
  - ano corrente (padrão): de 01/01 do ano de hoje até hoje;
  - últimos 12 meses: de `hoje − 12 meses + 1 dia` até hoje;
  - desde o início: do menor `inicio` de todas as Vigências até hoje (sem Assinaturas, o total é zero).
  O seletor fica em `useState`, não é persistido.
- **Próximos vencimentos:** Cobranças de `hoje` até `hoje + N dias` (inclusive), de todas as Assinaturas, em ordem de
  data. Cada linha mostra a data, o Serviço (com link para o detalhe) e o valor. Período gratuito não aparece, porque
  o domínio já ignora valor 0. O título indica a janela ("Próximos 7 dias").
- **Total mensal equivalente:** soma de `custoMensalEquivalente(a, hoje)` sobre todas as Assinaturas (as Canceladas
  contribuem 0), com a contagem de Ativas ao lado.
- **Gasto por Categoria:** linhas ordenadas por valor decrescente, cada uma com o nome, uma barra proporcional à maior
  e o valor. A tabela traz Categoria, valor e % do total, com uma linha de Total que é igual ao Gasto acumulado.
  Categorias sem gasto ficam de fora.
- **Funções puras novas no domínio**, testadas a 100% em `src/domain/painel.ts`:
  - `type Periodo = 'anoCorrente' | 'ultimos12Meses' | 'desdeOInicio'`
  - `intervaloDoPeriodo(periodo, assinaturas, hoje): { de, ate }`
  - `proximasCobrancas(assinaturas, hoje, dias): Cobranca[]` (junta os `cobrancasNoIntervalo` e ordena por data)
- **Estados vazios:** sem Assinaturas, o Painel mostra um convite para cadastrar (o mesmo padrão de
  `AssinaturasPage`). Cada seção também tem o seu: "Nenhum vencimento nos próximos N dias." e
  "Nenhum gasto nesse período.".
- **Configurações:** um formulário `noValidate` com um campo numérico "Janela de vencimentos (dias)", preenchido a
  partir de `usePreferencias`. O valor é lido com `Number`, gravado via `preferenciasRepo.atualizar` e passa pelo
  `useEnvio` + `ListaErros` (a mensagem do Zod já está em pt-BR). Ao salvar, o aviso é "Preferências salvas.".
- Visual simples, no estilo das telas do M3 (cards `rounded-lg border bg-white`, `tabular-nums` nos valores).
  O polimento fica para o M6.

## Etapas

1. `src/domain/painel.ts` + `painel.test.ts`: `intervaloDoPeriodo` (incluindo ano bissexto e 29/02 → últimos 12
   meses, e "desde o início" com várias Assinaturas ou nenhuma) e `proximasCobrancas` (ordenação entre Assinaturas,
   limites inclusivos, Vigência futura, Período gratuito, Assinatura Cancelada).
   → verificar: `npm run test:coverage` com 100% em `src/domain/`.
2. `src/features/painel/PainelPage.tsx`: quatro seções (Total mensal equivalente, Próximos vencimentos, seletor de
   período + Gasto acumulado, Gasto por Categoria com barras e tabela). Ela usa `useAssinaturas`, `useCategorias` e
   `usePreferencias`, e mostra "Carregando…" enquanto algum deles for `undefined`. Se crescer, separar
   `GastoPorCategoria.tsx` na mesma pasta.
3. `src/features/painel/PainelPage.test.tsx`: um conjunto de dados fixo (data fixa com `vi.setSystemTime`,
   `gravarAssinatura`/`mensal` de `src/test/dados.ts`) cobrindo mensal, anual, Cancelada, Período gratuito e
   Vigência futura, em duas ou mais Categorias. As asserções comparam os valores na tela com os calculados à mão
   **e** com as funções do domínio. Também cobrir: troca do seletor de período, janela vinda das preferências
   (por exemplo 30 dias mostra mais vencimentos) e o estado vazio. → verificar: `npx vitest run src/features/painel`.
4. `src/features/configuracoes/ConfiguracoesPage.tsx` + teste: carrega 7, salva 30 e mostra o aviso, recusa 0 e
   "abc" com a mensagem em pt-BR, e o Painel passa a usar a janela salva.
5. Atualizar a seção "Estado atual" do `CLAUDE.md` (M4 concluído e `src/domain/painel.ts`).
   → verificar: `npm test`, `npm run lint`, `npm run format:check` e `npm run build`; depois `npm run dev` para
   conferir o Painel no navegador com dados reais.

## Arquivos críticos

- Novos: `src/domain/painel.ts`, `src/domain/painel.test.ts`, `src/features/painel/PainelPage.test.tsx`,
  `src/features/configuracoes/ConfiguracoesPage.test.tsx`
- Alterados: `src/features/painel/PainelPage.tsx`, `src/features/configuracoes/ConfiguracoesPage.tsx`, `CLAUDE.md`
- Reutilizados: `custoMensalEquivalente`, `gastoAcumulado`, `gastoPorCategoria` (`src/domain/custos.ts`),
  `estado` (`src/domain/assinatura.ts`), `cobrancasNoIntervalo` (`src/domain/cobrancas.ts`), os hooks de
  `src/db/hooks.ts`, `preferenciasRepo.atualizar`, `useEnvio`, `ListaErros`, `useAvisos`, `formatarMoeda`,
  `formatarDataISO`, `hoje` e as classes de `src/shared/estilos.ts`.

## Verificação

- `npm test` (domínio, Painel e Configurações), `npm run test:coverage` (100% em `src/domain/`), `npm run lint`,
  `npm run format:check` e `npm run build`.
- Manual: `npm run dev`, cadastrar duas ou três Assinaturas, conferir o total mensal contra a coluna da lista de
  Assinaturas, trocar o período, mudar a janela em Configurações e ver o Painel atualizar.
