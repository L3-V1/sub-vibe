import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { categoriasRepo } from '../../db/categoriasRepo'
import { useAssinaturas, useCategorias } from '../../db/hooks'
import type { Categoria } from '../../domain/tipos'
import { Dialogo } from '../../shared/Dialogo'
import { EstadoVazio } from '../../shared/EstadoVazio'
import {
  botaoPequeno,
  botaoPrimario,
  botaoSecundario,
  campo,
  cartao,
  cartaoVazio,
  rotulo,
  tituloPagina,
  vidro,
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
        <h1 className={tituloPagina}>
          Categorias <span aria-hidden="true">🏷️</span>
        </h1>
        <p className="mt-2 text-texto-suave">
          Organize suas Assinaturas por Categoria.
        </p>
      </div>

      <form
        noValidate
        onSubmit={criacao.enviar}
        className={`${cartao} flex flex-col gap-3`}
      >
        <div className="max-w-md">
          <label htmlFor={idNome} className={rotulo}>
            Nova Categoria
          </label>
          <div className="flex gap-2">
            <input id={idNome} name="nome" className={campo} />
            <button type="submit" className={`${botaoPrimario} mt-1`}>
              <Plus className="size-4" />
              Criar
            </button>
          </div>
        </div>
        <ListaErros erros={criacao.erros} />
      </form>

      {categorias === undefined || assinaturas === undefined ? (
        <p className="text-texto-suave">Carregando…</p>
      ) : categorias.length === 0 ? (
        <div className={cartaoVazio}>
          <EstadoVazio icone="categorias">
            <p>Nenhuma Categoria cadastrada.</p>
          </EstadoVazio>
        </div>
      ) : (
        <ul className={`divide-y divide-borda ${vidro}`}>
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
                    <span className="text-sm text-texto-suave">
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
                      <Pencil className="size-3.5" />
                      Renomear
                    </button>
                    <button
                      type="button"
                      className={botaoPequeno}
                      aria-label={`Excluir ${c.nome}`}
                      onClick={() => setExcluindo(c)}
                    >
                      <Trash2 className="size-3.5" />
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
      <label className={`${rotulo} max-w-md`}>
        Novo nome de {categoria.nome}
        <input
          name="nome"
          defaultValue={categoria.nome}
          autoFocus
          className={campo}
        />
      </label>
      <ListaErros erros={erros} />
      <span className="flex gap-2">
        <button type="submit" className={botaoPrimario}>
          <Save className="size-4" />
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
      icone={Trash2}
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
