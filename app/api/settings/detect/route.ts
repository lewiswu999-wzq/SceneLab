import { NextResponse } from "next/server"
import { z } from "zod"

import type { ApiIdentity, ApiStream } from "@/lib/api-settings"
import {
  joinApiEndpoint,
  readProviderSettings,
} from "@/lib/server-api-settings"
import { describeUpstreamError, upstreamFetch } from "@/lib/upstream-fetch"

export const runtime = "nodejs"

const streamSchema = z.object({
  baseUrl: z.string().max(2048),
  model: z.string().max(512),
  apiPath: z.string().max(512),
})

const requestSchema = z.object({
  text: streamSchema,
  image: streamSchema,
  video: streamSchema,
})

function parseJsonContent(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error("文字流没有返回可解析的识别结果。")
    }
    return JSON.parse(match[0])
  }
}

function normalizeIdentity(value: unknown): ApiIdentity {
  const identity = value as Partial<ApiIdentity> | undefined
  const confidence =
    identity?.confidence === "high" ||
    identity?.confidence === "medium" ||
    identity?.confidence === "low"
      ? identity.confidence
      : "low"

  return {
    provider: String(identity?.provider || "未知供应商").slice(0, 120),
    model: String(identity?.model || "未知模型").slice(0, 160),
    apiStyle: String(identity?.apiStyle || "未知接口风格").slice(0, 160),
    confidence,
    note: String(identity?.note || "仅根据接口元数据判断。").slice(0, 400),
  }
}

export async function POST(request: Request) {
  let endpoint = ""
  try {
    const metadata = requestSchema.parse(await request.json())
    const textSettings = readProviderSettings(request, "text")

    if (!textSettings.apiKey || !textSettings.baseUrl || !textSettings.model) {
      return NextResponse.json(
        { error: "请先完整配置文字流 API，再让它识别三个通道。" },
        { status: 400 }
      )
    }

    endpoint = joinApiEndpoint(
      textSettings.baseUrl,
      textSettings.apiPath || "/chat/completions",
      "/chat/completions"
    )
    const response = await upstreamFetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${textSettings.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: textSettings.model,
          temperature: 0,
          stream: false,
          messages: [
            {
              role: "system",
              content:
                "你是 API 识别器。根据 Base URL、模型名和接口路径判断文字、图像、视频三个通道最可能属于哪家供应商、哪款模型、哪种兼容接口。只输出 JSON。无法确定时必须明确写未知，不得编造。",
            },
            {
              role: "user",
              content: JSON.stringify({
                task: "识别三个 API 通道",
                security_note: "API Key 未提供，不需要也不允许索要。",
                channels: metadata,
                output_schema: {
                  text: {
                    provider: "string",
                    model: "string",
                    apiStyle: "string",
                    confidence: "high | medium | low",
                    note: "string",
                  },
                  image: "same shape",
                  video: "same shape",
                },
              }),
            },
          ],
        }),
      }
    )

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }
    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `文字流识别请求返回 HTTP ${response.status}。`
      )
    }

    const content = payload.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("文字流没有返回识别内容。")
    }
    const parsed = parseJsonContent(content) as Partial<Record<ApiStream, unknown>>

    return NextResponse.json({
      identities: {
        text: normalizeIdentity(parsed.text),
        image: normalizeIdentity(parsed.image),
        video: normalizeIdentity(parsed.video),
      } satisfies Record<ApiStream, ApiIdentity>,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          endpoint && error instanceof TypeError && error.message === "fetch failed"
            ? describeUpstreamError(error, endpoint)
            : error instanceof Error
              ? error.message
              : "API 识别失败。",
      },
      { status: 400 }
    )
  }
}
