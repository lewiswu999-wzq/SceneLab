import { NextResponse } from "next/server"
import { z } from "zod"

import { ANALYSIS_DEPTHS, STORY_STYLES, TEXT_TYPES } from "@/lib/constants"
import { analyzeTextWithDeepSeek } from "@/lib/deepseek-analyzer"

export const runtime = "nodejs"

const inputSchema = z.object({
  sourceText: z.string().min(20),
  textType: z.enum(TEXT_TYPES),
  analysisDepth: z.enum(ANALYSIS_DEPTHS),
  style: z.enum(STORY_STYLES),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = inputSchema.parse(body)
    const result = await analyzeTextWithDeepSeek(input)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid analyze request.",
      },
      { status: 400 }
    )
  }
}
