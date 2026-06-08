import type {
  AIGCPromptPack,
  AIGCPromptPreference,
  AIGCStoryboardPrompt,
  AIGCTool,
  SceneAnalysis,
  SceneSlice,
  ShotSuggestion,
} from "@/lib/types"
import { buildSceneStoryboardCraftPrompt } from "@/lib/scenelab-storyboard-craft"

const toolLabels: Record<AIGCTool, string> = {
  midjourney: "Midjourney",
  "stable-diffusion": "Stable Diffusion",
  sdxl: "SDXL",
  dalle: "DALL·E",
  runway: "Runway",
  pika: "Pika",
  kling: "Kling / 可灵",
  jimeng: "即梦",
  "tongyi-wanxiang": "通义万相",
  comfyui: "ComfyUI",
  "generic-en": "通用英文 Prompt",
  "generic-zh": "通用中文 Prompt",
}

function styleStrength(preference: AIGCPromptPreference) {
  if (preference.styleIntensity === "strong") {
    return "strong cinematic style, highly controlled mood, distinctive visual identity"
  }
  if (preference.styleIntensity === "subtle") {
    return "subtle cinematic realism, restrained style, natural texture"
  }
  return "balanced cinematic style, readable composition, polished visual design"
}

function buildGlobalStyleGuide(analysis: SceneAnalysis, preference: AIGCPromptPreference) {
  const keywords = analysis.overview.visualKeywords.join(", ")
  if (preference.language === "en") {
    return `Global style: ${styleStrength(preference)}. Theme: ${analysis.overview.theme}. Visual keywords: ${keywords}. Aspect ratio ${preference.aspectRatio}.`
  }
  if (preference.language === "bilingual") {
    return `Global style / 全局风格：${styleStrength(preference)}。主题：${analysis.overview.theme}。视觉关键词：${keywords}。画幅 ${preference.aspectRatio}。`
  }
  return `全局风格：${analysis.overview.theme}；关键词：${keywords}；风格强度 ${preference.styleIntensity}；画幅 ${preference.aspectRatio}。`
}

function buildCharacterConsistencyGuide(analysis: SceneAnalysis, preference: AIGCPromptPreference) {
  const characters = analysis.characters
    .map((character) => `${character.name}: ${character.role}, ${character.currentEmotion}`)
    .join("; ")
  if (preference.language === "en") {
    return `Keep character continuity across shots: ${characters}. Preserve wardrobe, age, facial traits, emotional state, and screen direction.`
  }
  if (preference.language === "bilingual") {
    return `Character consistency / 角色一致性：${characters}。保持服装、年龄、面部特征、情绪状态和运动方向一致。`
  }
  return `角色一致性：${characters}。跨场景保持服装、年龄、面部特征、情绪状态和运动方向一致。`
}

function englishBase(scene: SceneSlice, shot: ShotSuggestion) {
  return `${shot.shotSize} of ${scene.characters.join(" and ")} in ${scene.location}, ${scene.timeOfDay}, ${scene.summary}, ${shot.cameraAngle}, ${shot.cameraMovement}, ${shot.colorTone}, cinematic composition`
}

function chineseBase(scene: SceneSlice, shot: ShotSuggestion) {
  return `${scene.location}，${scene.timeOfDay}，${scene.characters.join("与")}，${scene.summary}，${shot.shotSize}，${shot.cameraAngle}，${shot.cameraMovement}，${shot.colorTone}`
}

function generateNegativePrompt(preference: AIGCPromptPreference) {
  if (!preference.includeNegativePrompt) {
    return undefined
  }
  if (preference.language === "zh") {
    return "低清晰度、畸形手指、错误肢体、过度磨皮、塑料质感、文字水印、重复人物、脸部崩坏、构图混乱"
  }
  return "low quality, distorted hands, extra limbs, plastic skin, watermark, duplicated characters, broken face, messy composition, unreadable text"
}

