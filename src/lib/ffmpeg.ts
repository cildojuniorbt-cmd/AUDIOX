import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

export async function getFFmpeg(onLog?: (message: string) => void, onProgress?: (value: number) => void) {
  if (!instance) instance = new FFmpeg()
  const ffmpeg = instance
  if (onLog) ffmpeg.on('log', ({ message }) => onLog(message))
  if (onProgress) ffmpeg.on('progress', ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))))
  if (!ffmpeg.loaded) {
    if (!loading) {
      loading = (async () => {
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm')
        ])
        await ffmpeg.load({ coreURL, wasmURL })
        return ffmpeg
      })().catch(error => {
        loading = null
        throw error
      })
    }
    await loading
  }
  return ffmpeg
}

export async function convertMedia(
  file: File,
  format: string,
  options: { bitrate: string; onProgress: (value: number) => void; onLog: (message: string) => void }
) {
  const ffmpeg = await getFFmpeg(options.onLog, options.onProgress)
  const safeBase = file.name.replace(/\\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 70) || 'audiox_media'
  const inputName = `input_${Date.now()}.${file.name.split('.').pop()?.toLowerCase() || 'bin'}`
  const outputName = `${safeBase}_AUDIOX.${format}`
  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    const audioFormats = new Set(['mp3','wav','flac','m4a','aac','ogg','opus','wma','aiff','alac','ape','ac3','dts','amr','mp2'])
    const args = ['-y', '-i', inputName]
    if (audioFormats.has(format)) {
      args.push('-vn')
      if (format === 'mp3') args.push('-b:a', `${options.bitrate}k`)
    }
    if (['mp4','mov','m4v'].includes(format)) args.push('-movflags', '+faststart')
    args.push(outputName)
    const code = await ffmpeg.exec(args)
    if (code !== 0) throw new Error('O FFmpeg não conseguiu concluir esta conversão. Verifique se o codec de origem e o formato de saída são compatíveis.')
    const data = await ffmpeg.readFile(outputName)
    const mime = audioFormats.has(format)
      ? ({ mp3:'audio/mpeg', wav:'audio/wav', flac:'audio/flac', m4a:'audio/mp4', aac:'audio/aac', ogg:'audio/ogg', opus:'audio/ogg', aiff:'audio/aiff' } as Record<string,string>)[format] || 'application/octet-stream'
      : ({ mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime', mkv:'video/x-matroska', gif:'image/gif' } as Record<string,string>)[format] || 'application/octet-stream'
    return { blob: new Blob([data as unknown as BlobPart], { type: mime }), filename: outputName }
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => undefined)
    await ffmpeg.deleteFile(outputName).catch(() => undefined)
  }
}
