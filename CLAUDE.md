# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual

M0 (fundação) concluído: esqueleto Vite + React 19 + TypeScript, Tailwind CSS v4, React Router (`createBrowserRouter`), oxlint + Prettier, Vitest + Testing Library, layout com navegação e telas placeholder. `src/domain/` e `src/db/` ainda vazios (M1/M2). Antes de implementar, leia o marco correspondente (M1 a M6) em `.plans/roadmaps/roadmap-01/roadmap-01-implementacao-sub-vibe.md`; cada marco tem um critério "Pronto quando".

## O que é

App pessoal, só frontend, para registrar Assinaturas recorrentes (streaming, cursos, I.A.) e acompanhar gastos e vencimentos. Nenhum pagamento passa pelo app. Interface e mensagens em pt-BR; valores sempre em reais.

Stack: React + Vite + TypeScript, Tailwind CSS v4, React Router, Vitest + Testing Library. Dexie (IndexedDB), date-fns e Zod entram em M1/M2, quando forem usados.

## Comandos

- `npm run dev`: servidor de desenvolvimento
- `npm test` (`vitest run`) e `npm run test:watch`
- `npm run build`: `tsc -b` + `vite build`
- `npm run lint` (oxlint), `npm run format` e `npm run format:check` (Prettier, com `prettier-plugin-tailwindcss`; `.md` fica de fora)
- Um teste só: `npx vitest run src/shared/formatacao.test.ts` (ou `-t "<nome do teste>"`)
- Testes sem globals: importe `describe/it/expect` de `vitest`. O setup (`src/test/setup.ts`) carrega o jest-dom e faz o `cleanup` após cada teste.
- Testes de persistência (M2) usarão `fake-indexeddb`.

## Arquitetura

- `src/domain/`: regras puras, sem React nem Dexie. É o coração do sistema e deve ser muito testado.
- `src/db/`: Dexie (`db.ts`, schema versionado) e repositórios finos (`*Repo.ts`) que validam as invariantes do domínio antes de gravar. Leitura reativa via `useLiveQuery`.
- `src/features/<área>/`: telas (`painel`, `assinaturas`, `categorias`, `configuracoes`; o backup chega no M5).
- `src/router.tsx`: exporta `rotas` (reusadas nos testes com `createMemoryRouter`) e `router`.
- `src/shared/`: formatação de moeda/data pt-BR e componentes de UI.

### Decisões que moldam o código

- **Sem backend (ADR 0001):** tudo persiste no IndexedDB do navegador. Não há login, servidor nem notificações agendadas; alertas só aparecem com o app aberto. Chamar `navigator.storage.persist()` na inicialização. O backup JSON (exportar/importar com Zod, `versaoSchema`) é a única proteção contra perda de dados.
- **Cobranças nunca são persistidas (ADR 0002):** a Assinatura guarda só sua sequência de Vigências; Cobranças, Próximo vencimento, Gasto acumulado e o estado Ativa/Cancelada são sempre **derivados**. Não introduza um registro de "pago" sem rever o ADR.
- Cancelamento = `fim` na última Vigência; Reativação = nova Vigência na mesma Assinatura, depois desse `fim`.
- Cada Vigência recomeça a contagem: vencimentos são `inicio + k·N` a partir da âncora da Vigência, nunca somados iterativamente (para não perder o dia original). No ciclo mensal, dia inexistente (ex.: 31) cai no último dia do mês e volta ao dia original no mês seguinte.
- Dinheiro sempre em centavos inteiros.
- Custo mensal equivalente usa a Vigência vigente hoje: mês → valor/N, ano → valor/12N, semana → valor·52/12N, dia → valor·365/12N.
- Invariantes: Vigências ordenadas e sem sobreposição; `fim` só na última; cancelamento ≥ início.

## Vocabulário

O código usa os termos de `GLOSSARY.md` (Assinatura, Serviço, Categoria, Ciclo de cobrança, Vigência, Cobrança, Próximo vencimento, Período gratuito, Data de cancelamento, Reativação, Gasto acumulado), em português, e evita os sinônimos listados como "_Evitar_" (ex.: não usar "plano", "trial", "pagamento", "pausada"). Termos novos ou decisões arquiteturais vão para `GLOSSARY.md` e `docs/adr/` (skill `brainstorming:domain-modeling`).

## Planos

Planos aprovados ficam em `.plans/`, organizados pelas skills `planning:plan-backup` e `planning:plan-triage` (índice em `.plans/TAXONOMY.md`).

**Contrapartida:** Estas diretrizes favorecem a cautela em vez da velocidade. Para tarefas triviais, use o bom senso.

## Pense antes de codar

**Não presuma. Não esconda a confusão. Exponha as contrapartidas.**

Antes de implementar:
- Declare suas premissas explicitamente. Se estiver em dúvida, pergunte.
- Se houver múltiplas interpretações, apresente-as - não escolha em silêncio.
- Se existir uma abordagem mais simples, diga. Discorde quando for justificado.
- Se algo não estiver claro, pare. Diga o que está confuso. Pergunte.

## Simplicidade primeiro

**O mínimo de código que resolve o problema. Nada especulativo.**

- Nenhuma funcionalidade além do que foi pedido.
- Nenhuma abstração para código de uso único.
- Nenhuma "flexibilidade" ou "configurabilidade" que não foi solicitada.
- Nenhum tratamento de erro para cenários impossíveis.
- Se você escreveu 200 linhas e poderiam ser 50, reescreva.

Pergunte a si mesmo: "Um engenheiro sênior diria que isto está complicado demais?" Se sim, simplifique.

## Mudanças cirúrgicas

**Toque só no que for necessário. Limpe apenas a sua própria bagunça.**

Ao editar código existente:
- Não "melhore" código, comentários ou formatação adjacentes.
- Não refatore o que não está quebrado.
- Siga o estilo existente, mesmo que você fizesse diferente.
- Se notar código morto não relacionado, mencione - não apague.

Quando suas mudanças criarem órfãos:
- Remova imports/variáveis/funções que as SUAS mudanças deixaram sem uso.
- Não remova código morto preexistente, a menos que seja pedido.

O teste: toda linha alterada deve se ligar diretamente ao pedido do usuário.

## Execução orientada a metas

**Defina critérios de sucesso. Itere até verificar.**

Transforme tarefas em metas verificáveis:
- "Adicionar validação" → "Escrever testes para entradas inválidas e então fazê-los passar"
- "Corrigir o bug" → "Escrever um teste que o reproduza e então fazê-lo passar"
- "Refatorar X" → "Garantir que os testes passem antes e depois"

Para tarefas com várias etapas, apresente um plano breve:
```
1. [Etapa] → verificar: [checagem]
2. [Etapa] → verificar: [checagem]
3. [Etapa] → verificar: [checagem]
```

Critérios de sucesso fortes permitem iterar de forma independente. Critérios fracos ("faça funcionar") exigem esclarecimentos constantes.

---

**Estas diretrizes estão funcionando se:** houver menos mudanças desnecessárias nos diffs, menos reescritas por excesso de complexidade, e as perguntas de esclarecimento vierem antes da implementação, não depois dos erros.
