import { STYLE_KEYWORDS } from "@/lib/constants"
import type {
  Character,
  Relationship,
  RhythmAdvice,
  SceneAnalysis,
  SceneSlice,
  ShotSuggestion,
  TextInput,
} from "@/lib/types"

const fallbackNames = ["林晚", "周砚", "阿澈", "沈岚"]
const relationshipLabels = ["朋友", "对手", "隐藏冲突", "依赖", "误解"]
const locations = ["雨夜街口", "旧楼走廊", "临时工作室", "空旷天台", "废弃放映厅"]
const times = ["清晨", "午后", "黄昏", "深夜"]
const shotSizes = ["大全景到中景", "近景", "特写", "过肩镜头", "主观镜头"]
const cameraAngles = ["低机位微仰", "平视观察", "高机位俯拍", "侧后方跟随"]
const cameraMoves = ["缓慢推进", "手持跟拍", "静态长镜头", "快速横移", "轻微摇镜"]
const rhythmTypes: RhythmAdvice["rhythmType"][] = ["slow", "medium", "fast", "explosive"]

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function hashText(text: string) {
  return Array.from(text).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 7)
}

function splitText(text: string) {
  const fragments = text
    .replace(/\r/g, "")
    .split(/[\n。！？!?；;]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (fragments.length >= 4) {
    return fragments.slice(0, Math.max(4, Math.min(6, fragments.length)))
  }

  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length > 12) {
    const size = Math.ceil(words.length / 4)
    return [0, 1, 2, 3].map((index) => words.slice(index * size, (index + 1) * size).join(" "))
  }

  return [
    text.slice(0, 60) || "人物进入故事的第一个临界点",
    "隐藏的信息开始浮出水面，角色被迫重新判断彼此。",
    "外部压力压缩行动空间，情绪和目标发生碰撞。",
    "关键选择出现，故事被推向一个更明确的方向。",
  ]
}

function splitTextToCount(text: string, count: number) {
  const clean = text.trim()
  if (!clean) return []
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * clean.length) / count)
    const end = Math.floor(((index + 1) * clean.length) / count)
    return clean.slice(start, end).trim() || `第 ${index + 1} 幕`
  })
}

function extractCharacters(text: string) {
  const normalizeName = (name: string) => {
    const trimmed = name.trim()
    if (/^[和与及在把将对向从的一个她他它这那]/.test(trimmed)) {
      return ""
    }
    if (/[一扇卷段个的了]/.test(trimmed)) {
      return ""
    }
    if (trimmed.length === 3 && /[回和与在了的来去找发看听]/.test(trimmed.at(-1) ?? "")) {
      return trimmed.slice(0, 2)
    }
    return trimmed
  }
  const roleMatches = Array.from(
    text.matchAll(/(?:剪辑师|好友|女孩|少年|父亲|母亲|导演|侦探|老师|主角|人物|演员|编剧)([\u4e00-\u9fa5]{2,3})/g)
  ).map((match) => normalizeName(match[1]))
  const namedMatches = Array.from(text.matchAll(/(?:叫|名叫|化名为)([\u4e00-\u9fa5]{2,3})/g)).map(
    (match) => normalizeName(match[1])
  )
  const explicit = Array.from(new Set([...roleMatches, ...namedMatches])).filter(
    (name) =>
      name.length >= 2 &&
      !["一个", "陌生", "年轻", "儿时", "他们", "父亲", "母亲", "留下"].includes(name)
  )

  const names = explicit.filter((name) => name.length >= 2).slice(0, 4)
  return Array.from(new Set([...names, ...fallbackNames])).slice(0, Math.max(2, Math.min(4, names.length || 2)))
}

function getTone(input: TextInput) {
  const byType: Record<string, string> = {
    小说片段: "偏重内心动机与叙事转折",
    剧本片段: "偏重场面调度和对白潜台词",
    短剧文案: "偏重钩子、反转和节奏密度",
    故事梗概: "偏重结构拆解和可拍摄段落",
    广告脚本: "偏重记忆点、产品动作和情绪触发",
  }

  return byType[input.textType] ?? "偏重结构化影视分析"
}

function buildScenes(input: TextInput, names: string[]) {
  const fragments = input.requestedSceneCount
    ? splitTextToCount(input.sourceText, input.requestedSceneCount)
    : splitText(input.sourceText)
  const seed = hashText(input.sourceText + input.style + input.analysisDepth)
  const depthBoost = input.analysisDepth === "详细分析" ? 12 : input.analysisDepth === "快速分析" ? -8 : 0
  const styleWords = STYLE_KEYWORDS[input.style] ?? STYLE_KEYWORDS["现实主义"]

  return fragments.slice(0, Math.max(4, fragments.length)).map((fragment, index): SceneSlice => {
    const score = hashText(fragment + index + seed)
    const emotion = clamp(34 + ((score + index * 17) % 48) + depthBoost / 2)
    const rhythm = clamp(38 + ((score + index * 23) % 46) + (input.textType === "短剧文案" ? 10 : 0))
    const selectedNames = names.slice(0, Math.max(2, Math.min(names.length, 2 + (index % 2))))

    return {
      id: `scene-${index + 1}`,
      title: `场景 ${index + 1}｜${styleWords[index % styleWords.length]}`,
      location: locations[(score + index) % locations.length],
      timeOfDay: times[(score + index * 2) % times.length],
      characters: selectedNames,
      summary: `${fragment.slice(0, 92)}${fragment.length > 92 ? "..." : ""}`,
      emotionValue: emotion,
      rhythmValue: rhythm,
      keyLine: fragment.length > 24 ? fragment.slice(0, 24) : `${selectedNames[0]}必须作出选择`,
    }
  })
}

