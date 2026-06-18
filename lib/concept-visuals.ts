import type {
  CharacterVisualProfile,
  ConceptPosterRequest,
  ConceptPosterResult,
  PosterType,
  SceneAnalysis,
  StoryboardImageResult,
  StoryboardReel,
  StoryboardTimeline,
} from "@/lib/types"
import { getApiRequestHeaders } from "@/lib/api-settings"

function dataPoster(title: string, subtitle: string, seed: string, aspectRatio: string) {
  const hash = Array.from(seed).reduce((value, char) => value + char.charCodeAt(0), 0)
  const hue = hash % 360
  const [width, height] = aspectRatio === "9:16" ? [900, 1600] : aspectRatio === "1:1" ? [1200, 1200] : [1600, 900]
  const safeTitle = title.replace(/[<>&]/g, "")
  const safeSubtitle = subtitle.replace(/[<>&]/g, "")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="poster" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="hsl(${hue} 48% 12%)"/>
        <stop offset="50%" stop-color="hsl(${(hue + 38) % 360} 62% 32%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 96) % 360} 70% 68%)"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#poster)"/>
    <rect x="${width * 0.08}" y="${height * 0.08}" width="${width * 0.84}" height="${height * 0.84}" fill="none" stroke="#ffffff" stroke-opacity="0.42" stroke-width="4"/>
    <circle cx="${width * 0.5}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.18}" fill="#ffffff" fill-opacity="0.16"/>
    <text x="${width * 0.1}" y="${height * 0.76}" fill="#fff" font-family="Arial, sans-serif" font-size="${Math.max(44, width * 0.052)}" font-weight="800">${safeTitle}</text>
    <text x="${width * 0.1}" y="${height * 0.84}" fill="#e4e4e7" font-family="Arial, sans-serif" font-size="${Math.max(22, width * 0.02)}">${safeSubtitle}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function requestProviderPoster(request: ConceptPosterRequest) {
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
      stylePreset: request.visualStyle,
      title: request.title,
    }),
  })
  const text = await response.text()
  let payload: { imageUrl?: string; error?: string } = {}
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
        `Poster provider returned HTTP ${response.status} without an image URL.`
    )
  }
  return payload.imageUrl
}

export function buildConceptPosterPrompt(
  analysis: SceneAnalysis,
  posterType: PosterType,
  characterProfiles: CharacterVisualProfile[],
  selectedSceneIds: string[],
  visualStyle = analysis.meta.style
) {
  const selectedScenes = analysis.scenes.filter((scene) => selectedSceneIds.includes(scene.id))
  const scenes = selectedScenes.length > 0 ? selectedScenes : analysis.scenes.slice(0, 3)
  const sceneBrief = scenes.map((scene) => `${scene.title}: ${scene.summary}`).join("\n")
  const characterBrief = characterProfiles
    .slice(0, 4)
    .map((profile) => `${profile.name}: ${profile.consistencyPrompt}`)
    .join("\n")

  return [
    `概念海报类型：${posterType}`,
    `片名 / 项目：${analysis.meta.textType}`,
    `一句话：${analysis.overview.summary}`,
    `主题：${analysis.overview.theme}`,
    `核心冲突：${analysis.overview.coreConflict}`,
    `全局视觉风格：${visualStyle}`,
    `关键场景：\n${sceneBrief}`,
    `角色一致性：\n${characterBrief || "无角色档案时保持人物身份清晰"}`,
    `视觉关键词：${analysis.overview.visualKeywords.join("、")}`,
    "要求：电影概念海报，强构图，清晰视觉中心，保留叙事悬念，避免商业模板感。",
  ].join("\n")
}

export async function generateConceptPoster(
  request: ConceptPosterRequest
): Promise<ConceptPosterResult> {
  const imageUrl =
    request.provider === "mock"
      ? dataPoster(request.title, request.posterType, `${request.prompt}-${request.visualStyle}`, request.aspectRatio)
      : await requestProviderPoster(request)

  return {
    id: `concept-poster-${crypto.randomUUID()}`,
    requestId: request.id,
    posterType: request.posterType,
    imageUrl,
    prompt: request.prompt,
    provider: request.provider,
    status: "completed",
    isSelected: false,
    createdAt: new Date().toISOString(),
  }
}

export function buildStoryboardReel(
  timeline: StoryboardTimeline,
  storyboardImages: StoryboardImageResult[]
): StoryboardReel {
  const imageIds = timeline.shots
    .map((shot) => {
      const linked = shot.linkedStoryboardImageId
        ? storyboardImages.find((image) => image.id === shot.linkedStoryboardImageId)
        : undefined
      const byScene = storyboardImages.find((image) => image.sceneId === shot.sceneId && (image.isSelected || image.isLocked))
      return linked?.id ?? byScene?.id ?? storyboardImages.find((image) => image.sceneId === shot.sceneId)?.id
    })
    .filter((id): id is string => Boolean(id))

  return {
    id: `storyboard-reel-${crypto.randomUUID()}`,
    title: `${timeline.title} 视觉预演`,
    shots: timeline.shots,
    imageIds,
    totalDurationSeconds: timeline.totalDurationSeconds,
    captionsEnabled: true,
    autoPlayIntervalMs: 1800,
    createdAt: new Date().toISOString(),
  }
}
