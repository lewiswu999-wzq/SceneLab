import { isProxyableVisualImageUrl } from "@/lib/visual-image-url"
import { upstreamFetch } from "@/lib/upstream-fetch"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const imageUrl = requestUrl.searchParams.get("url") ?? ""

  if (!isProxyableVisualImageUrl(imageUrl)) {
    return Response.json({ error: "不允许代理该图片地址。" }, { status: 400 })
  }

  try {
    const response = await upstreamFetch(imageUrl, {
      headers: { Accept: "image/*" },
    })
    const contentType = response.headers.get("content-type") ?? ""

    if (!response.ok || !contentType.startsWith("image/")) {
      return Response.json(
        { error: "远程图片加载失败。" },
        { status: response.ok ? 502 : response.status }
      )
    }

    const headers = new Headers({
      "Cache-Control": "private, max-age=86400",
      "Content-Type": contentType,
    })
    if (requestUrl.searchParams.get("download") === "1") {
      headers.set("Content-Disposition", 'attachment; filename="scenelab-image.png"')
    }

    return new Response(response.body, {
      status: 200,
      headers,
    })
  } catch {
    return Response.json({ error: "远程图片加载失败。" }, { status: 502 })
  }
}
