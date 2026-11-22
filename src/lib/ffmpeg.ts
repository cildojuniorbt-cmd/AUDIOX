import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null
let logSink: ((message: string) => void) | undefined
let progressSink: ((value: number) => void) | undefined
let listenersAttached = false
let conversionQueue: Promise<unknown> = Promise.resolve()

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
const AUDIO_FORMATS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'aiff', 'alac', 'ape', 'ac3', 'dts', 'amr', 'mp2'])
const VIDEO_FORMATS = new Set(['mp4', 'mkv', 'mov', 'avi', 'webm', 'wmv', 'flv', 'mpeg', 'mpg', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'vob', 'ogv', 'mxf', 'asf', 'dv', 'gif'])
const MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', m4a: 'audio/mp4',
  aac: 'audio/aac', ogg: 'audio/ogg', opus: 'audio/ogg', aiff: 'audio/aiff',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  mkv: 'video/x-matroska', gif: 'image/gif'
}

export async function inspectEncoders(onLog?: (message: string) => void): Promise<string[]> {
  const ffmpeg = await getFFmpeg(onLog, undefined)
  const lines: string[] = []
  const previousSink = logSink
  logSink = message => { lines.push(message); onLog?.(message) }
  try {
    await ffmpeg.exec(['-hide_banner', '-encoders'])
    return lines.filter(line => /^\s*[VAS\.][A-Z\.]{5}\s+/.test(line)).map(line => line.trim())
  } finally {
    logSink = previousSink
  }
}

export async function getFFmpeg(onLog?: (message: string) => void, onProgress?: (value: number) => void) {
  if (!instance) instance = new FFmpeg()
  const ffmpeg = instance
  logSink = onLog
  progressSink = onProgress
  if (!listenersAttached) {
    ffmpeg.on('log', ({ message }) => logSink?.(message))
    ffmpeg.on('progress', ({ progress }) => progressSink?.(Math.max(0, Math.min(1, progress))))
    listenersAttached = true
  }
  if (!ffmpeg.loaded) {
    if (!loading) {
      loading = (async () => {
        const coreURL = `${CORE_BASE}/ffmpeg-core.js`
        const wasmURL = `${CORE_BASE}/ffmpeg-core.wasm`
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

async function runConversion(
  file: File,
  format: string,
  options: { bitrate: string; onProgress: (value: number) => void; onLog: (message: string) => void }
) {
  if (!AUDIO_FORMATS.has(format) && !VIDEO_FORMATS.has(format)) {
    throw new Error('Formato de saída não reconhecido.')
  }
  if (file.size === 0) throw new Error('O arquivo está vazio.')
  if (file.size > 500 * 1024 * 1024) {
    throw new Error('Este arquivo ultrapassa o limite de 500 MB da versão web. Use um arquivo menor ou aguarde a versão desktop otimizada.')
  }

  const ffmpeg = await getFFmpeg(options.onLog, options.onProgress)
  const safeBase = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 70) || 'audiox_media'
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin'
  const token = crypto.randomUUID().replace(/-/g, '')
  const inputName = `input_${token}.${extension}`
  const outputName = `${safeBase}_AUDIOX_${token.slice(0, 8)}.${format}`

  try {
    options.onProgress(0)
    options.onLog('Carregando arquivo na memória do processador...')
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    const args = ['-y', '-i', inputName]
    if (AUDIO_FORMATS.has(format)) {
      args.push('-vn')
      if (format === 'mp3') args.push('-b:a', `${options.bitrate}k`)
    }
    if (['mp4', 'mov', 'm4v'].includes(format)) args.push('-movflags', '+faststart')
    args.push(outputName)

    options.onLog(`Convertendo para ${format.toUpperCase()}...`)
    const code = await ffmpeg.exec(args)
    if (code !== 0) {
      throw new Error('O FFmpeg não concluiu esta conversão. Este formato pode exigir um codec que não está disponível nesta versão.')
    }

    const data = await ffmpeg.readFile(outputName)
    if (!(data instanceof Uint8Array) || data.length === 0) {
      throw new Error('A conversão terminou sem gerar um arquivo válido.')
    }
    options.onProgress(1)
    return {
      blob: new Blob([data as unknown as BlobPart], { type: MIME_TYPES[format] || 'application/octet-stream' }),
      filename: outputName
    }
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => undefined)
    await ffmpeg.deleteFile(outputName).catch(() => undefined)
  }
}

export function convertMedia(
  file: File,
  format: string,
  options: { bitrate: string; onProgress: (value: number) => void; onLog: (message: string) => void }
) {
  // FFmpeg.wasm uses a shared virtual filesystem; serialize jobs to avoid file and state collisions.
  const task = conversionQueue.then(() => runConversion(file, format, options))
  conversionQueue = task.catch(() => undefined)
  return task
}
