import type {
  Character,
  SceneSlice,
  ShotSuggestion,
  StoryboardComparisonSet,
  StoryboardImageRequest,
  StoryboardImageResult,
  StoryboardVariantStyle,
  VisualGenerationProvider,
} from "@/lib/types"
import { getApiRequestHeaders } from "@/lib/api-settings"
import {
  buildSceneStoryboardCraftPrompt,
  buildStoryboardAnnotation,
} from "@/lib/scenelab-storyboard-craft"
import { buildPromptExpertFusion } from "@/lib/prompt-expert"
import { getVisualProviderLabel } from "@/lib/visual-providers"

const videoProviders: VisualGenerationProvider[] = ["jimeng", "kling", "runway", "pika", "image2"]
const imageProviders: VisualGenerationProvider[] = ["midjourney", "sdxl", "dalle", "comfyui", "mock"]

const variantStyles: Array<{
  style: StoryboardVariantStyle
  label: string
  reason: string
  palette: [string, string, string]
}> = [
  {
    style: "cinematic-realism",
    label: "写实电影版",
    reason: "适合保留真实表演质感和电影级光影层次。",
    palette: ["#13231f", "#4f8a82", "#d6c7aa"],
  },
  {
    style: "cold-suspense",
    label: "冷色悬疑版",
    reason: "适合突出不安、未知和心理压力。",
    palette: ["#07111f", "#24517a", "#91d2ff"],
  },
  {
    style: "warm-realism",
    label: "暖色现实主义版",
    reason: "适合家庭、回忆、人物关系修复类表达。",
    palette: ["#2a1710", "#a8643f", "#f2c993"],
  },
  {
    style: "neon-noir",
    label: "霓虹黑色电影版",
    reason: "适合城市夜景、欲望、迷失和强风格影像。",
    palette: ["#10081f", "#d23883", "#2de2d1"],
  },
  {
    style: "documentary",
    label: "纪录片感版本",
    reason: "适合强化现场感、观察感和真实事件质地。",
    palette: ["#171717", "#6b705c", "#e5dccb"],
  },
  {
    style: "dreamlike",
    label: "梦境诗意版",
    reason: "适合表现潜意识、记忆和非现实情绪。",
    palette: ["#1d1233", "#8b6fd7", "#f0c9ff"],
  },
  {
    style: "minimal-artfilm",
    label: "极简艺术电影版",
    reason: "适合留白、孤独、压抑和作者表达。",
    palette: ["#0b0b0d", "#4b5563", "#f4f4f5"],
  },
]

const appearanceChangeSignals = [
  "多年后",
  "数年后",
  "几年后",
  "十年后",
  "多年以前",
  "回忆",
  "童年",
  "少年",
  "老年",
  "衰老",
  "变老",
  "伤",
  "受伤",
  "血",
  "疤",
  "瘀青",
  "毁容",
  "病容",
  "伪装",
  "乔装",
  "面具",
  "假发",
  "化妆",
  "换装",
  "制服",
  "婚纱",
  "丧服",
  "监狱服",
  "time jump",
  "years later",
  "injured",
  "scar",
  "disguise",
  "mask",
  "costume change",
]

function stableHash(value: string) {
  return Array.from(value).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7)
}

