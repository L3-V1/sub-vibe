import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  gerarBackup,
  lerBackup,
  nomeArquivoBackup,
  restaurarBackup,
  type Backup,
} from '../../db/backup'
import { ErroValidacao } from '../../db/esquemas'
import { useAssinaturas, useCategorias } from '../../db/hooks'
import { Dialogo } from '../../shared/Dialogo'
import {
  botaoPrimario,
  campo,
  cartao,
  rotulo,
  tituloPagina,
} from '../../shared/estilos'
import { formatarData, hoje } from '../../shared/formatacao'
import { ListaErros } from '../../shared/ListaErros'
import { useAvisos } from '../../shared/useAvisos'
import { useEnvio } from '../../shared/useEnvio'

export function BackupPage() {
  const avisar = useAvisos()
  const arquivoRef = useRef<HTMLInputElement>(null)
  const [backup, setBackup] = useState<Backup | null>(null)
  const { erros, enviar } = useEnvio(async () => {
    const arquivo = arquivoRef.current?.files?.[0]
    if (arquivo === undefined) {
      throw new ErroValidacao(['Escolha um arquivo de backup.'])
    }
    setBackup(lerBackup(await arquivo.text()))
  })

  async function exportar() {
    const texto = JSON.stringify(await gerarBackup(), null, 2)
    const url = URL.createObjectURL(
      new Blob([texto], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivoBackup(hoje())
    link.click()
    URL.revokeObjectURL(url)
    avisar('Backup exportado.')
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className={tituloPagina}>
          Backup <span aria-hidden="true">💾</span>
        </h1>
        <p className="mt-2 text-texto-suave">
          Os dados só existem neste navegador. Exporte um backup de tempos em
          tempos e guarde o arquivo em outro lugar.
        </p>
      </div>

      <div className={`${cartao} flex flex-col gap-3`}>
        <h2 className="text-lg font-semibold">Exportar</h2>
        <p className="text-sm text-texto-suave">
          Baixa um arquivo JSON com Categorias, Assinaturas e preferências.
        </p>
        <button
          type="button"
          onClick={exportar}
          className={`${botaoPrimario} self-start`}
        >
          <Download className="size-4" />
          Exportar backup
        </button>
      </div>

      <form
        noValidate
        onSubmit={enviar}
        className={`${cartao} flex flex-col gap-3`}
      >
        <h2 className="text-lg font-semibold">Importar</h2>
        <p className="text-sm text-texto-suave">
          Substitui todos os dados atuais pelos do arquivo.
        </p>
        <label className={`${rotulo} max-w-md`}>
          Arquivo de backup
          <input
            ref={arquivoRef}
            name="arquivo"
            type="file"
            accept="application/json,.json"
            className={campo}
          />
        </label>
        <ListaErros erros={erros} />
        <button type="submit" className={`${botaoPrimario} self-start`}>
          <Upload className="size-4" />
          Importar…
        </button>
      </form>

      {backup !== null && (
        <DialogoSubstituir
          backup={backup}
          onFechar={() => setBackup(null)}
          onSubstituido={() => {
            setBackup(null)
            arquivoRef.current!.value = ''
            avisar('Backup importado.')
          }}
        />
      )}
    </section>
  )
}

function DialogoSubstituir({
  backup,
  onFechar,
  onSubstituido,
}: {
  backup: Backup
  onFechar: () => void
  onSubstituido: () => void
}) {
  const categorias = useCategorias()
  const assinaturas = useAssinaturas()

  return (
    <Dialogo
      titulo="Substituir todos os dados?"
      rotuloConfirmar="Substituir tudo"
      icone={Upload}
      perigo
      onFechar={onFechar}
      onConfirmar={async () => {
        await restaurarBackup(backup)
        onSubstituido()
      }}
    >
      <p className="text-sm text-texto-suave">
        Backup exportado em {formatarData(new Date(backup.exportadoEm))}, com{' '}
        {backup.categorias.length} Categoria(s) e {backup.assinaturas.length}{' '}
        Assinatura(s).
      </p>
      <p className="text-sm text-texto-suave">
        Serão apagadas {categorias?.length ?? '…'} Categoria(s) e{' '}
        {assinaturas?.length ?? '…'} Assinatura(s) atuais. Essa ação não pode
        ser desfeita.
      </p>
    </Dialogo>
  )
}
