import { NextResponse } from "next/server"
import { z } from "zod"

import { ANALYSIS_DEPTHS, STORY_STYLES, TEXT_TYPES } from "@/lib/constants"
import { analyzeTextWithDeepSeek } from "@/lib/deepseek-analyzer"
import { readProviderSettings } from "@/lib/server-api-settings"
import { UpstreamApiError } from "@/lib/upstream-fetch"

export const runtime = "nodejs"

const inputSchema = z.object({
  sourceText: z.string().min(20),
  textType: z.enum(TEXT_TYPES),
  analysisDepth: z.enum(ANALYSIS_DEPTHS),
  style: z.enum(STORY_STYLES),
  requestedSceneCount: z.number().int().min(3).max(40).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = inputSchema.parse(body)
    const result = await analyzeTextWithDeepSeek(
      input,
      readProviderSettings(request, "text")
    )

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid analyze request.",
      },
      { status: error instanceof UpstreamApiError ? 502 : 400 }
    )
  }
}
