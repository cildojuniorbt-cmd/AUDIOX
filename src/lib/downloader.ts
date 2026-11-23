const MEDIA_EXTENSIONS = new Set([
  'mp3','wav','flac','m4a','aac','ogg','opus','wma','aiff','alac','ape','ac3','dts','amr','mp2',
  'mp4','mkv','mov','avi','webm','wmv','flv','mpeg','mpg','m4v','3gp','ts','mts','m2ts','vob','ogv','mxf','asf','dv','gif'
])

const MEDIA_MIME = /^(audio|video)\//
const MIME_EXTENSIONS: Record<string, string> = { 'audio/mpeg':'mp3', 'audio/mp3':'mp3', 'audio/wav':'wav', 'audio/x-wav':'wav', 'audio/flac':'flac', 'audio/mp4':'m4a', 'audio/aac':'aac', 'audio/ogg':'ogg', 'audio/opus':'opus', 'audio/webm':'webm', 'video/mp4':'mp4', 'video/webm':'webm', 'video/quicktime':'mov', 'video/x-matroska':'mkv', 'video/x-msvideo':'avi', 'video/mpeg':'mpeg', 'video/3gpp':'3gp' }

function filenameFromResponse(response: Response, url: URL, mime: string) {
  const disposition = response.headers.get('content-disposition') || ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  let name = encoded ? decodeURIComponent(encoded) : plain
  if (!name) name = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')
  if (!name || !name.includes('.')) {
    const extension = MIME_EXTENSIONS[mime] || (mime.startsWith('audio/') ? 'audio' : 'video')
    name = `AUDIOX-download.${extension}`
  }
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 160)
}

export async function downloadDirectMedia(
  rawUrl: string,
  onProgress: (progress: number | null) => void
): Promise<File> {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new Error('Informe um endereço de mídia válido.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use um link HTTP ou HTTPS público, sem credenciais embutidas.')
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    throw new Error('Este é um link de página do YouTube, não um arquivo de mídia direto. O AUDIOX ainda não possui integração autorizada com o YouTube. Para vídeos do seu próprio canal, baixe o arquivo pelo YouTube Studio e depois importe-o no Conversor. Não é possível extrair MP3/MP4 deste link por este módulo.')
  }
  if (host.endsWith('instagram.com') || host.endsWith('facebook.com') || host.endsWith('tiktok.com') || host.endsWith('x.com') || host.endsWith('twitter.com')) {
    throw new Error('Este é um link de página de rede social, não um arquivo direto. O AUDIOX ainda não possui integração oficial para esta plataforma. Use a opção de download/exportação disponibilizada pela própria rede, quando disponível, e importe o arquivo no Conversor.')
  }

  const pathName = url.pathname.split('/').filter(Boolean).pop() || ''
  const extension = pathName.includes('.') ? pathName.split('.').pop()?.toLowerCase() || '' : ''
  if (['m3u8', 'mpd'].includes(extension)) throw new Error('Este link é uma lista de transmissão HLS/DASH, não um arquivo único. O suporte a streaming ainda não está disponível.')

  let response: Response
  try {
    response = await fetch(url.href, { method: 'GET', credentials: 'omit', redirect: 'follow' })
  } catch {
    throw new Error('O site bloqueou a leitura direta (CORS) ou não está acessível. Tente um link direto de arquivo com acesso permitido.')
  }
  if (!response.ok) throw new Error(`O servidor respondeu HTTP ${response.status}. Verifique se o link está público e ainda válido.`)
  const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const responsePath = new URL(response.url || url.href).pathname.split('/').filter(Boolean).pop() || ''
  const responseExtension = responsePath.includes('.') ? responsePath.split('.').pop()?.toLowerCase() || '' : ''
  if (!MEDIA_MIME.test(mime) && !MEDIA_EXTENSIONS.has(extension) && !MEDIA_EXTENSIONS.has(responseExtension)) throw new Error('O servidor não identificou o conteúdo como áudio ou vídeo. Use um link direto para um arquivo de mídia.')
  const length = Number(response.headers.get('content-length') || 0)
  if (length > 500 * 1024 * 1024) throw new Error('O arquivo ultrapassa o limite de 500 MB da versão web.')
  const name = filenameFromResponse(response, new URL(response.url || url.href), mime)
  if (!response.body) {
    const blob = await response.blob()
    if (!MEDIA_MIME.test(blob.type) && !MEDIA_EXTENSIONS.has(extension)) throw new Error('O endereço não retornou um arquivo de mídia compatível.')
    if (blob.size > 500 * 1024 * 1024) throw new Error('O arquivo ultrapassa o limite de 500 MB da versão web.')
    onProgress(1)
    return new File([blob], name, { type: blob.type || mime || 'application/octet-stream', lastModified: Date.now() })
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      received += value.length
      if (received > 500 * 1024 * 1024) {
        await reader.cancel()
        throw new Error('O arquivo ultrapassa o limite de 500 MB da versão web.')
      }
      chunks.push(value)
      onProgress(length > 0 ? Math.min(0.99, received / length) : null)
    }
  } finally {
    reader.releaseLock()
  }
  if (!received) throw new Error('O servidor retornou um arquivo vazio.')
  onProgress(1)
  return new File(chunks, name, { type: mime || 'application/octet-stream', lastModified: Date.now() })
}
