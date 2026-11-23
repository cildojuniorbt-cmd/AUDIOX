import separate from '@audio/neural-separate'

type RunMessage = {
  type: 'run'
  channels: Float32Array[]
  sampleRate: number
}

type WorkerMessage = RunMessage

type WorkerScope = {
  postMessage: (message: unknown, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null
}

const scope = self as unknown as WorkerScope

scope.onmessage = async (event) => {
  if (event.data.type !== 'run') return

  try {
    scope.postMessage({ type: 'status', message: 'Iniciando ONNX Runtime Web (WASM/CPU)…' })
    scope.postMessage({ type: 'status', message: 'Carregando SCNet. No primeiro uso, cerca de 13 MB de pesos serão baixados; o áudio continua apenas neste dispositivo.' })

    const result = await separate(
      { channelData: event.data.channels, sampleRate: event.data.sampleRate },
      {
        model: 'scnet',
        device: 'wasm',
        // WASM is the compatibility baseline for iOS Safari and Android Chrome.
        // WebGPU will only be enabled after a separate device/model compatibility test.
        progress: ({ chunk, totalChunks }) => {
          scope.postMessage({
            type: 'progress',
            chunk,
            totalChunks,
            message: totalChunks > 1
              ? `Processando segmento ${chunk} de ${totalChunks}…`
              : 'Executando inferência local…'
          })
        }
      }
    )

    const stems = Object.entries(result.stems).map(([name, channels]) => ({
      name,
      channels
    }))
    const transfer = stems.flatMap(stem => stem.channels.map(channel => channel.buffer as ArrayBuffer))

    scope.postMessage({
      type: 'done',
      sampleRate: result.sampleRate,
      stems
    }, transfer)
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Falha desconhecida durante a separação.'
    })
  }
}
