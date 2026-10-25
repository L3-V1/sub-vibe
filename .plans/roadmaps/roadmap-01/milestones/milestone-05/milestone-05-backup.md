---
titulo: M5 · Backup (Sub-vibe)
data: 2026-10-25
status: implementado
tipo: milestone
numero: "05"
pai: roadmaps/roadmap-01
triagem: ok
---

# M5 · Backup (Sub-vibe)

## Contexto

O M0 ao M4 estão concluídos. O M4 ainda não foi commitado: vale commitá-lo antes de começar, para o diff do M5 sair limpo.
Pelo ADR 0001, tudo mora no IndexedDB do navegador, e o backup JSON é a única proteção contra perda de dados. O
M5 cria a exportação e a importação (com substituição total) desse backup.

Hoje existem: as tabelas `categorias`, `assinaturas` e `preferencias` (`src/db/db.ts`, schema v1); os esquemas
Zod `esquemaCategoria`, `esquemaAssinatura` e `esquemaPreferencias`, mais `validar` e `ErroValidacao`
(`src/db/esquemas.ts`); `validarAssinatura` (`src/domain/assinatura.ts`); e os repositórios com `listar`/`obter`.

**Pronto quando** (roadmap): exportar, limpar o IndexedDB e importar devolve um estado idêntico, com um teste
automatizado de ida e volta.

## Decisões tomadas com o usuário

- **Nova tela `/backup`**, em `src/features/backup/`, com o link "Backup" na navegação.
- **Validação completa na importação:** formato (Zod), invariantes do domínio (`validarAssinatura`), toda Assinatura
  apontando para uma Categoria do próprio arquivo, e ids e nomes de Categoria únicos. Qualquer erro recusa o
  arquivo inteiro e mostra a lista de mensagens em pt-BR.

## Premissas (me corrija se alguma estiver errada)

- **Formato:** `{ versaoSchema: 1, exportadoEm, categorias, assinaturas, preferencias }`. `exportadoEm` é um
  ISO datetime (`new Date().toISOString()`). `VERSAO_SCHEMA = 1` acompanha o `db.version(1)`. Quando o Dexie
  mudar de versão, a constante muda junto e entra uma migração.
- **Nome do arquivo:** `sub-vibe-backup-${hoje()}.json`, com JSON indentado (2 espaços) para ficar legível.
- **Ordem da validação em `lerBackup(texto)`:**
  1. JSON inválido → "O arquivo não é um JSON válido."
  2. Sem `versaoSchema` numérico → "O arquivo não é um backup do Sub-vibe."
  3. `versaoSchema` diferente de 1 → "Este backup usa a versão X do formato, e este app só lê a versão 1."
  4. Estrutura e cada item com os esquemas atuais (cada item validado à parte com `validar`, para reaproveitar as
     mensagens, prefixadas com "Assinatura N:" ou "Categoria N:"), depois as invariantes, as referências e a
     unicidade.
- **Preferências:** a exportação usa `preferenciasRepo.obter()`, ou seja, o padrão se o registro ainda não
  existir. A importação grava o registro. O estado lido pelos repositórios fica idêntico.
- **Substituição:** numa só transação `rw` nas três tabelas, faz `clear()` e depois `bulkAdd`/`put`. As Categorias
  iniciais do `populate` também são apagadas, porque o backup substitui tudo.
- **Prévia antes de substituir:** um `Dialogo` com `perigo`, título "Substituir todos os dados?", a data da
  exportação, as quantidades do arquivo (Categorias e Assinaturas) e as quantidades atuais que serão apagadas.
  O botão de confirmar diz "Substituir tudo"; "Voltar" cancela sem alterar nada.
- **Avisos:** "Backup exportado." e "Backup importado.". Um texto curto na tela lembra que os dados só existem
  neste navegador.
- "Backup" é termo técnico, não de domínio, então não entra no `GLOSSARY.md`.

## Etapas

1. `src/db/backup.ts`: `VERSAO_SCHEMA`, o tipo `Backup`, `gerarBackup()` (lê numa transação `r`, pelos repositórios),
   `lerBackup(texto): Backup` (lança `ErroValidacao`), `restaurarBackup(backup)` e `nomeArquivoBackup(hoje)`.
