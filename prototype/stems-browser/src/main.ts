import './style.css'

type StemOutput = { name: string; channels: Float32Array[] }
type WorkerResponse =
  | { type: 'status'; message: string }
  | { type: 'progress'; chunk: number; totalChunks: number; message: string }
  | { type: 'done'; sampleRate: number; stems: StemOutput[] }
  | { type: 'error'; message: string }

const fileInput = document.querySelector<HTMLInputElement>('#audio-file')!
const fileInfo = document.querySelector<HTMLElement>('#file-info')!
const runButton = document.querySelector<HTMLButtonElement>('#run-button')!
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel-button')!
const statusText = document.querySelector<HTMLElement>('#status')!
const engineState = document.querySelector<HTMLElement>('#engine-state')!
const progressBar = document.querySelector<HTMLElement>('#progress-bar')!
const results = document.querySelector<HTMLElement>('#results')!
const stemList = document.querySelector<HTMLElement>('#stem-list')!

let selectedFile: File | null = null
let activeWorker: Worker | null = null

const MAX_DURATION_SECONDS = 8
const MAX_FILE_BYTES = 20 * 1024 * 1024

function setStatus(message: string) {
  statusText.textContent = message
}

function setBusy(busy: boolean) {
  runButton.disabled = busy || !selectedFile
  cancelButton.hidden = !busy
  fileInput.disabled = busy
  engineState.textContent = busy ? 'PROCESSANDO' : selectedFile ? 'PRONTO PARA TESTE' : 'AGUARDANDO'
  engineState.classList.toggle('active', busy)
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
  const channelCount = channels.length
  const frameCount = channels[0]?.length ?? 0
  if (!channelCount || !frameCount || channels.some(channel => channel.length !== frameCount)) {
    throw new Error('O motor retornou canais vazios ou com tamanhos diferentes.')
  }

  const bytesPerSample = 2
  const dataSize = frameCount * channelCount * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
  }

  write(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true)
  view.setUint16(32, channelCount * bytesPerSample, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < channelCount; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += bytesPerSample
    }
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

function renderStems(stems: StemOutput[], sampleRate: number) {
  stemList.replaceChildren()
  results.hidden = false

  for (const stem of stems) {
    const card = document.createElement('article')
    card.className = 'stem-card'

    const title = document.createElement('strong')
    title.textContent = stem.name.charAt(0).toUpperCase() + stem.name.slice(1)

    const audio = document.createElement('audio')
    audio.controls = true
    audio.preload = 'none'

    const wav = encodeWav(stem.channels, sampleRate)
    const url = URL.createObjectURL(wav)
    audio.src = url

    const download = document.createElement('a')
    download.className = 'download-link'
    download.href = url
    download.download = `AUDIOX - ${stem.name}.wav`
    download.textContent = 'Baixar WAV'

    card.append(title, audio, download)
    stemList.append(card)
  }
}

async function inspectFile(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Para este teste, escolha um arquivo de até 20 MB.')
  }

  const metadataAudio = new Audio()
  const objectUrl = URL.createObjectURL(file)
  metadataAudio.preload = 'metadata'
  metadataAudio.src = objectUrl

  try {
    await new Promise<void>((resolve, reject) => {
      metadataAudio.onloadedmetadata = () => resolve()
      metadataAudio.onerror = () => reject(new Error('O navegador não conseguiu ler os metadados deste áudio.'))
    })

    if (!Number.isFinite(metadataAudio.duration) || metadataAudio.duration <= 0) {
      throw new Error('Não foi possível identificar a duração do arquivo.')
    }
    if (metadataAudio.duration > MAX_DURATION_SECONDS) {
      throw new Error(`O protótipo está limitado a ${MAX_DURATION_SECONDS} segundos. Sua faixa tem ${metadataAudio.duration.toFixed(1)} segundos.`)
    }
    return metadataAudio.duration
  } finally {
    metadataAudio.removeAttribute('src')
    metadataAudio.load()
    URL.revokeObjectURL(objectUrl)
  }
}

fileInput.addEventListener('change', async () => {
  selectedFile = null
  runButton.disabled = true
  results.hidden = true
  const file = fileInput.files?.[0]
  if (!file) {
    fileInfo.textContent = 'Nenhum arquivo selecionado.'
    setStatus('Selecione um áudio de até 8 segundos para começar.')
    return
  }

  try {
    const duration = await inspectFile(file)
    selectedFile = file
    fileInfo.textContent = `${file.name} · ${duration.toFixed(1)} s · ${formatBytes(file.size)}`
    runButton.disabled = false
    setStatus('Arquivo validado. O processamento será feito localmente.')
  } catch (error) {
    fileInput.value = ''
    fileInfo.textContent = 'Arquivo não aceito para este teste.'
    setStatus(error instanceof Error ? error.message : 'Não foi possível validar o arquivo.')
  }
})

runButton.addEventListener('click', async () => {
  if (!selectedFile) return

  setBusy(true)
  progressBar.style.width = '0%'
  results.hidden = true
  setStatus('Decodificando o arquivo no dispositivo…')

  try {
    const context = new AudioContext()
    const bytes = await selectedFile.arrayBuffer()
    const decoded = await context.decodeAudioData(bytes)
    await context.close()

    const channels = Array.from({ length: Math.min(2, decoded.numberOfChannels) }, (_, index) =>
      new Float32Array(decoded.getChannelData(index))
    )

    if (!channels.length || !channels[0].length) throw new Error('O arquivo não contém áudio válido.')

    activeWorker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    activeWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data

      if (message.type === 'status') {
        setStatus(message.message)
        return
      }
      if (message.type === 'progress') {
        const fraction = message.totalChunks > 0 ? message.chunk / message.totalChunks : 0
        progressBar.style.width = `${Math.max(0, Math.min(100, fraction * 100))}%`
        setStatus(message.message)
        return
      }
      if (message.type === 'done') {
        progressBar.style.width = '100%'
        renderStems(message.stems, message.sampleRate)
        setStatus('Separação concluída. Confira os quatro arquivos abaixo.')
        activeWorker?.terminate()
        activeWorker = null
        setBusy(false)
        return
      }
      if (message.type === 'error') {
        setStatus(message.message)
        activeWorker?.terminate()
        activeWorker = null
        setBusy(false)
      }
    }

    activeWorker.onerror = (event) => {
      setStatus(`Falha no Worker: ${event.message}`)
      activeWorker?.terminate()
      activeWorker = null
      setBusy(false)
    }

    const transfer = channels.map(channel => channel.buffer as ArrayBuffer)
    activeWorker.postMessage({
      type: 'run',
      channels,
      sampleRate: decoded.sampleRate
    }, transfer)
    setStatus('Preparando o motor ONNX. No primeiro uso, o modelo SCNet será baixado e armazenado em cache.')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Falha ao preparar o áudio.')
    activeWorker?.terminate()
    activeWorker = null
    setBusy(false)
  }
})

cancelButton.addEventListener('click', () => {
  activeWorker?.terminate()
  activeWorker = null
  progressBar.style.width = '0%'
  setStatus('Teste cancelado. O Worker foi encerrado.')
  setBusy(false)
})

window.addEventListener('beforeunload', () => {
  activeWorker?.terminate()
})
