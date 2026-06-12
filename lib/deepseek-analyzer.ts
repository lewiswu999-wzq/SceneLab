import { analyzeText } from "@/lib/mock-analyzer"
import {
  joinApiEndpoint,
  type ServerProviderSettings,
} from "@/lib/server-api-settings"
import type {
  Character,
  Relationship,
  RhythmAdvice,
  SceneAnalysis,
  SceneSlice,
  ShotSuggestion,
  TextInput,
} from "@/lib/types"

const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash"

const systemPrompt = `你是 SceneLab 的影视文本分析引擎。
只输出合法 JSON，不要 Markdown，不要解释。
输出必须符合这个 TypeScript 结构：
{
  "meta": {"textType": string, "analysisDepth": string, "style": string, "generatedAt": string},
  "overview": {"summary": string, "theme": string, "coreConflict": string, "emotionalArc": string, "visualKeywords": string[]},
  "scenes": [{"id": string, "title": string, "location": string, "timeOfDay": string, "characters": string[], "summary": string, "emotionValue": number, "rhythmValue": number, "keyLine": string}],
  "characters": [{"id": string, "name": string, "role": string, "goal": string, "currentEmotion": string, "note": string}],
  "relationships": [{"from": string, "to": string, "label": string, "tension": number}],
  "rhythm": [{"sceneId": string, "rhythmType": "slow" | "medium" | "fast" | "explosive", "editingSuggestion": string, "reason": string}],
  "shotSuggestions": [{"sceneId": string, "shotSize": string, "cameraAngle": string, "cameraMovement": string, "lighting": string, "colorTone": string, "soundDesign": string, "aiVideoPrompt": string}]
}
要求：
- 至少 4 个 scenes，至少 2 个 characters，至少 2 个 relationships。
- emotionValue、rhythmValue、tension 必须是 0-100。
- 每个 scene 都必须有 rhythm 和 shotSuggestions。
- 根据文本类型调整分析语气，根据风格调整镜头、光影、声音建议。
- 所有内容使用中文。`

function clampPercent(value: unknown, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    return fallback
  }
  return Math.max(0, Math.min(100, Math.round(numberValue)))
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function stringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const nextValue = value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim())
  )
  return nextValue.length ? nextValue : fallback
}

function rhythmType(value: unknown, fallback: RhythmAdvice["rhythmType"]) {
  return value === "slow" || value === "medium" || value === "fast" || value === "explosive"
    ? value
    : fallback
}

