import { NextResponse } from "next/server"

import {
  joinApiEndpoint,
  readProviderSettings,
  type ServerProviderSettings,
} from "@/lib/server-api-settings"
import type { StoryboardImageRequest, VisualGenerationProvider } from "@/lib/types"
import { describeUpstreamError, upstreamFetch } from "@/lib/upstream-fetch"
import {
  implementedRemoteVisualProviders,
  isImplementedRemoteVisualProvider,
} from "@/lib/visual-providers"

type VisualGeneratePayload = {
  provider: VisualGenerationProvider
  prompt: string
  aspectRatio: StoryboardImageRequest["aspectRatio"]
  stylePreset?: string
  title?: string
}

function extractImageUrl(payload: unknown) {
  const data = payload as {
    data?: Array<{ url?: string; b64_json?: string }>
    image_url?: string
    url?: string
    images?: Array<{ url?: string; b64_json?: string }>
  }
  const direct = data.data?.[0] ?? data.images?.[0]
  if (direct?.url) {
    return direct.url
  }
  if (direct?.b64_json) {
    return `data:image/png;base64,${direct.b64_json}`
  }
  return data.image_url ?? data.url
}

async function generateWithImageStream(
  payload: VisualGeneratePayload,
  clientSettings: ServerProviderSettings
) {
  const apiKey = clientSettings.apiKey || process.env.JIMENG_API_KEY
  const baseUrl = clientSettings.baseUrl || process.env.JIMENG_BASE_URL
  const model = clientSettings.model || process.env.JIMENG_MODEL
  const apiPath = clientSettings.apiPath || "/images/generations"

  if (!apiKey || !baseUrl || !model) {
    return NextResponse.json(
      {
        error: "图像流 API 需要 API Key、Base URL 和模型名称。",
      },
      { status: 400 }
    )
  }

  const endpoint = joinApiEndpoint(baseUrl, apiPath, "/images/generations")
  let response: Response
  try {
    response = await upstreamFetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: `${payload.prompt}\n\n画幅比例：${payload.aspectRatio}。`,
        response_format: "url",
        size: "2K",
        output_format: "png",
        extra_body: {
          watermark: false,
        },
      }),
    })
  } catch (error) {
    throw new Error(describeUpstreamError(error, endpoint))
  }

  const text = await response.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { raw: text }
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "图像流生成失败。",
        status: response.status,
        details: parsed,
      },
      { status: response.status }
    )
  }

  const imageUrl = extractImageUrl(parsed)
  if (!imageUrl) {
    return NextResponse.json(
      {
        error: "图像流响应中没有可用的图片 URL。",
        details: parsed,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    imageUrl,
    provider: payload.provider,
    model,
    raw: parsed,
  })
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VisualGeneratePayload
    if (!payload.prompt || !payload.provider || !payload.aspectRatio) {
      return NextResponse.json({ error: "prompt, provider, and aspectRatio are required." }, { status: 400 })
    }

    if (isImplementedRemoteVisualProvider(payload.provider)) {
      return generateWithImageStream(payload, readProviderSettings(request, "image"))
    }

    return NextResponse.json(
      {
        error:
          payload.provider === "mock"
            ? "Provider mock is a browser-only SVG preview and cannot be called through the visual API."
            : `Provider ${payload.provider} is not implemented. Supported server providers: ${implementedRemoteVisualProviders.join(", ")}.`,
      },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown visual generation error.",
      },
      { status: 500 }
    )
  }
}