2. `src/db/backup.test.ts`:
   - **Ida e volta:** um conjunto rico (Categoria renomeada e criada, Assinatura cancelada e reativada, Período
     gratuito, Vigência futura, `observacoes`, janela de 30 dias). Gera o backup, faz `JSON.stringify`, depois
     `db.delete()` + `db.open()` (o `populate` recria as Categorias iniciais), então `lerBackup` + `restaurarBackup`.
     Por fim compara as três tabelas e o `gerarBackup` com o original (tudo menos `exportadoEm`).
   - **Recusas:** JSON quebrado, sem versão, versão 2, Vigências sobrepostas, `categoriaId` órfão, id de Categoria
     repetido, nome repetido e valor negativo. Cada uma confere a mensagem e que o banco ficou intacto.
   → verificar: `npx vitest run src/db/backup.test.ts`.
3. `src/features/backup/BackupPage.tsx`:
   - card **Exportar**: botão "Exportar backup" que monta um `Blob`, gera `URL.createObjectURL`, clica num `<a download>`
     e chama `revokeObjectURL`;
   - card **Importar**: formulário `noValidate` com `<input type="file" accept="application/json,.json">` e o botão
     "Importar…", via `useEnvio`/`ListaErros`; o arquivo é lido com `file.text()` e passa por `lerBackup`; se
     estiver válido, abre o `Dialogo` de prévia, e ao confirmar chama `restaurarBackup`, mostra o aviso e limpa o
     input.
4. `src/router.tsx` (rota `backup`) e `src/shared/Layout.tsx` (link "Backup" entre Categorias e Configurações),
   ajustando o `Layout.test.tsx` se ele contar os links.
5. `src/features/backup/BackupPage.test.tsx`:
   - exportar: stub de `URL.createObjectURL`, espião em `HTMLAnchorElement.prototype.click`, e checagem do nome do
     arquivo e do conteúdo do Blob;
   - importar: arquivo válido (via `userEvent.upload`) mostra a prévia com as quantidades, e "Substituir tudo"
     troca os dados e mostra o aviso;
   - "Voltar" não altera nada;
   - JSON inválido e versão desconhecida mostram as mensagens.
   → verificar: `npx vitest run src/features/backup`.
6. Atualizar o "Estado atual" e a "Arquitetura" do `CLAUDE.md` (M5 concluído, `src/db/backup.ts`, rota `/backup`).
   → verificar: `npm test`, `npm run test:coverage` (o domínio continua em 100%), `npm run lint`,
   `npm run format:check` e `npm run build`.

## Arquivos críticos

- Novos: `src/db/backup.ts`, `src/db/backup.test.ts`, `src/features/backup/BackupPage.tsx`,
  `src/features/backup/BackupPage.test.tsx`
- Alterados: `src/router.tsx`, `src/shared/Layout.tsx` (e talvez `Layout.test.tsx`), `CLAUDE.md`
- Reutilizados: `esquemaCategoria`, `esquemaAssinatura`, `esquemaPreferencias`, `validar`, `ErroValidacao`
  (`src/db/esquemas.ts`), `validarAssinatura` (`src/domain/assinatura.ts`), `categoriasRepo.listar`,
  `assinaturasRepo.listar`, `preferenciasRepo.obter`, `db`, `Dialogo`, `useEnvio`, `ListaErros`, `useAvisos`,
  `hoje`, `formatarData`, as classes de `src/shared/estilos.ts` e os dados de teste de `src/test/dados.ts`.

## Verificação

- Automática: os comandos da etapa 6, com o teste de ida e volta como critério do "Pronto quando".
- Manual (`npm run dev` ou Playwright):
  1. Cadastrar duas ou três Assinaturas e exportar.
  2. Em DevTools → Application, limpar os dados do site e recarregar: só as Categorias iniciais aparecem.
  3. Importar o arquivo, conferir a prévia e confirmar: Painel, Assinaturas e Configurações voltam iguais.
  4. Editar o JSON para `"versaoSchema": 2` e ver a recusa.
