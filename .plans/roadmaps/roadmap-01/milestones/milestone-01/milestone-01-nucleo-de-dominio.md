---
titulo: M1 · Núcleo de domínio (Sub-vibe)
data: 2026-10-25
status: implementado
tipo: milestone
numero: "01"
pai: roadmaps/roadmap-01
triagem: ok
---

# M1 · Núcleo de domínio (Sub-vibe)

## Contexto

O M0 está concluído (Vite + React + TS, Tailwind, Vitest, layout). `src/domain/` está vazio. Pelo ADR 0002,
as Cobranças nunca são persistidas, então todo o comportamento do app (Próximo vencimento, estado, custos,
Gasto acumulado) depende de funções puras que derivam tudo das Vigências. O M1 implementa essas funções
e as cobre com testes. Isso vem antes da persistência (M2) e das telas (M3/M4).

**Pronto quando:** cobertura alta em `src/domain/` e todos os cenários da sabatina viraram testes.

## Decisões tomadas com o usuário

1. **`fim` pode estar em qualquer Vigência**, não só na última. Isso corrige a invariante do roadmap, que
   contradizia a Reativação. As invariantes passam a ser:
   - há pelo menos uma Vigência;
   - os inícios estão em ordem estritamente crescente;
   - `fim ≥ inicio` em toda Vigência;
   - se uma Vigência tem `fim`, a próxima começa **depois** do `fim` (`proxima.inicio > fim`);
   - `valorCentavos` é inteiro ≥ 0 e `ciclo.quantidade` é inteiro ≥ 1 (isso também impede laço infinito).
2. **Período gratuito (R$ 0) não gera Cobranças.**
3. **As datas são strings ISO `'AAAA-MM-DD'`** (tipo `DataISO`), ou seja, só o dia do calendário, sem fuso.
   O date-fns faz as contas por dentro.

## Premissas (sem pergunta; me corrija se alguma estiver errada)

- Os intervalos `de`/`ate` incluem as duas pontas. `hoje` sempre chega por parâmetro, para manter as funções puras.
- Uma Vigência gera Cobranças em `inicio + k·N` (k ≥ 0, ou seja, a primeira cai no próprio início). Elas são calculadas
  sempre a partir da âncora, com `addDays/addWeeks/addMonths/addYears(inicio, k·N)`. O date-fns já leva
  31/01 para 28/02 e volta a 31/03, e leva 29/02 para 28/02 no ano seguinte.
- Fim efetivo de uma Vigência = o menor entre o `fim` e a véspera do início da próxima. Uma **Cobrança no dia do
  cancelamento conta**, porque o glossário diz "não há Cobranças *depois* dela".
- `estado(a, hoje)` = `'Cancelada'` se a última Vigência tem `fim ≤ hoje`; nos outros casos, `'Ativa'`. Com isso,
  um cancelamento com data futura continua Ativa até essa data, e uma Assinatura que só tem Vigência futura é Ativa.
- `proximoVencimento(a, hoje)` = a primeira Cobrança com data ≥ hoje (inclui as de Vigências futuras), ou
  `undefined` se não houver nenhuma.
- `custoMensalEquivalente(a, hoje)` usa a Vigência vigente hoje e dá 0 se nenhuma estiver vigente (Assinatura
  Cancelada, ou com só Vigência futura). O resultado é arredondado com `Math.round` para centavos inteiros.
- `gastoAcumulado(assinaturas, de, ate)` soma as Cobranças do intervalo. Quem chama passa `ate = hoje` para
  ficar só com as "já ocorridas". `gastoPorCategoria` faz a mesma soma, mas agrupada em `Record<categoriaId, centavos>`.
- `validarAssinatura` devolve `string[]` com mensagens em pt-BR (lista vazia = válida). O M2 usa isso antes de
  gravar e o M3 mostra as mensagens na tela.
- Dependências novas: `date-fns` e, em dev, `@vitest/coverage-v8` (para medir o "Pronto quando").
  O Zod fica para o M2/M5.

## Etapas