function buildToolParameters(preference: AIGCPromptPreference) {
  if (preference.tool === "midjourney") {
    return `--ar ${preference.aspectRatio} --style raw --v 6`
  }
  if (preference.tool === "stable-diffusion" || preference.tool === "sdxl") {
    return `Steps 28-36, CFG 5.5-7, sampler DPM++ 2M Karras, size ${preference.aspectRatio}`
  }
  if (preference.tool === "comfyui") {
    return `nodes: CLIP Text Encode / KSampler / ${preference.aspectRatio} latent / ControlNet optional`
  }
  if (["runway", "pika", "kling", "jimeng", "tongyi-wanxiang"].includes(preference.tool)) {
    return `duration 4-6s, aspect ${preference.aspectRatio}, smooth camera motion`
  }
  return `aspect ${preference.aspectRatio}`
}

function buildUsageTip(tool: AIGCTool) {
  const tips: Record<AIGCTool, string> = {
    midjourney: "适合直接复制到 Midjourney，必要时追加 --seed 保持系列一致。",
    "stable-diffusion": "把 main prompt 放正向，negative prompt 放反向，角色一致性可放在 LoRA/参考图说明里。",
    sdxl: "适合 SDXL 正反向提示词，建议配合参考图或 IPAdapter 控制人物一致性。",
    dalle: "适合自然语言生成分镜概念图，不要追加复杂参数。",
    runway: "适合视频生成，重点检查镜头运动与主体动作是否足够明确。",
    pika: "适合短视频镜头，保持动作简单、镜头指令清晰。",
    kling: "适合可灵视频生成，中文动作、镜头、光影描述要直接。",
    jimeng: "适合即梦，中文描述可更自然，避免过度参数化。",
    "tongyi-wanxiang": "适合通义万相，保留中文主体、场景、风格和镜头信息。",
    comfyui: "适合拆进 ComfyUI 节点，模块可分别放入不同文本编码节点。",
    "generic-en": "通用英文版本，适合迁移到海外图像或视频工具。",
    "generic-zh": "通用中文版本，适合国内 AIGC 工具。",
  }
  return tips[tool]
}

function formatPromptForTool(
  scene: SceneSlice,
  shot: ShotSuggestion,
  preference: AIGCPromptPreference,
  globalStyleGuide: string
) {
  const en = englishBase(scene, shot)
  const zh = chineseBase(scene, shot)
  const style = styleStrength(preference)

  if (preference.tool === "midjourney") {
    return `${en}, moody lighting, shallow depth of field, film still, realistic texture, subtle grain, ${style} ${buildToolParameters(preference)}`
  }

  if (preference.tool === "stable-diffusion" || preference.tool === "sdxl") {
    return `${en}, masterpiece, best quality, detailed environment, consistent character design, cinematic lighting, ${style}`
  }

  if (preference.tool === "dalle") {
    return `Create a clear cinematic storyboard frame: ${en}. The image should show the action, environment, emotional mood, and camera framing in a natural visual description. Avoid technical parameter syntax.`
  }

  if (["runway", "pika", "kling", "jimeng", "tongyi-wanxiang"].includes(preference.tool)) {
    return `${zh}。生成一个 4 到 6 秒的视频镜头，主体动作清晰，镜头${shot.cameraMovement}，情绪从场景压力逐渐推进，光影为${shot.lighting}，整体保持${globalStyleGuide}。`
  }

  if (preference.tool === "comfyui") {
    return [
      `subject: ${scene.characters.join(", ")}`,
      `scene: ${scene.location}, ${scene.timeOfDay}, ${scene.summary}`,
      `style: ${style}`,
      `lighting: ${shot.lighting}`,
      `camera: ${shot.shotSize}, ${shot.cameraAngle}, ${shot.cameraMovement}`,
    ].join("\n")
  }

  if (preference.tool === "generic-zh") {
    return `${zh}。画面要有清晰主体、环境层次、情绪张力和可执行的镜头语言。`
  }

  if (preference.language === "bilingual") {
    return `${en}\n中文：${zh}`
  }

  return en
}

