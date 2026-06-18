type UpstreamProxyRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

export class UpstreamApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "UpstreamApiError"
  }
}

function requestHeaders(headers: HeadersInit | undefined) {
  return Object.fromEntries(new Headers(headers).entries())
}

export async function upstreamFetch(url: string, init: RequestInit = {}) {
  const proxyUrl = process.env.SCENELAB_UPSTREAM_PROXY_URL
  const proxyToken = process.env.SCENELAB_UPSTREAM_PROXY_TOKEN

  if (!proxyUrl || !proxyToken) {
    return fetch(url, { ...init, cache: "no-store" })
  }

  if (init.body && typeof init.body !== "string") {
    throw new Error("桌面 API 转发仅支持文本请求体。")
  }

  const payload: UpstreamProxyRequest = {
    url,
    method: init.method || "GET",
    headers: requestHeaders(init.headers),
    body: typeof init.body === "string" ? init.body : undefined,
  }

  return fetch(proxyUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${proxyToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
}

export function describeUpstreamError(error: unknown, targetUrl: string) {
  const target = new URL(targetUrl)
  const cause =
    error instanceof Error && error.cause && typeof error.cause === "object"
      ? (error.cause as { code?: string; message?: string })
      : undefined
  const detail = cause?.code || cause?.message || (error instanceof Error ? error.message : "")

  return `无法连接 ${target.host}${detail ? `：${detail}` : ""}`
}
