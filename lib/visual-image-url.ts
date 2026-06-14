const PROXIED_IMAGE_HOST_SUFFIXES = [
  "volces.com",
  "volcengineapi.com",
  "aliyuncs.com",
  "byteimg.com",
  "blob.core.windows.net",
  "oaistatic.com",
]

export function isProxyableVisualImageUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") {
      return false
    }
    const hostname = url.hostname.toLowerCase()
    return PROXIED_IMAGE_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    )
  } catch {
    return false
  }
}

export function getVisualImageUrl(value: string, download = false) {
  if (!isProxyableVisualImageUrl(value)) {
    return value
  }
  const params = new URLSearchParams({ url: value })
  if (download) {
    params.set("download", "1")
  }
  return `/api/visual/image?${params.toString()}`
}