function buildCharacters(input: TextInput, names: string[], scenes: SceneSlice[]) {
  const emotions = ["克制", "犹疑", "紧绷", "被吸引", "防御", "沉默"]

  return names.map((name, index): Character => ({
    id: `char-${index + 1}`,
    name,
    role: index === 0 ? "主要行动者" : index === 1 ? "关系推动者" : "信息携带者",
    goal:
      index === 0
        ? "弄清事件背后的真实动机"
        : index === 1
          ? "保护自己相信的关系和秘密"
          : "在关键时刻改变叙事方向",
    currentEmotion: emotions[(hashText(input.sourceText + name) + index) % emotions.length],
    note: `${name}的行为在${scenes[index % scenes.length].title}里最容易显露真实立场。`,
  }))
}

function buildRelationships(names: string[], input: TextInput) {
  const pairs: Relationship[] = []
  for (let index = 0; index < Math.max(2, names.length); index += 1) {
    const from = names[index % names.length]
    const to = names[(index + 1) % names.length]
    pairs.push({
      from,
      to,
      label: relationshipLabels[(hashText(from + to + input.style) + index) % relationshipLabels.length],
      tension: clamp(42 + ((hashText(to + from + input.sourceText) + index * 13) % 47)),
    })
  }
  return pairs
}

function buildRhythm(scenes: SceneSlice[]): RhythmAdvice[] {
  return scenes.map((scene, index) => {
    const rhythmType = rhythmTypes[Math.min(3, Math.floor(scene.rhythmValue / 26))]
    const suggestion =
      rhythmType === "slow"
        ? "用长镜头和静态观察保留角色迟疑"
        : rhythmType === "medium"
          ? "保持中速剪辑，让信息逐步落点"
          : rhythmType === "fast"
            ? "用快切压缩反应时间，突出行动压力"
            : "使用蒙太奇和声音断裂制造爆点"

    return {
      sceneId: scene.id,
      rhythmType,
      editingSuggestion: suggestion,
      reason: `场景 ${index + 1} 的节奏值为 ${scene.rhythmValue}，适合让剪辑承担情绪推进。`,
    }
  })
}

function buildShots(input: TextInput, scenes: SceneSlice[]): ShotSuggestion[] {
  const styleWords = STYLE_KEYWORDS[input.style] ?? STYLE_KEYWORDS["现实主义"]

  return scenes.map((scene, index) => ({
    sceneId: scene.id,
    shotSize: shotSizes[index % shotSizes.length],
    cameraAngle: cameraAngles[(index + scene.emotionValue) % cameraAngles.length],
    cameraMovement: cameraMoves[(index + scene.rhythmValue) % cameraMoves.length],
    lighting: styleWords[index % styleWords.length],
    colorTone: input.style === "悬疑" ? "冷青灰与局部暖光" : input.style === "青春" ? "偏暖高光与轻微过曝" : "低饱和电影色",
    soundDesign:
      scene.rhythmValue > 72
        ? "环境声突然抽离，保留呼吸和脚步"
        : "保留空间底噪，让对白和沉默形成对位",
    aiVideoPrompt: `${scene.location}，${scene.timeOfDay}，${scene.characters.join("与")}，${scene.summary.slice(0, 34)}，${styleWords[index % styleWords.length]}，cinematic shot`,
  }))
}

export function analyzeText(input: TextInput): SceneAnalysis {
  const cleanText = input.sourceText.trim()
  const names = extractCharacters(cleanText)
  const scenes = buildScenes({ ...input, sourceText: cleanText }, names)
  const characters = buildCharacters(input, names, scenes)
  const relationships = buildRelationships(names, input)
  const rhythm = buildRhythm(scenes)
  const shotSuggestions = buildShots(input, scenes)
  const peakScene = scenes.reduce((peak, scene) => (scene.emotionValue > peak.emotionValue ? scene : peak), scenes[0])
  const visualKeywords = Array.from(new Set([...(STYLE_KEYWORDS[input.style] ?? []), ...scenes.slice(0, 3).map((scene) => scene.location)])).slice(0, 6)

  return {
    meta: {
      textType: input.textType,
      analysisDepth: input.analysisDepth,
      style: input.style,
      generatedAt: new Date().toLocaleString("zh-CN"),
    },
    overview: {
      summary: `${getTone(input)}：这段文本可以被拆成 ${scenes.length} 个可拍摄段落，核心推进来自${names[0]}与${names[1]}之间逐渐升高的目标错位。${cleanText.slice(0, 72)}${cleanText.length > 72 ? "..." : ""}`,
      theme: input.style === "科幻" ? "人在技术阴影下寻找真实记忆" : input.style === "悬疑" ? "真相逼近时，信任会先被测试" : "角色在关系压力中确认自己的选择",
      coreConflict: `${names[0]}想要继续追问，${names[1]}更倾向于隐藏或延后答案；外部事件把两人的分歧推到台前。`,
      emotionalArc: `情绪从 ${scenes[0].emotionValue} 起步，在「${peakScene.title}」达到 ${peakScene.emotionValue}，最后回落到需要行动的余震。`,
      visualKeywords,
    },
    scenes,
    characters,
    relationships,
    rhythm,
    shotSuggestions,
  }
}
