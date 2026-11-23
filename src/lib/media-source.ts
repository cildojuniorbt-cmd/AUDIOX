export type MediaSourceKind = 'direct-file' | 'hls' | 'dash' | 'youtube' | 'vimeo' | 'instagram' | 'tiktok' | 'facebook' | 'x' | 'other'

export type MediaSourceInfo = {
  kind: MediaSourceKind
  label: string
  status: 'supported-direct' | 'official-integration-required' | 'streaming-not-enabled' | 'unknown'
  detail: string
}

const DIRECT_EXTENSIONS = new Set([
  'mp3','wav','flac','m4a','aac','ogg','opus','mp4','mkv','mov','avi','webm','wmv','flv','mpeg','mpg','m4v','3gp','ts','mts','m2ts','vob','ogv','mxf','asf','dv','gif'
])

export function inspectMediaSource(rawUrl: string): MediaSourceInfo | null {
  if (!rawUrl.trim()) return null
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return { kind: 'other', label: 'Endereço inválido', status: 'unknown', detail: 'Confira se o link começa com https:// ou http://.' }
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return { kind: 'other', label: 'Endereço não permitido', status: 'unknown', detail: 'Use um endereço HTTP ou HTTPS público, sem credenciais embutidas.' }
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const path = url.pathname.toLowerCase()
  const extension = path.split('/').pop()?.split('.').pop() || ''

  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host.endsWith('youtube-nocookie.com')) {
    return { kind: 'youtube', label: 'YouTube', status: 'official-integration-required', detail: 'A integração oficial não fornece download geral de vídeos. Para conteúdo próprio, use a exportação do YouTube Studio e importe o arquivo.' }
  }
  if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
    return { kind: 'vimeo', label: 'Vimeo', status: 'official-integration-required', detail: 'Acesso depende das permissões de download do proprietário ou de uma integração/API autorizada.' }
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    return { kind: 'instagram', label: 'Instagram', status: 'official-integration-required', detail: 'Compatibilidade depende de mídia e permissões disponibilizadas pelas APIs oficiais para a conta autorizada.' }
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    return { kind: 'tiktok', label: 'TikTok', status: 'official-integration-required', detail: 'É necessário um fluxo oficial autorizado. Links de páginas não são arquivos de mídia diretos.' }
  }
  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
    return { kind: 'facebook', label: 'Facebook', status: 'official-integration-required', detail: 'É necessário acesso autorizado à mídia por integração oficial ou um link direto fornecido pelo proprietário.' }
  }
  if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
    return { kind: 'x', label: 'X', status: 'official-integration-required', detail: 'Links de postagem exigem integração e permissões da plataforma. Arquivos diretos continuam sujeitos ao acesso do servidor.' }
  }
  if (extension === 'm3u8') {
    return { kind: 'hls', label: 'Transmissão HLS', status: 'streaming-not-enabled', detail: 'Detectamos uma playlist HLS. A captura e montagem dos segmentos ainda não está habilitada nesta versão.' }
  }
  if (extension === 'mpd') {
    return { kind: 'dash', label: 'Transmissão MPEG-DASH', status: 'streaming-not-enabled', detail: 'Detectamos um manifesto DASH. A captura e montagem dos segmentos ainda não está habilitada nesta versão.' }
  }
  if (DIRECT_EXTENSIONS.has(extension)) {
    return { kind: 'direct-file', label: 'Possível arquivo direto', status: 'supported-direct', detail: 'O AUDIOX tentará acessar o arquivo. O servidor de origem ainda precisa permitir a leitura e o download.' }
  }
  return { kind: 'other', label: 'Site ou fonte não identificada', status: 'unknown', detail: 'O AUDIOX verificará o endereço. A compatibilidade depende de o site fornecer um arquivo direto ou uma integração autorizada.' }
}
