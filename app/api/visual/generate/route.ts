import { NextResponse } from "next/server"

import { readProviderSettings, type ServerProviderSettings } from "@/lib/server-api-settings"
import type { StoryboardImageRequest, VisualGenerationProvider } from "@/lib/types"
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

function getEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "")
  if (trimmed.endsWith("/images/generations")) {
    return trimmed
  }
  return `${trimmed}/images/generations`
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

async function generateWithJimeng(
  payload: VisualGeneratePayload,
  clientSettings: ServerProviderSettings
) {
  const apiKey = clientSettings.apiKey || process.env.JIMENG_API_KEY
  const baseUrl = clientSettings.baseUrl || process.env.JIMENG_BASE_URL
  const model = clientSettings.model || process.env.JIMENG_MODEL

  if (!apiKey || !baseUrl || !model) {
    return NextResponse.json(
      {
        error: "JIMENG_API_KEY, JIMENG_BASE_URL, and JIMENG_MODEL are required.",
      },
      { status: 400 }
    )
  }

  const response = await fetch(getEndpoint(baseUrl), {
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
        error: "Jimeng image generation failed.",
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
        error: "Jimeng response did not include an image URL.",
        details: parsed,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    imageUrl,
    provider: "jimeng",
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
      return generateWithJimeng(payload, readProviderSettings(request, "jimeng"))
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
