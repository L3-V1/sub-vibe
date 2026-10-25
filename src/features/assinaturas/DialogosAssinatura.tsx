import { addDays, format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router'
import { assinaturasRepo } from '../../db/assinaturasRepo'
import { ErroValidacao } from '../../db/esquemas'
import {
  adicionarVigencia,
  cancelar,
  desfazerUltimo,
} from '../../domain/assinatura'
import type { Assinatura, Categoria } from '../../domain/tipos'
import { Dialogo } from '../../shared/Dialogo'
import { campo, rotulo } from '../../shared/estilos'
import { formatarDataISO, hoje } from '../../shared/formatacao'
import { useAvisos } from '../../shared/useAvisos'
import { CamposBasicos } from './CamposBasicos'
import { CamposVigencia } from './CamposVigencia'
import { lerBasicos, lerVigencia } from './lerFormulario'

interface Props {
  assinatura: Assinatura
  onFechar: () => void
}

/** Grava a Assinatura transformada, fecha e avisa. */
function useGravar(onFechar: () => void) {
  const avisar = useAvisos()
  return async (nova: Assinatura, aviso: string) => {
    await assinaturasRepo.atualizar(nova)
    onFechar()
    avisar(aviso)
  }
}

/** Nova Vigência ou, se a última tem Data de cancelamento, Reativação. */
export function DialogoVigencia({ assinatura, onFechar }: Props) {
  const gravar = useGravar(onFechar)
  const ultima = assinatura.vigencias.at(-1)!
  const reativacao = ultima.fim !== undefined
  const inicio = reativacao
    ? format(addDays(parseISO(ultima.fim!), 1), 'yyyy-MM-dd')
    : hoje()

  return (
    <Dialogo
      titulo={reativacao ? 'Reativar Assinatura' : 'Nova Vigência'}
      rotuloConfirmar={reativacao ? 'Reativar' : 'Registrar'}
      onFechar={onFechar}
      onConfirmar={(dados) =>
        gravar(
          adicionarVigencia(assinatura, lerVigencia(dados)),
          reativacao ? 'Assinatura reativada.' : 'Nova Vigência registrada.',
        )
      }
    >
      <p className="text-sm text-slate-600">
        A contagem das Cobranças recomeça no início da nova Vigência, que pode
        ser uma data futura.
      </p>
      <CamposVigencia padrao={{ ...ultima, inicio }} />
    </Dialogo>
  )
}

export function DialogoCancelar({ assinatura, onFechar }: Props) {
  const gravar = useGravar(onFechar)

  return (
    <Dialogo
      titulo="Cancelar Assinatura"
      rotuloConfirmar="Cancelar Assinatura"
      perigo
      onFechar={onFechar}
      onConfirmar={async (dados) => {
        const data = String(dados.get('fim') ?? '')
        if (data === '') {
          throw new ErroValidacao(['Informe a Data de cancelamento.'])
        }
        await gravar(cancelar(assinatura, data), 'Cancelamento registrado.')
      }}
    >
      <p className="text-sm text-slate-600">
        Depois da Data de cancelamento não há mais Cobranças. Uma data futura
        mantém a Assinatura Ativa até lá.
      </p>
      <label className={rotulo}>
        Data de cancelamento
        <input type="date" name="fim" defaultValue={hoje()} className={campo} />
      </label>
    </Dialogo>
  )
}

export function DialogoEditar({
  assinatura,
  categorias,
  onFechar,
}: Props & { categorias: Categoria[] }) {
  const gravar = useGravar(onFechar)

  return (
    <Dialogo
      titulo="Editar Assinatura"
      rotuloConfirmar="Salvar"
      onFechar={onFechar}
      onConfirmar={(dados) =>
        gravar(
          { ...assinatura, ...lerBasicos(dados) },
          'Assinatura atualizada.',
        )
      }
    >
      <CamposBasicos categorias={categorias} padrao={assinatura} />
    </Dialogo>
  )
}

export function DialogoDesfazer({ assinatura, onFechar }: Props) {
  const gravar = useGravar(onFechar)
  const ultima = assinatura.vigencias.at(-1)!

  return (
    <Dialogo
      titulo="Desfazer último registro"
      rotuloConfirmar="Desfazer"
      onFechar={onFechar}
      onConfirmar={() =>
        gravar(desfazerUltimo(assinatura)!, 'Último registro desfeito.')
      }
    >
      <p>
        {ultima.fim !== undefined
          ? `Remover a Data de cancelamento de ${formatarDataISO(ultima.fim)}?`
          : `Remover a Vigência iniciada em ${formatarDataISO(ultima.inicio)}?`}
      </p>
    </Dialogo>
  )
}

export function DialogoExcluir({ assinatura, onFechar }: Props) {
  const navigate = useNavigate()
  const avisar = useAvisos()

  return (
    <Dialogo
      titulo="Excluir Assinatura"
      rotuloConfirmar="Excluir"
      perigo
      onFechar={onFechar}
      onConfirmar={async () => {
        await assinaturasRepo.excluir(assinatura.id)
        navigate('/assinaturas')
        avisar('Assinatura excluída.')
      }}
    >
      <p>
        Excluir a Assinatura {assinatura.servico}? Todo o histórico dela será
        perdido.
      </p>
    </Dialogo>
  )
}
