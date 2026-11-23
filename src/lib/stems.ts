export type StemFormat = 'wav' | 'mp3'
export type StemEngineHealth = {
  version: string
  backend?: string
  model?: string
  device?: string
  preset?: string
  model_id?: string
  max_track_seconds?: number
  parts?: string[]
}
export type SeparatedStem = { name: string; file: File }

const ENGINE_URL = 'http://127.0.0.1:8420'

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, mode: 'cors', cache: 'no-store' })
  } catch {
    throw new Error('Não foi possível acessar o motor local de Stems. Abra o Stemd no computador e ative o servidor local na porta 8420.')
  }
}

export async function checkStemEngine(): Promise<StemEngineHealth> {
  const response = await request(`${ENGINE_URL}/v2/health`, { signal: AbortSignal.timeout(3500) })
  if (!response.ok) throw new Error(`O motor local respondeu HTTP ${response.status}.`)
  const health = await response.json() as StemEngineHealth
  if (!health.version || !health.model_id) throw new Error('O serviço respondeu, mas não parece ser uma versão compatível do motor de Stems.')
  return health
}

export async function separateWithLocalEngine(
  pcm: Uint8Array,
  sourceName: string,
  format: StemFormat,
  onProgress: (progress: number, stage: string) => void,
  signal?: AbortSignal
): Promise<SeparatedStem[]> {
  const health = await checkStemEngine()
  if (health.max_track_seconds && pcm.byteLength / (44100 * 2 * 2) > health.max_track_seconds) {
    throw new Error(`Esta instalação aceita faixas de até ${Math.floor(health.max_track_seconds / 60)} minutos.`)
  }
  const params = new URLSearchParams({
    sample_rate: '44100',
    channels: '2',
    format: 's16le',
    output_format: format,
    parts: 'drums,bass,other,vocals'
  })
  const submitted = await request(`${ENGINE_URL}/v2/jobs?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: pcm,
    signal
  })
  if (!submitted.ok && submitted.status !== 202) {
    const message = await submitted.text().catch(() => '')
    throw new Error(message || `O motor recusou o áudio (HTTP ${submitted.status}).`)
  }
  const initial = await submitted.json() as { id?: string; progress?: { fraction?: number; stage?: string }; result?: { stems?: Array<{name:string}> } }
  if (!initial.id && !initial.result?.stems?.length) throw new Error('O motor não retornou um identificador de processamento válido.')
  let job = initial
  if (initial.id && !initial.result?.stems?.length) {
    const started = Date.now()
    while (Date.now() - started < 60 * 60 * 1000) {
      if (signal?.aborted) {
        await request(`${ENGINE_URL}/v2/jobs/${initial.id}`, { method: 'DELETE' }).catch(() => undefined)
        throw new DOMException('Separação cancelada.', 'AbortError')
      }
      await new Promise(resolve => setTimeout(resolve, 900))
      const poll = await request(`${ENGINE_URL}/v2/jobs/${initial.id}`, { signal })
      if (!poll.ok) throw new Error(`Falha ao consultar a separação (HTTP ${poll.status}).`)
      job = await poll.json() as typeof job
      const stage = job.progress?.stage || 'separating'
      onProgress(Math.max(0, Math.min(1, job.progress?.fraction ?? 0)), stage)
      if (stage === 'failed') throw new Error('O motor de IA não conseguiu separar esta faixa.')
      if (stage === 'cancelled') throw new Error('A separação foi cancelada pelo motor.')
      if (job.result?.stems?.length) break
    }
  }
  const stems = job.result?.stems || []
  if (!stems.length || !initial.id) throw new Error('O motor terminou sem disponibilizar os stems esperados.')
  const safeName = sourceName.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 64) || 'AUDIOX'
  const outputs: SeparatedStem[] = []
  try {
    for (const stem of stems) {
      const response = await request(`${ENGINE_URL}/v2/jobs/${initial.id}/stems/${encodeURIComponent(stem.name)}`, { signal })
      if (!response.ok) throw new Error(`Não foi possível baixar o stem ${stem.name} (HTTP ${response.status}).`)
      const blob = await response.blob()
      if (!blob.size) throw new Error(`O stem ${stem.name} veio vazio.`)
      const mime = format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
      outputs.push({ name: stem.name, file: new File([blob], `${safeName} - ${stem.name}.${format}`, { type: mime, lastModified: Date.now() }) })
    }
    return outputs
  } finally {
    await request(`${ENGINE_URL}/v2/jobs/${initial.id}`, { method: 'DELETE' }).catch(() => undefined)
  }
}