function dataSvg(title: string, subtitle: string, seed: string, aspectRatio: string, palette?: [string, string, string]) {
  const hash = stableHash(`${seed}-${aspectRatio}`)
  const colors = palette ?? [
    `hsl(${hash % 360} 56% 16%)`,
    `hsl(${(hash + 76) % 360} 62% 38%)`,
    `hsl(${(hash + 142) % 360} 75% 72%)`,
  ]
  const [width, height] = aspectRatio === "9:16"
    ? [900, 1600]
    : aspectRatio === "1:1"
      ? [1200, 1200]
      : aspectRatio === "4:3"
        ? [1200, 900]
        : aspectRatio === "21:9"
          ? [1680, 720]
          : [1600, 900]
  const safeTitle = title.replace(/[<>&]/g, "")
  const safeSubtitle = subtitle.replace(/[<>&]/g, "")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="55%" stop-color="${colors[1]}"/>
      <stop offset="100%" stop-color="${colors[2]}"/>
    </linearGradient>
    <radialGradient id="v" cx="35%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#v)"/>
  <g opacity="0.36">
    <rect x="${width * 0.08}" y="${height * 0.16}" width="${width * 0.84}" height="${height * 0.58}" rx="18" fill="none" stroke="#fff" stroke-width="3"/>
    <line x1="${width * 0.08}" y1="${height * 0.36}" x2="${width * 0.92}" y2="${height * 0.36}" stroke="#fff" stroke-width="2"/>
    <line x1="${width * 0.33}" y1="${height * 0.16}" x2="${width * 0.33}" y2="${height * 0.74}" stroke="#fff" stroke-width="2"/>
    <line x1="${width * 0.66}" y1="${height * 0.16}" x2="${width * 0.66}" y2="${height * 0.74}" stroke="#fff" stroke-width="2"/>
  </g>
  <text x="${width * 0.08}" y="${height * 0.84}" fill="#fff" font-family="Arial, sans-serif" font-size="${Math.max(34, width * 0.036)}" font-weight="700">${safeTitle}</text>
  <text x="${width * 0.08}" y="${height * 0.9}" fill="#e4e4e7" font-family="Arial, sans-serif" font-size="${Math.max(22, width * 0.018)}">${safeSubtitle}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function requestProviderImage(request: StoryboardImageRequest) {
  const response = await fetch("/api/visual/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getApiRequestHeaders()),
    },
    body: JSON.stringify({
      provider: request.provider,
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      stylePreset: request.stylePreset,
      title: request.sceneId,
    }),
    signal: AbortSignal.timeout(100000),
  })
  const text = await response.text()
  let payload: { imageUrl?: string; error?: string; details?: unknown } = {}
  if (text.trim()) {
    try {
      payload = JSON.parse(text) as typeof payload
    } catch {
      payload = { error: text }
    }
  }
  if (!response.ok || !payload.imageUrl) {
    throw new Error(
      payload.error ??
        `Image provider returned HTTP ${response.status} without an image URL.`
    )
  }
  return payload.imageUrl
}

function findAppearanceChangeEvidence(scene: SceneSlice) {
  const text = `${scene.title} ${scene.location} ${scene.timeOfDay} ${scene.summary} ${scene.keyLine}`.toLowerCase()
  return appearanceChangeSignals.filter((signal) => text.includes(signal.toLowerCase()))
}

export function buildCharacterAppearanceContinuityRule(scene: SceneSlice) {
  const evidence = findAppearanceChangeEvidence(scene)
  const exceptionLine = evidence.length
    ? `本场景检测到可能允许外形变化的剧本线索：${evidence.join("、")}。只允许根据这些线索做局部、合理、可解释的变化。`
    : "本场景没有检测到长时间跨度、受伤、伪装、衰老、明确换装等线索，因此人物外形必须保持连续。"

  return [
    "人物形象连续性规则：默认把每个角色当作同一位演员在连续影视项目中出演。",
    "除非剧本明确写出长时间推移、年龄阶段变化、面部/身体受伤、疤痕、病容、伪装、面具、假发、特殊制服、仪式服装或其他明确造型变化，否则不要改变角色的脸型、五官比例、年龄感、发型轮廓、体型、肤色、核心气质和主要服装轮廓。",
    "如果场景需要换衣服，也必须保持同一角色的可识别身份、色彩倾向、身体语言和表演气质；不能把角色画成另一个人。",
    "负面约束：no face drift, no identity change, no random hairstyle change, no age shift, no different actor, no inconsistent body type, no unexplained costume redesign.",
    exceptionLine,
  ].join("\n")
}

export function getStoryboardVariantStyleMeta(style: StoryboardVariantStyle) {
  return variantStyles.find((item) => item.style === style) ?? variantStyles[0]
}

export function buildStoryboardImagePrompt(
  scene: SceneSlice,
  shotSuggestion: ShotSuggestion,
  characters: Character[],
  globalStyle: string,
  provider: VisualGenerationProvider
) {
  const sceneCharacters = characters
    .filter((character) => scene.characters.includes(character.name) || scene.characters.includes(character.id))
    .map((character) => `${character.name}（${character.role}，${character.currentEmotion}）`)
    .join("、") || scene.characters.join("、") || "无明确人物"
  const continuityRule = buildCharacterAppearanceContinuityRule(scene)
  const storyboardCraft = buildSceneStoryboardCraftPrompt(scene, shotSuggestion)
  const annotation = buildStoryboardAnnotation(scene, shotSuggestion)
  const base = [
    `场景：${scene.title}，${scene.location}，${scene.timeOfDay}`,
    `摘要：${scene.summary}`,
    `人物：${sceneCharacters}`,
    continuityRule,
    storyboardCraft,
    `镜头：${shotSuggestion.shotSize}，${shotSuggestion.cameraAngle}，${shotSuggestion.cameraMovement}`,
    `光影：${shotSuggestion.lighting}`,
    `色调：${shotSuggestion.colorTone}`,
    `情绪/节奏：${scene.emotionValue}/100，${scene.rhythmValue}/100`,
    `声音氛围：${shotSuggestion.soundDesign}`,
    `全局视觉风格：${globalStyle}`,
    `分镜标注：\n${annotation}`,
  ]

  if (videoProviders.includes(provider)) {
    return [
      `[${provider}] 视频镜头生成提示`,
      ...base,
      `运动与调度：从${shotSuggestion.cameraAngle}建立空间，${shotSuggestion.cameraMovement}推进情绪，保持电影感构图和角色形象连续性。`,
      "避免跳切、畸变、角色脸部漂移、无理由换脸、无理由换发型、过度卡通化。",
    ].join("\n")
  }

  if (imageProviders.includes(provider)) {
    return [
      `[${provider}] 分镜图 / 概念图生成提示`,
      ...base,
      "构图：清晰前中后景，主体位置明确，适合影视分镜板，保留镜头运动暗示。",
      "画面质感：高细节电影概念图，克制的色彩层次，非营销海报。",
    ].join("\n")
  }

  return base.join("\n")
}

