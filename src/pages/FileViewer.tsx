import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Download, AlertTriangle, Loader2 } from 'lucide-react'
import { fetchAttachment } from '@/lib/githubStorage'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function FileViewer() {
  const { '*': filePath } = useParams<{ '*': string }>()
  const { isDemoMode } = useAuth()

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!filePath) { setError('Caminho de arquivo inválido'); setLoading(false); return }
    if (isDemoMode) { setError('Visualização de arquivos não disponível no modo demo'); setLoading(false); return }

    let objectUrl: string | null = null

    fetchAttachment(filePath)
      .then(({ blob, name }) => {
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setMimeType(blob.type)
        setFileName(name)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message ?? 'Erro ao carregar arquivo')
        setLoading(false)
      })

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [filePath, isDemoMode])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Carregando arquivo…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-500 max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="font-medium text-gray-700 dark:text-gray-200">Não foi possível carregar o arquivo</p>
          <p className="text-sm text-gray-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.close()}>Fechar</Button>
        </div>
      </div>
    )
  }

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'
  const canEmbed = isImage || isPdf

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <FileText className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-200 flex-1 truncate">{fileName}</span>
        <a
          href={blobUrl!}
          download={fileName}
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
        >
          <Download className="w-3.5 h-3.5" />
          Baixar
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {canEmbed ? (
          isPdf ? (
            <iframe
              src={blobUrl!}
              className="w-full flex-1 border-0"
              title={fileName}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img src={blobUrl!} alt={fileName} className="max-w-full max-h-full object-contain" />
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
            <FileText className="w-16 h-16" />
            <p className="text-sm">Visualização não disponível para este tipo de arquivo.</p>
            <a
              href={blobUrl!}
              download={fileName}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Baixar {fileName}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