function normalizeAnalysis(raw: unknown, input: TextInput, provider: string, model: string) {
  const fallback = analyzeText(input)
  const data = raw && typeof raw === "object" ? (raw as Partial<SceneAnalysis>) : {}
  const scenesSource = Array.isArray(data.scenes) && data.scenes.length >= 4 ? data.scenes : fallback.scenes
  const charactersSource =
    Array.isArray(data.characters) && data.characters.length >= 2 ? data.characters : fallback.characters
  const relationshipsSource =
    Array.isArray(data.relationships) && data.relationships.length >= 2
      ? data.relationships
      : fallback.relationships

  const scenes = scenesSource.map((scene, index): SceneSlice => {
    const fallbackScene = fallback.scenes[index] ?? fallback.scenes[index % fallback.scenes.length]
    const source = scene as Partial<SceneSlice>

    return {
      id: stringValue(source.id, fallbackScene.id),
      title: stringValue(source.title, fallbackScene.title),
      location: stringValue(source.location, fallbackScene.location),
      timeOfDay: stringValue(source.timeOfDay, fallbackScene.timeOfDay),
      characters: stringArray(source.characters, fallbackScene.characters),
      summary: stringValue(source.summary, fallbackScene.summary),
      emotionValue: clampPercent(source.emotionValue, fallbackScene.emotionValue),
      rhythmValue: clampPercent(source.rhythmValue, fallbackScene.rhythmValue),
      keyLine: stringValue(source.keyLine, fallbackScene.keyLine),
    }
  })

  const characters = charactersSource.map((character, index): Character => {
    const fallbackCharacter =
      fallback.characters[index] ?? fallback.characters[index % fallback.characters.length]
    const source = character as Partial<Character>

    return {
      id: stringValue(source.id, fallbackCharacter.id),
      name: stringValue(source.name, fallbackCharacter.name),
      role: stringValue(source.role, fallbackCharacter.role),
      goal: stringValue(source.goal, fallbackCharacter.goal),
      currentEmotion: stringValue(source.currentEmotion, fallbackCharacter.currentEmotion),
      note: stringValue(source.note, fallbackCharacter.note),
    }
  })

  const relationships = relationshipsSource.map((relationship, index): Relationship => {
    const fallbackRelationship =
      fallback.relationships[index] ?? fallback.relationships[index % fallback.relationships.length]
    const source = relationship as Partial<Relationship>

    return {
      from: stringValue(source.from, fallbackRelationship.from),
      to: stringValue(source.to, fallbackRelationship.to),
      label: stringValue(source.label, fallbackRelationship.label),
      tension: clampPercent(source.tension, fallbackRelationship.tension),
    }
  })

  const rhythm = scenes.map((scene, index): RhythmAdvice => {
    const source = Array.isArray(data.rhythm) ? (data.rhythm[index] as Partial<RhythmAdvice>) : {}
    const fallbackRhythm = fallback.rhythm[index] ?? fallback.rhythm[index % fallback.rhythm.length]

    return {
      sceneId: scene.id,
      rhythmType: rhythmType(source.rhythmType, fallbackRhythm.rhythmType),
      editingSuggestion: stringValue(source.editingSuggestion, fallbackRhythm.editingSuggestion),
      reason: stringValue(source.reason, fallbackRhythm.reason),
    }
  })

  const shotSuggestions = scenes.map((scene, index): ShotSuggestion => {
    const source = Array.isArray(data.shotSuggestions)
      ? (data.shotSuggestions[index] as Partial<ShotSuggestion>)
      : {}
    const fallbackShot =
      fallback.shotSuggestions[index] ?? fallback.shotSuggestions[index % fallback.shotSuggestions.length]

    return {
      sceneId: scene.id,
      shotSize: stringValue(source.shotSize, fallbackShot.shotSize),
      cameraAngle: stringValue(source.cameraAngle, fallbackShot.cameraAngle),
      cameraMovement: stringValue(source.cameraMovement, fallbackShot.cameraMovement),
      lighting: stringValue(source.lighting, fallbackShot.lighting),
      colorTone: stringValue(source.colorTone, fallbackShot.colorTone),
      soundDesign: stringValue(source.soundDesign, fallbackShot.soundDesign),
      aiVideoPrompt: stringValue(source.aiVideoPrompt, fallbackShot.aiVideoPrompt),
    }
  })

  return {
    meta: {
      textType: input.textType,
      analysisDepth: input.analysisDepth,
      style: input.style,
      generatedAt: new Date().toLocaleString("zh-CN"),
      provider,
      model,
    },
    overview: {
      summary: stringValue(data.overview?.summary, fallback.overview.summary),
      theme: stringValue(data.overview?.theme, fallback.overview.theme),
      coreConflict: stringValue(data.overview?.coreConflict, fallback.overview.coreConflict),
      emotionalArc: stringValue(data.overview?.emotionalArc, fallback.overview.emotionalArc),
      visualKeywords: stringArray(data.overview?.visualKeywords, fallback.overview.visualKeywords),
    },
    scenes,
    characters,
    relationships,
    rhythm,
    shotSuggestions,
  } satisfies SceneAnalysis
}

function parseJSONContent(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error("文字流没有返回 JSON 内容。")
    }
    return JSON.parse(match[0])
  }
}

export async function analyzeTextWithDeepSeek(
  input: TextInput,
  clientSettings: ServerProviderSettings = {}
) {
  const apiKey = clientSettings.apiKey || process.env.DEEPSEEK_API_KEY
  const baseUrl =
    clientSettings.baseUrl ||
    process.env.DEEPSEEK_BASE_URL ||
    "https://api.deepseek.com"
  const model =
    clientSettings.model ||
    process.env.DEEPSEEK_MODEL ||
    DEFAULT_DEEPSEEK_MODEL
  const apiPath = clientSettings.apiPath || "/chat/completions"

  if (!apiKey) {
    const analysis = analyzeText(input)
    return {
      analysis: {
        ...analysis,
        meta: {
          ...analysis.meta,
          provider: "mock",
          model: "local-mock",
          fallbackReason: "Missing text stream API key",
        },
      },
      source: "mock" as const,
      fallbackReason: "Missing text stream API key",
    }
  }

  try {
    const response = await fetch(
      joinApiEndpoint(baseUrl, apiPath, "/chat/completions"),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: JSON.stringify({
                task: "分析这段影视文本并返回 SceneAnalysis JSON",
                input,
              }),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.35,
          max_tokens: 5000,
          stream: false,
        }),
      }
    )
    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }
    if (!response.ok) {
      throw new Error(
        completion.error?.message ?? `Text stream returned HTTP ${response.status}.`
      )
    }
    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("Text stream response is empty.")
    }

    return {
      analysis: normalizeAnalysis(parseJSONContent(content), input, "text-api", model),
      source: "text-api" as const,
    }
  } catch (error) {
    const analysis = analyzeText(input)
    const fallbackReason = error instanceof Error ? error.message : "Text stream request failed."

    return {
      analysis: {
        ...analysis,
        meta: {
          ...analysis.meta,
          provider: "mock",
          model: "local-mock",
          fallbackReason,
        },
      },
      source: "mock" as const,
      fallbackReason,
    }
  }
}