function generatePromptForScene(
  scene: SceneSlice,
  shotSuggestion: ShotSuggestion,
  preference: AIGCPromptPreference,
  globalStyleGuide: string,
  characterConsistencyGuide: string
): AIGCStoryboardPrompt {
  const storyboardCraft = buildSceneStoryboardCraftPrompt(scene, shotSuggestion)
  return {
    id: `prompt-${scene.id}-${preference.tool}`,
    sceneId: scene.id,
    tool: preference.tool,
    title: `${scene.title}｜${toolLabels[preference.tool]}`,
    mainPrompt: `${formatPromptForTool(scene, shotSuggestion, preference, globalStyleGuide)}\n\n${storyboardCraft}`,
    negativePrompt: generateNegativePrompt(preference),
    cameraPrompt: preference.includeCameraParams
      ? `${shotSuggestion.shotSize} / ${shotSuggestion.cameraAngle} / ${shotSuggestion.cameraMovement}`
      : undefined,
    lightingPrompt: preference.includeLightingParams
      ? `${shotSuggestion.lighting} / ${shotSuggestion.colorTone}`
      : undefined,
    stylePrompt: styleStrength(preference),
    characterConsistencyPrompt: preference.includeConsistencyNotes
      ? characterConsistencyGuide
      : undefined,
    parameters: buildToolParameters(preference),
    usageTip: buildUsageTip(preference.tool),
  }
}

export function generateAIGCStoryboardPrompts(
  analysis: SceneAnalysis,
  preference: AIGCPromptPreference
): AIGCPromptPack {
  const globalStyleGuide = buildGlobalStyleGuide(analysis, preference)
  const characterConsistencyGuide = buildCharacterConsistencyGuide(analysis, preference)
  const prompts = analysis.scenes.map((scene, index) => {
    const shot = analysis.shotSuggestions.find((item) => item.sceneId === scene.id) ?? analysis.shotSuggestions[index]
    return generatePromptForScene(scene, shot, preference, globalStyleGuide, characterConsistencyGuide)
  })
  const pack = {
    preference,
    prompts,
    globalStyleGuide,
    characterConsistencyGuide,
    exportText: "",
  }
  return {
    ...pack,
    exportText: exportAIGCPromptPackToTXT(pack),
  }
}

export function exportAIGCPromptPackToTXT(pack: Omit<AIGCPromptPack, "exportText"> | AIGCPromptPack) {
  const sections = pack.prompts.map((prompt, index) =>
    [
      `## ${index + 1}. ${prompt.title}`,
      `Main Prompt:\n${prompt.mainPrompt}`,
      prompt.negativePrompt ? `Negative Prompt:\n${prompt.negativePrompt}` : undefined,
      prompt.cameraPrompt ? `Camera:\n${prompt.cameraPrompt}` : undefined,
      prompt.lightingPrompt ? `Lighting:\n${prompt.lightingPrompt}` : undefined,
      prompt.stylePrompt ? `Style:\n${prompt.stylePrompt}` : undefined,
      prompt.characterConsistencyPrompt
        ? `Character Consistency:\n${prompt.characterConsistencyPrompt}`
        : undefined,
      prompt.parameters ? `Parameters:\n${prompt.parameters}` : undefined,
      `Usage Tip:\n${prompt.usageTip}`,
    ]
      .filter(Boolean)
      .join("\n\n")
  )

  return [
    `# SceneLab AIGC Storyboard Prompt Pack`,
    `Tool: ${toolLabels[pack.preference.tool]}`,
    `Aspect Ratio: ${pack.preference.aspectRatio}`,
    `Language: ${pack.preference.language}`,
    `Style Intensity: ${pack.preference.styleIntensity}`,
    `Global Style Guide:\n${pack.globalStyleGuide}`,
    `Character Consistency Guide:\n${pack.characterConsistencyGuide}`,
    ...sections,
  ].join("\n\n")
}

export function exportAIGCPromptPackToJSON(pack: AIGCPromptPack) {
  return JSON.stringify(pack, null, 2)
}

export { toolLabels }