1. **Dependências e tipos** → verificar: `npm run build` passa.
   - `npm i date-fns`; `npm i -D @vitest/coverage-v8`; script `test:coverage` = `vitest run --coverage`
     (com `coverage.include: ['src/domain/**']` no `vite.config.ts`).
   - `src/domain/tipos.ts`: `DataISO`, `UnidadeCiclo`, `Ciclo`, `Vigencia`, `Assinatura`, `Categoria`,
     `Cobranca { assinaturaId, data, valorCentavos }`, `EstadoAssinatura = 'Ativa' | 'Cancelada'`.

2. **Invariantes e estado** (`src/domain/assinatura.ts` + teste) → verificar: os testes passam.
   - `validarAssinatura(a): string[]`, `estado(a, hoje)`, `vigenciaEm(a, data)` (devolve a Vigência vigente
     numa data, ou `undefined`).
   - Testes: cada invariante violada gera a sua mensagem; Reativação válida (Vigência com `fim` seguida de outra);
     cancelamento no dia do início é válido; estado antes, no dia e depois do `fim`; cancelamento com data futura.

3. **Cobranças** (`src/domain/cobrancas.ts` + teste) → verificar: os testes passam.
   - `cobrancasNoIntervalo(a, de, ate): Cobranca[]` em ordem de data. Para cada Vigência, recorta o período entre
     o maior de (`inicio`, `de`) e o menor de (fim efetivo, `ate`), gera `inicio + k·N` e pula as de R$ 0.
   - `proximoVencimento(a, hoje)`: percorre as Vigências cujo fim efetivo é ≥ hoje e devolve a primeira Cobrança
     ≥ hoje. Em uma Vigência aberta, ela aparece em no máximo um ciclo depois de max(hoje, início).
   - Testes dos cenários da sabatina: 31/01 mensal (28/02 ou 29/02, depois 31/03), 29/02 anual,
     troca de ciclo no meio do mês (a Vigência antiga para na véspera e a nova cobra no seu início),
     Vigência futura, Período gratuito seguido de Vigência paga, cancelar e reativar (sem Cobranças no
     intervalo cancelado), Cobrança exatamente no dia do cancelamento, ciclos de N > 1 (a cada 3 meses,
     a cada 2 semanas) e intervalo que corta uma Vigência pela metade.

4. **Custos e gastos** (`src/domain/custos.ts` + teste) → verificar: os testes passam.
   - `custoMensalEquivalente` com os fatores mês → v/N, ano → v/12N, semana → v·52/12N,
     dia → v·365/12N; `gastoAcumulado`; `gastoPorCategoria`.
   - Testes: um caso por unidade, N > 1, arredondamento, Cancelada → 0, só Vigência futura → 0, gasto
     incluindo uma Assinatura hoje Cancelada, agrupamento por Categoria.

5. **Cobertura e documentação** → verificar: `npm run test:coverage` mostra cobertura alta em `src/domain/`
   (meta ≥ 95% de linhas e branches), e `npm run lint`, `npm run format:check` e `npm run build` passam.
   - Remover `src/domain/.gitkeep`.
   - Atualizar o `CLAUDE.md`: "Estado atual" (M1 concluído) e a linha de invariantes ("`fim` em qualquer Vigência; a
     próxima começa depois do `fim`"), e trocar "fim só na última" no roadmap pela regra nova.
   - Sem commit, a menos que você peça.

## Arquivos críticos

- `src/domain/tipos.ts`, `assinatura.ts`, `cobrancas.ts`, `custos.ts` (+ `*.test.ts` ao lado)
- `package.json`, `vite.config.ts` (bloco de cobertura)
- `CLAUDE.md`, `.plans/roadmaps/roadmap-01/roadmap-01-implementacao-sub-vibe.md` (invariante corrigida)

## Verificação

- `npm test` e `npm run test:coverage`: todos os testes de domínio passam e a cobertura de `src/domain/` fica alta.
- `npm run build` (sem erros de tipo), `npm run lint` e `npm run format:check`: tudo limpo.
- O M1 não muda a UI, então não há teste manual no navegador.
