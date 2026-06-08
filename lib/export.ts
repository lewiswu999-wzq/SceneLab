import type { SceneAnalysis, VisualAgentState } from "@/lib/types"

export function exportAnalysisToJSON(analysis: SceneAnalysis) {
  return JSON.stringify(analysis, null, 2)
}

export function exportAnalysisToMarkdown(analysis: SceneAnalysis) {
  const sceneLines = analysis.scenes
    .map(
      (scene, index) =>
        `${index + 1}. **${scene.title}**｜${scene.location}｜${scene.timeOfDay}\n` +
        `   - 人物：${scene.characters.join("、")}\n` +
        `   - 摘要：${scene.summary}\n` +
        `   - 情绪值：${scene.emotionValue}，节奏值：${scene.rhythmValue}\n` +
        `   - 关键句：${scene.keyLine}`
    )
    .join("\n\n")

  const emotionLines = analysis.scenes
    .map((scene) => `- ${scene.title}: ${scene.emotionValue}`)
    .join("\n")

  const rhythmLines = analysis.rhythm
    .map((item) => {
      const scene = analysis.scenes.find((entry) => entry.id === item.sceneId)
      return `- ${scene?.title ?? item.sceneId}｜${item.rhythmType}：${item.editingSuggestion}。${item.reason}`
    })
    .join("\n")

  const relationshipLines = analysis.relationships
    .map((item) => `- ${item.from} -> ${item.to}：${item.label}，张力 ${item.tension}/100`)
    .join("\n")

  const shotLines = analysis.shotSuggestions
    .map((item) => {
      const scene = analysis.scenes.find((entry) => entry.id === item.sceneId)
      return (
        `### ${scene?.title ?? item.sceneId}\n` +
        `- 景别：${item.shotSize}\n` +
        `- 机位：${item.cameraAngle}\n` +
        `- 运动：${item.cameraMovement}\n` +
        `- 光影：${item.lighting}\n` +
        `- 色调：${item.colorTone}\n` +
        `- 声音：${item.soundDesign}\n` +
        `- AI 视频 prompt：${item.aiVideoPrompt}`
      )
    })
    .join("\n\n")

  return `# SceneLab｜剧本显微镜

生成时间：${analysis.meta.generatedAt}
文本类型：${analysis.meta.textType}
分析深度：${analysis.meta.analysisDepth}
风格：${analysis.meta.style}
来源：${analysis.meta.provider ?? "mock"} / ${analysis.meta.model ?? "local"}
${analysis.meta.fallbackReason ? `Fallback：${analysis.meta.fallbackReason}` : ""}

## 故事摘要
${analysis.overview.summary}

## 主题
${analysis.overview.theme}

## 核心冲突
${analysis.overview.coreConflict}

## 场景切片
${sceneLines}

## 情绪曲线数据
${emotionLines}

## 节奏建议
${rhythmLines}

## 人物关系
${relationshipLines}

## 镜头建议与 AI 视频 Prompt
${shotLines}
`
}

export async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "true")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

export function exportVisualStoryboardToJSON(state: VisualAgentState) {
  return JSON.stringify(state, null, 2)
}

export function exportPromptPackFromVisualState(state: VisualAgentState) {
  const storyboardPrompts = state.storyboardVisualSets
    .flatMap((set) => set.images)
    .map((image) => `## ${image.sceneId} / ${image.provider}\n${image.prompt}`)
  const variantPrompts = state.storyboardComparisonSets
    .flatMap((set) => set.variants)
    .map((variant) => `## ${variant.sceneId} / ${variant.label}\n${variant.prompt}`)
  const posterPrompts = state.posters.map((poster) => `## Poster / ${poster.posterType}\n${poster.prompt}`)
  const characterPrompts =
    state.characterConsistencyPack?.profiles.map((profile) => `## Character / ${profile.name}\n${profile.consistencyPrompt}`) ?? []

  return [...characterPrompts, ...storyboardPrompts, ...variantPrompts, ...posterPrompts].join("\n\n")
}

export function exportVisualStoryboardToMarkdown(state: VisualAgentState) {
  const imageLines = state.storyboardVisualSets
    .map((set) => {
      const lines = set.images.map(
        (image) =>
          `- ${image.id} / ${image.provider} / ${image.status}` +
          `${image.isSelected ? " / selected" : ""}${image.isLocked ? " / locked" : ""}\n  - Prompt: ${image.prompt}`
      )
      return `### Scene ${set.sceneId}\n${lines.join("\n") || "- No storyboard images yet."}`
    })
    .join("\n\n")

  const comparisonLines = state.storyboardComparisonSets
    .map(
      (set) =>
        `### Scene ${set.sceneId}\n` +
        set.variants
          .map((variant) => `- ${variant.label}${variant.id === set.selectedVariantId ? " / selected" : ""}: ${variant.reason}`)
          .join("\n")
    )
    .join("\n\n")

  const characterLines =
    state.characterConsistencyPack?.profiles
      .map(
        (profile) =>
          `- ${profile.name}: ${profile.consistencyPrompt}\n  - Locked: ${profile.lockedFields.join(", ") || "none"}`
      )
      .join("\n") ?? "- No character consistency pack."

  const timelineLines =
    state.timeline?.shots
      .map(
        (shot) =>
          `- #${shot.order} ${shot.title} / ${shot.durationSeconds}s / ${shot.transition}` +
          `${shot.isClimax ? " / climax" : ""}${shot.isLocked ? " / locked" : ""}`
      )
      .join("\n") ?? "- No timeline."

  const posterLines = state.posters
    .map((poster) => `- ${poster.posterType} / ${poster.provider} / ${poster.status}\n  - Prompt: ${poster.prompt}`)
    .join("\n") || "- No concept posters."

  const reelLines = state.reels
    .map((reel) => `- ${reel.title} / ${reel.shots.length} shots / ${reel.totalDurationSeconds}s`)
    .join("\n") || "- No storyboard reels."

  return `# SceneLab Visual Storyboard

## Storyboard Images
${imageLines}

## Variant Comparisons
${comparisonLines || "- No comparison sets."}

## Character Consistency
${characterLines}

## Timeline
${timelineLines}

## Concept Poster Prompts
${posterLines}

## Storyboard Reel
${reelLines}

## Visual Prompt Pack
${exportPromptPackFromVisualState(state)}
`
}
