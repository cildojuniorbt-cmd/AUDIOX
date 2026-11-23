export type StemsPlatform = 'ios' | 'android' | 'desktop' | 'other'
export type StemsCapabilities = {
  platform: StemsPlatform
  browser: string
  wasm: boolean
  webgpu: boolean
  crossOriginIsolated: boolean
  wasmThreads: boolean
  hardwareConcurrency: number
  deviceMemoryGb: number | null
  storageQuotaBytes: number | null
  storageUsageBytes: number | null
  persistentStorage: boolean
  standalone: boolean
  recommendedProfile: 'economy' | 'balanced' | 'quality'
  notes: string[]
}

function getPlatform(ua: string): StemsPlatform {
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Windows|Macintosh|Mac OS|Linux/i.test(ua)) return 'desktop'
  return 'other'
}

function getBrowser(ua: string): string {
  if (/CriOS/i.test(ua)) return 'Chrome iOS'
  if (/FxiOS/i.test(ua)) return 'Firefox iOS'
  if (/EdgiOS/i.test(ua)) return 'Edge iOS'
  if (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua)) return 'Safari'
  if (/EdgA|Edg/i.test(ua)) return 'Edge'
  if (/Chrome|CriOS/i.test(ua)) return 'Chrome'
  if (/Firefox|FxiOS/i.test(ua)) return 'Firefox'
  return 'Navegador'
}

/** Detects browser capabilities only. This does not claim that a model can run until its operators are tested. */
export async function detectStemsCapabilities(): Promise<StemsCapabilities> {
  const ua = navigator.userAgent
  const platform = getPlatform(ua)
  const browser = getBrowser(ua)
  const nav = navigator as Navigator & {
    deviceMemory?: number
    gpu?: { requestAdapter: () => Promise<unknown> }
  }
  const notes: string[] = []
  const wasm = typeof WebAssembly === 'object'
  const crossOriginIsolated = self.crossOriginIsolated === true
  const wasmThreads = crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined'
  let webgpu = false
  try {
    webgpu = !!(nav.gpu && await nav.gpu.requestAdapter())
  } catch {
    webgpu = false
  }
  let storageQuotaBytes: number | null = null
  let storageUsageBytes: number | null = null
  try {
    const estimate = await navigator.storage?.estimate()
    storageQuotaBytes = estimate?.quota ?? null
    storageUsageBytes = estimate?.usage ?? null
  } catch {
    // Storage estimates are optional and can be unavailable in private browsing.
  }
  let persistentStorage = false
  try {
    persistentStorage = navigator.storage?.persisted ? await navigator.storage.persisted() : false
  } catch {
    persistentStorage = false
  }
  const deviceMemoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null
  const standalone = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  if (!wasm) notes.push('Este navegador não oferece WebAssembly.')
  if (platform === 'ios' && !webgpu) notes.push('No iPhone, o motor de navegador usará CPU/WASM; WebGPU não está disponível neste runtime.')
  if (platform === 'ios') notes.push('Mantenha o AUDIOX aberto em primeiro plano durante a separação.')
  if (!crossOriginIsolated) notes.push('Execução WASM multithread não está habilitada nesta origem.')
  if (!persistentStorage) notes.push('O navegador ainda não confirmou armazenamento persistente; ele pode limpar o cache.')
  if (deviceMemoryGb === null) notes.push('O navegador não informa a memória aproximada do dispositivo.')

  const lowMemory = deviceMemoryGb !== null && deviceMemoryGb <= 4
  const recommendedProfile = lowMemory || platform === 'ios' || !webgpu
    ? 'economy'
    : deviceMemoryGb !== null && deviceMemoryGb >= 8 && webgpu
      ? 'quality'
      : 'balanced'

  return {
    platform,
    browser,
    wasm,
    webgpu,
    crossOriginIsolated,
    wasmThreads,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemoryGb,
    storageQuotaBytes,
    storageUsageBytes,
    persistentStorage,
    standalone,
    recommendedProfile,
    notes
  }
}
