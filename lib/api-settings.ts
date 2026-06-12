"use client"

export type ApiStream = "text" | "image" | "video"

export type ApiStreamSettings = {
  apiKey: string
  baseUrl: string
  model: string
  apiPath: string
}

export type ApiIdentity = {
  provider: string
  model: string
  apiStyle: string
  confidence: "high" | "medium" | "low"
  note: string
}

export type ApiSettings = {
  text: ApiStreamSettings
  image: ApiStreamSettings
  video: ApiStreamSettings
  identities?: Partial<Record<ApiStream, ApiIdentity>>
}

type LegacyApiSettings = {
  deepseek?: Partial<ApiStreamSettings>
  jimeng?: Partial<ApiStreamSettings>
}

declare global {
  interface Window {
    scenelab?: {
      apiSettings: {
        load: () => Promise<ApiSettings | LegacyApiSettings | null>
        save: (settings: ApiSettings) => Promise<void>
        clear: () => Promise<void>
        storage: "windows-encrypted"
      }
    }
  }
}

const STORAGE_KEY = "scenelab.api-settings.v2"
const LEGACY_STORAGE_KEY = "scenelab.api-settings.v1"

export const defaultApiSettings: ApiSettings = {
  text: {
    apiKey: "",
    baseUrl: "",
    model: "",
    apiPath: "/chat/completions",
  },
  image: {
    apiKey: "",
    baseUrl: "",
    model: "",
    apiPath: "/images/generations",
  },
  video: {
    apiKey: "",
    baseUrl: "",
    model: "",
    apiPath: "/videos/generations",
  },
}

function normalizeStream(
  value: Partial<ApiStreamSettings> | undefined,
  fallback: ApiStreamSettings
): ApiStreamSettings {
  return {
    apiKey: value?.apiKey?.trim() ?? fallback.apiKey,
    baseUrl: value?.baseUrl?.trim() ?? fallback.baseUrl,
    model: value?.model?.trim() ?? fallback.model,
    apiPath: value?.apiPath?.trim() || fallback.apiPath,
  }
}

export function normalizeApiSettings(
  value: Partial<ApiSettings> | LegacyApiSettings | null | undefined
): ApiSettings {
  const current = value as Partial<ApiSettings> | undefined
  const legacy = value as LegacyApiSettings | undefined

  return {
    text: normalizeStream(current?.text ?? legacy?.deepseek, defaultApiSettings.text),
    image: normalizeStream(current?.image ?? legacy?.jimeng, defaultApiSettings.image),
    video: normalizeStream(current?.video, defaultApiSettings.video),
    identities: current?.identities,
  }
}

export function getApiSettingsStorageLabel() {
  return typeof window !== "undefined" && window.scenelab
    ? "Windows 加密存储"
    : "浏览器本地存储"
}

export async function loadApiSettings(): Promise<ApiSettings> {
  if (typeof window === "undefined") {
    return defaultApiSettings
  }

  if (window.scenelab) {
    return normalizeApiSettings(await window.scenelab.apiSettings.load())
  }

  try {
    const stored =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return normalizeApiSettings(
      stored ? (JSON.parse(stored) as Partial<ApiSettings> | LegacyApiSettings) : null
    )
  } catch {
    return defaultApiSettings
  }
}

export async function saveApiSettings(settings: ApiSettings) {
  const normalized = normalizeApiSettings(settings)
  if (window.scenelab) {
    await window.scenelab.apiSettings.save(normalized)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export async function clearApiSettings() {
  if (window.scenelab) {
    await window.scenelab.apiSettings.clear()
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export async function getApiRequestHeaders(): Promise<Record<string, string>> {
  const settings = await loadApiSettings()
  const headers: Record<string, string> = {}

  for (const stream of ["text", "image", "video"] as const) {
    const value = settings[stream]
    if (!value.apiKey) {
      continue
    }
    headers[`x-scenelab-${stream}-key`] = value.apiKey
    headers[`x-scenelab-${stream}-base-url`] = value.baseUrl
    headers[`x-scenelab-${stream}-model`] = value.model
    headers[`x-scenelab-${stream}-api-path`] = value.apiPath
  }

  return headers
}
