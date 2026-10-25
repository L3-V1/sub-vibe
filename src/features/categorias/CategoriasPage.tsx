import { useId, useState } from 'react'
import { categoriasRepo } from '../../db/categoriasRepo'
import { useAssinaturas, useCategorias } from '../../db/hooks'
import type { Categoria } from '../../domain/tipos'
import { Dialogo } from '../../shared/Dialogo'
import {
  botaoPequeno,
  botaoPrimario,
  botaoSecundario,
  campo,
  rotulo,
} from '../../shared/estilos'
import { ListaErros } from '../../shared/ListaErros'
import { useAvisos } from '../../shared/useAvisos'
import { useEnvio } from '../../shared/useEnvio'

export function CategoriasPage() {
  const categorias = useCategorias()
  const assinaturas = useAssinaturas()
  const avisar = useAvisos()
  const [renomeando, setRenomeando] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState<Categoria | null>(null)
  const idNome = useId()

  const criacao = useEnvio(async (dados, formulario) => {
    await categoriasRepo.criar(String(dados.get('nome')))
    formulario.reset()
    avisar('Categoria criada.')
  })

  const emUso = (id: string) =>
    assinaturas?.filter((a) => a.categoriaId === id).length ?? 0

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="mt-2 text-slate-600">
          Organize suas Assinaturas por Categoria.
        </p>
      </div>

      <form
        noValidate
        onSubmit={criacao.enviar}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <div>
          <label htmlFor={idNome} className={rotulo}>
            Nova Categoria
          </label>
          <div className="flex gap-2">
            <input id={idNome} name="nome" className={campo} />
            <button type="submit" className={`${botaoPrimario} mt-1`}>
              Criar
            </button>
          </div>
        </div>
        <ListaErros erros={criacao.erros} />
      </form>

      {categorias === undefined || assinaturas === undefined ? (
        <p className="text-slate-600">Carregando…</p>
      ) : categorias.length === 0 ? (
        <p className="text-slate-600">Nenhuma Categoria cadastrada.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {categorias.map((c) => (
            <li key={c.id} className="px-4 py-3">
              {renomeando === c.id ? (
                <FormularioRenomear
                  categoria={c}
                  onFechar={() => setRenomeando(null)}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{c.nome}</span>{' '}
                    <span className="text-sm text-slate-600">
                      {emUso(c.id)} Assinatura(s)
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className={botaoPequeno}
                      aria-label={`Renomear ${c.nome}`}
                      onClick={() => setRenomeando(c.id)}
                    >
                      Renomear
                    </button>
                    <button
                      type="button"
                      className={botaoPequeno}
                      aria-label={`Excluir ${c.nome}`}
                      onClick={() => setExcluindo(c)}
                    >
                      Excluir
                    </button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {excluindo !== null && categorias !== undefined && (
        <DialogoExcluir
          categoria={excluindo}
          emUso={emUso(excluindo.id)}
          destinos={categorias.filter((c) => c.id !== excluindo.id)}
          onFechar={() => setExcluindo(null)}
        />
      )}
    </section>
  )
}

function FormularioRenomear({
  categoria,
  onFechar,
}: {
  categoria: Categoria
  onFechar: () => void
}) {
  const avisar = useAvisos()
  const { erros, enviar } = useEnvio(async (dados) => {
    await categoriasRepo.renomear(categoria.id, String(dados.get('nome')))
    onFechar()
    avisar('Categoria renomeada.')
  })

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-2">
      <label className={rotulo}>
        Novo nome de {categoria.nome}
        <input
          name="nome"
          defaultValue={categoria.nome}
          autoFocus
          className={`${campo} max-w-sm`}
        />
      </label>
      <ListaErros erros={erros} />
      <span className="flex gap-2">
        <button type="submit" className={botaoPrimario}>
          Salvar
        </button>
        <button type="button" className={botaoSecundario} onClick={onFechar}>
          Voltar
        </button>
      </span>
    </form>
  )
}

function DialogoExcluir({
  categoria,
  emUso,
  destinos,
  onFechar,
}: {
  categoria: Categoria
  emUso: number
  destinos: Categoria[]
  onFechar: () => void
}) {
  const avisar = useAvisos()

  return (
    <Dialogo
      titulo="Excluir Categoria"
      rotuloConfirmar="Excluir"
      perigo
      onFechar={onFechar}
      onConfirmar={async (dados) => {
        await categoriasRepo.excluir(
          categoria.id,
          emUso > 0 ? String(dados.get('destino')) : undefined,
        )
        onFechar()
        avisar('Categoria excluída.')
      }}
    >
      {emUso === 0 ? (
        <p>Excluir a Categoria {categoria.nome}?</p>
      ) : (
        <>
          <p>
            A Categoria {categoria.nome} é usada por {emUso} Assinatura(s).
            Escolha para qual Categoria movê-las antes de excluir.
          </p>
          <label className={rotulo}>
            Mover para
            <select name="destino" className={campo}>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </Dialogo>
  )
}