export async function generateStoryboardImage(
  request: StoryboardImageRequest
): Promise<StoryboardImageResult> {
  const imageUrl =
    request.provider === "mock"
      ? dataSvg(
          `Storyboard ${request.sceneId}`,
          `${request.provider} / ${request.stylePreset} / ${request.aspectRatio}`,
          `${request.sceneId}-${request.stylePreset}-${request.prompt}`,
          request.aspectRatio
        )
      : await requestProviderImage(request)

  return {
    id: `storyboard-image-${crypto.randomUUID()}`,
    requestId: request.id,
    sceneId: request.sceneId,
    shotId: request.shotId,
    provider: request.provider,
    imageUrl,
    prompt: request.prompt,
    status: "completed",
    createdAt: new Date().toISOString(),
    isSelected: false,
    isLocked: false,
    generationNote:
      request.provider === "mock"
        ? "本地 SVG 预览：未调用外部模型，也未消耗 API 额度。"
        : `由 ${getVisualProviderLabel(request.provider)} 通过服务端视觉 API 生成。`,
  }
}

export async function generateStoryboardVariants(
  scene: SceneSlice,
  shotSuggestion: ShotSuggestion,
  characters: Character[],
  provider: VisualGenerationProvider,
  count = 3
): Promise<StoryboardComparisonSet> {
  const picked = variantStyles.slice(0, Math.max(1, Math.min(count, variantStyles.length)))
  const variants = await Promise.all(
    picked.map(async (styleMeta) => {
      const promptExpert = buildPromptExpertFusion({
        scene,
        shot: shotSuggestion,
        characters,
        style: styleMeta.style,
        aspectRatio: "16:9",
      })
      const prompt = promptExpert.finalPrompt
      const request: StoryboardImageRequest = {
        id: `variant-request-${crypto.randomUUID()}`,
        sceneId: scene.id,
        shotId: shotSuggestion.sceneId,
        provider,
        prompt,
        aspectRatio: "16:9",
        stylePreset: styleMeta.style,
        characterConsistencyIds: scene.characters,
        lockedReferenceImageIds: [],
        createdAt: new Date().toISOString(),
      }
      const image = request.provider === "mock"
        ? {
            imageUrl: dataSvg(styleMeta.label, scene.title, `${scene.id}-${styleMeta.style}`, "16:9", styleMeta.palette),
            note: `Mock visual variant: ${styleMeta.reason}`,
          }
        : {
            imageUrl: await requestProviderImage(request),
            note: `由 ${getVisualProviderLabel(request.provider)} 生成：${styleMeta.reason}`,
          }
      return {
        id: `variant-${crypto.randomUUID()}`,
        sceneId: scene.id,
        label: styleMeta.label,
        style: styleMeta.style,
        prompt,
        promptExpert,
        reason: styleMeta.reason,
        isSelected: false,
        image: {
          id: `variant-image-${crypto.randomUUID()}`,
          requestId: request.id,
          sceneId: scene.id,
          shotId: shotSuggestion.sceneId,
          provider,
          imageUrl: image.imageUrl,
          prompt,
          status: "completed" as const,
          createdAt: new Date().toISOString(),
          isSelected: false,
          isLocked: false,
          generationNote: image.note,
        },
      }
    })
  )

  return {
    id: `comparison-${crypto.randomUUID()}`,
    sceneId: scene.id,
    variants,
    createdAt: new Date().toISOString(),
  }
}
