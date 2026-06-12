"use client"

export type ApiProviderSettings = {
  apiKey: string
  baseUrl: string
  model: string
}

export type ApiSettings = {
  deepseek: ApiProviderSettings
  jimeng: ApiProviderSettings
}

declare global {
  interface Window {
    scenelab?: {
      apiSettings: {
        load: () => Promise<ApiSettings | null>
        save: (settings: ApiSettings) => Promise<void>
        clear: () => Promise<void>
        storage: "windows-encrypted"
      }
    }
  }
}

const STORAGE_KEY = "scenelab.api-settings.v1"

export const defaultApiSettings: ApiSettings = {
  deepseek: {
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
  },
  jimeng: {
    apiKey: "",
    baseUrl: "",
    model: "",
  },
}

function normalizeProvider(
  value: Partial<ApiProviderSettings> | undefined,
  fallback: ApiProviderSettings
): ApiProviderSettings {
  return {
    apiKey: value?.apiKey?.trim() ?? fallback.apiKey,
    baseUrl: value?.baseUrl?.trim() || fallback.baseUrl,
    model: value?.model?.trim() || fallback.model,
  }
}

export function normalizeApiSettings(value: Partial<ApiSettings> | null | undefined): ApiSettings {
  return {
    deepseek: normalizeProvider(value?.deepseek, defaultApiSettings.deepseek),
    jimeng: normalizeProvider(value?.jimeng, defaultApiSettings.jimeng),
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
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return normalizeApiSettings(stored ? (JSON.parse(stored) as Partial<ApiSettings>) : null)
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
}

export async function clearApiSettings() {
  if (window.scenelab) {
    await window.scenelab.apiSettings.clear()
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function getApiRequestHeaders(): Promise<Record<string, string>> {
  const settings = await loadApiSettings()
  const headers: Record<string, string> = {}

  if (settings.deepseek.apiKey) {
    headers["x-scenelab-deepseek-key"] = settings.deepseek.apiKey
    headers["x-scenelab-deepseek-base-url"] = settings.deepseek.baseUrl
    headers["x-scenelab-deepseek-model"] = settings.deepseek.model
  }

  if (settings.jimeng.apiKey) {
    headers["x-scenelab-jimeng-key"] = settings.jimeng.apiKey
    headers["x-scenelab-jimeng-base-url"] = settings.jimeng.baseUrl
    headers["x-scenelab-jimeng-model"] = settings.jimeng.model
  }

  return headers
}
