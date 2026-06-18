import type { ApiStream } from "@/lib/api-settings"

export type ServerProviderSettings = {
  apiKey?: string
  baseUrl?: string
  model?: string
  apiPath?: string
}

function cleanHeader(request: Request, name: string, maxLength: number) {
  return request.headers.get(name)?.trim().slice(0, maxLength) || undefined
}

function validBaseUrl(value: string | undefined) {
  if (!value) {
    return undefined
  }
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? value : undefined
  } catch {
    return undefined
  }
}

function validApiPath(value: string | undefined) {
  if (!value) {
    return undefined
  }
  return value.startsWith("/") && !value.startsWith("//") ? value : undefined
}

export function readProviderSettings(
  request: Request,
  stream: ApiStream
): ServerProviderSettings {
  const prefix = `x-scenelab-${stream}`
  return {
    apiKey: cleanHeader(request, `${prefix}-key`, 4096),
    baseUrl: validBaseUrl(cleanHeader(request, `${prefix}-base-url`, 2048)),
    model: cleanHeader(request, `${prefix}-model`, 512),
    apiPath: validApiPath(cleanHeader(request, `${prefix}-api-path`, 512)),
  }
}

export function joinApiEndpoint(
  baseUrl: string,
  apiPath: string,
  conventionalSuffix: string
) {
  const trimmedBase = baseUrl.replace(/\/+$/, "")
  const normalizedPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`

  if (trimmedBase.endsWith(normalizedPath)) {
    return trimmedBase
  }
  if (!apiPath && trimmedBase.endsWith(conventionalSuffix)) {
    return trimmedBase
  }
  return `${trimmedBase}${normalizedPath}`
}
