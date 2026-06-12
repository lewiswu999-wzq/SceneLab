export type ServerProviderSettings = {
  apiKey?: string
  baseUrl?: string
  model?: string
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

export function readProviderSettings(
  request: Request,
  provider: "deepseek" | "jimeng"
): ServerProviderSettings {
  return {
    apiKey: cleanHeader(request, `x-scenelab-${provider}-key`, 4096),
    baseUrl: validBaseUrl(
      cleanHeader(request, `x-scenelab-${provider}-base-url`, 2048)
    ),
    model: cleanHeader(request, `x-scenelab-${provider}-model`, 512),
  }
}
