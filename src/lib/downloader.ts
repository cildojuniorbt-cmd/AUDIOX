const MEDIA_EXTENSIONS = new Set([
  'mp3','wav','flac','m4a','aac','ogg','opus','wma','aiff','alac','ape','ac3','dts','amr','mp2',
  'mp4','mkv','mov','avi','webm','wmv','flv','mpeg','mpg','m4v','3gp','ts','mts','m2ts','vob','ogv','mxf','asf','dv','gif'
])

const MEDIA_MIME = /^(audio|video)\//

function filenameFromResponse(response: Response, url: URL, mime: string) {
  const disposition = response.headers.get('content-disposition') || ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  let name = encoded ? decodeURIComponent(encoded) : plain
  if (!name) name = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')
  if (!name || !name.includes('.')) {
    const extension = mime.includes('mpeg') ? 'mp3' : mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : mime.includes('wav') ? 'wav' : mime.startsWith('audio/') ? 'audio' : 'video'
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
  const extension = url.pathname.split('.').pop()?.toLowerCase() || ''
  if (!MEDIA_EXTENSIONS.has(extension)) {
    throw new Error('Este endereço não parece apontar diretamente para um arquivo de áudio ou vídeo. Links de páginas de redes sociais e plataformas precisam de integração oficial.')
  }

  let response: Response
  try {
    response = await fetch(url.href, { method: 'GET', credentials: 'omit', redirect: 'follow' })
  } catch {
    throw new Error('O site bloqueou a leitura direta (CORS) ou não está acessível. Tente um link direto de arquivo com acesso permitido.')
  }
  if (!response.ok) throw new Error(`O servidor respondeu HTTP ${response.status}. Verifique se o link está público e ainda válido.`)
  const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!MEDIA_MIME.test(mime) && !MEDIA_EXTENSIONS.has(extension)) {
    throw new Error('O servidor não identificou o conteúdo como áudio ou vídeo.')
  }
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
