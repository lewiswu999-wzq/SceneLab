import { analyzeText } from "@/lib/mock-analyzer"
import type {
  AgentRunResult,
  Character,
  ChunkAnalysisResult,
  FeedbackTargetModule,
  LongScriptAnalysisResult,
  Relationship,
  RevisedAgentRunResult,
  RevisionRecord,
  SceneAnalysis,
  SceneSlice,
  ShotSuggestion,
  TextInput,
  UserFeedback,
} from "@/lib/types"

const moduleLabels: Record<FeedbackTargetModule, string> = {
  overall: "整体报告",
  overview: "故事概览",
  scenes: "场景切片",
  characters: "人物分析",
  relationships: "人物关系",
  emotionCurve: "情绪曲线",
  rhythm: "节奏分析",
  shotSuggestions: "镜头建议",
  aigcPrompts: "AIGC Prompt",
  selfCritique: "自检",
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function cloneAnalysis(analysis: SceneAnalysis): SceneAnalysis {
  return JSON.parse(JSON.stringify(analysis)) as SceneAnalysis
}

export function createAgentRunFromAnalysis(
  analysis: SceneAnalysis,
  input?: TextInput
): RevisedAgentRunResult {
  return {
    id: makeId("run"),
    input,
    analysis,
    createdAt: new Date().toLocaleString("zh-CN"),
    selfCritique: runGlobalSelfCritique(analysis),
    toolCallLogs: [
      "理解任务",
      "制定分析计划",
      "检测文本长度",
      "普通分析",
      "生成人物关系",
      "生成情绪曲线",
      "生成节奏分析",
      "生成镜头建议",
      "准备生成式视觉提示词数据",
      "执行自检",
      "输出报告",
      "等待用户反馈",
    ],
    revisionHistory: [],
  }
}

function understandFeedback(previousResult: AgentRunResult, feedback: UserFeedback) {
  const focus = moduleLabels[feedback.targetModule]
  const intensity =
    feedback.adjustmentStrength === "strong"
      ? "明显重构"
      : feedback.adjustmentStrength === "medium"
        ? "局部重估"
        : "轻微优化"

  return `用户希望针对「${focus}」进行${intensity}：${feedback.feedbackText}。当前报告包含 ${previousResult.analysis.scenes.length} 个场景、${previousResult.analysis.characters.length} 个人物。`
}

function selectModulesToRevise(feedback: UserFeedback): FeedbackTargetModule[] {
  if (feedback.targetModule === "overall") {
    return [
      "overview",
      "scenes",
      "characters",
      "relationships",
      "emotionCurve",
      "rhythm",
      "shotSuggestions",
      "aigcPrompts",
      "selfCritique",
    ]
  }

  if (feedback.targetModule === "emotionCurve") {
    return ["emotionCurve", "rhythm", "selfCritique"]
  }

  if (feedback.targetModule === "aigcPrompts") {
    return ["shotSuggestions", "aigcPrompts", "selfCritique"]
  }

  return [feedback.targetModule, "selfCritique"]
}

function strengthPrefix(feedback: UserFeedback) {
  if (feedback.adjustmentStrength === "strong") {
    return "按明显调整重估"
  }
  if (feedback.adjustmentStrength === "medium") {
    return "按中等强度修正"
  }
  return "轻微润色"
}

function reviseOverviewIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("overview")) {
    return
  }

  const prefix = strengthPrefix(feedback)
  analysis.overview.summary = `${prefix}后的摘要：${analysis.overview.summary} 修正重点是「${feedback.feedbackText}」。`
  analysis.overview.coreConflict = `${analysis.overview.coreConflict} 反馈修正后，冲突表达更贴近用户指定方向。`
  analysis.overview.emotionalArc = `${analysis.overview.emotionalArc} 后续版本将更强调反馈中提到的变化。`
  analysis.overview.visualKeywords = Array.from(
    new Set([...analysis.overview.visualKeywords, feedback.feedbackText.slice(0, 8), "修正版"])
  ).slice(0, 8)
}

function reviseScenesIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("scenes")) {
    return
  }

  analysis.scenes = analysis.scenes.map((scene, index) => ({
    ...scene,
    summary:
      feedback.adjustmentStrength === "light"
        ? `${scene.summary}（根据反馈微调表达。）`
        : `${scene.summary} 修正后，第 ${index + 1} 个场景更明确服务于「${feedback.feedbackText}」。`,
    keyLine:
      feedback.adjustmentStrength === "strong"
        ? `${scene.characters[0] ?? "角色"}必须面对新的判断`
        : scene.keyLine,
  }))
}

function reviseCharactersIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("characters")) {
    return
  }

  analysis.characters = analysis.characters.map((character, index) => ({
    ...character,
    goal:
      index === 0 || feedback.adjustmentStrength === "strong"
        ? `${character.goal}；修正后更贴近「${feedback.feedbackText}」。`
        : character.goal,
    note: `${character.note} 版本修正中重新校准了人物动机。`,
  }))
}

function reviseRelationshipsIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("relationships")) {
    return
  }

  const delta = feedback.adjustmentStrength === "strong" ? 18 : feedback.adjustmentStrength === "medium" ? 10 : 5
  analysis.relationships = analysis.relationships.map((relationship, index) => ({
    ...relationship,
    label: index === 0 || feedback.adjustmentStrength === "strong" ? "重新校准的张力" : relationship.label,
    tension: clamp(relationship.tension + delta),
  }))
}

function reviseEmotionCurveIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("emotionCurve")) {
    return
  }

  const delta = feedback.adjustmentStrength === "strong" ? 24 : feedback.adjustmentStrength === "medium" ? 14 : 7
  analysis.scenes = analysis.scenes.map((scene, index) => ({
    ...scene,
    emotionValue: clamp(scene.emotionValue + Math.round((index / Math.max(1, analysis.scenes.length - 1)) * delta)),
  }))
  analysis.overview.emotionalArc = `根据反馈「${feedback.feedbackText}」重建后，后半段情绪曲线明显抬升，峰值更靠近收束段落。`
}

function reviseRhythmIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("rhythm")) {
    return
  }

  const delta = feedback.adjustmentStrength === "strong" ? 18 : feedback.adjustmentStrength === "medium" ? 10 : 4
  analysis.scenes = analysis.scenes.map((scene, index) => ({
    ...scene,
    rhythmValue: clamp(scene.rhythmValue + (index % 2 === 0 ? delta : Math.round(delta / 2))),
  }))
  analysis.rhythm = analysis.rhythm.map((item, index) => ({
    ...item,
    rhythmType:
      feedback.adjustmentStrength === "strong" && index >= Math.floor(analysis.rhythm.length / 2)
        ? "fast"
        : item.rhythmType,
    editingSuggestion: `${item.editingSuggestion} 修正建议：${feedback.feedbackText}`,
    reason: `${item.reason} 本轮根据用户反馈重新校准节奏判断。`,
  }))
}

function reviseShotSuggestionsIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("shotSuggestions") && !modules.includes("aigcPrompts")) {
    return
  }

  const videoShort = /短视频|竖屏|节奏|快/.test(feedback.feedbackText)
  const cinematic = /写实|电影|悬疑|质感/.test(feedback.feedbackText)
  analysis.shotSuggestions = analysis.shotSuggestions.map((shot) => ({
    ...shot,
    cameraMovement: videoShort ? "手持推进与快速转场" : shot.cameraMovement,
    lighting: cinematic ? `${shot.lighting}，写实电影感低照度` : shot.lighting,
    aiVideoPrompt: `${shot.aiVideoPrompt}，revision note: ${feedback.feedbackText}`,
  }))
}

function reviseAIGCPromptsIfNeeded(
  analysis: SceneAnalysis,
  feedback: UserFeedback,
  modules: FeedbackTargetModule[]
) {
  if (!modules.includes("aigcPrompts")) {
    return
  }

  analysis.shotSuggestions = analysis.shotSuggestions.map((shot) => ({
    ...shot,
    aiVideoPrompt: `${shot.aiVideoPrompt}，AIGC storyboard optimized，${feedback.feedbackText}`,
  }))
}

function runRevisionSelfCritique(analysis: SceneAnalysis, modules: FeedbackTargetModule[]) {
  return [
    `已复查 ${modules.map((module) => moduleLabels[module]).join("、")}。`,
    `场景数量 ${analysis.scenes.length}，人物数量 ${analysis.characters.length}，关系数量 ${analysis.relationships.length} 均保持可追踪。`,
    "修正版保留原始报告快照，可在版本历史中回看。",
  ]
}

function snapshotModules(analysis: SceneAnalysis, modules: FeedbackTargetModule[]): Partial<SceneAnalysis> {
  return {
    overview: modules.includes("overview") ? analysis.overview : undefined,
    scenes:
      modules.includes("scenes") || modules.includes("emotionCurve") || modules.includes("rhythm")
        ? analysis.scenes
        : undefined,
    characters: modules.includes("characters") ? analysis.characters : undefined,
    relationships: modules.includes("relationships") ? analysis.relationships : undefined,
    rhythm: modules.includes("rhythm") ? analysis.rhythm : undefined,
    shotSuggestions:
      modules.includes("shotSuggestions") || modules.includes("aigcPrompts")
        ? analysis.shotSuggestions
        : undefined,
  }
}

function buildRevisionRecord(
  feedback: UserFeedback,
  changedModules: FeedbackTargetModule[],
  before: SceneAnalysis,
  after: SceneAnalysis
): RevisionRecord {
  return {
    id: makeId("revision"),
    createdAt: new Date().toLocaleString("zh-CN"),
    feedback,
    changedModules,
    summary: `根据「${feedback.feedbackText}」完成 ${changedModules.length} 个模块的${strengthPrefix(feedback)}。`,
    beforeSnapshot: snapshotModules(before, changedModules),
    afterSnapshot: snapshotModules(after, changedModules),
    // Compact diff language lives in summary and snapshots, so UI can derive readable before/after details.
  }
}

export function reviseSceneLabResult(
  previousResult: AgentRunResult,
  feedback: UserFeedback
): RevisedAgentRunResult {
  const previousWithHistory = previousResult as RevisedAgentRunResult
  const before = cloneAnalysis(previousResult.analysis)
  const after = cloneAnalysis(previousResult.analysis)
  const feedbackUnderstanding = understandFeedback(previousResult, feedback)
  const modules = selectModulesToRevise(feedback)

  reviseOverviewIfNeeded(after, feedback, modules)
  reviseScenesIfNeeded(after, feedback, modules)
  reviseCharactersIfNeeded(after, feedback, modules)
  reviseRelationshipsIfNeeded(after, feedback, modules)
  reviseEmotionCurveIfNeeded(after, feedback, modules)
  reviseRhythmIfNeeded(after, feedback, modules)
  reviseShotSuggestionsIfNeeded(after, feedback, modules)
  reviseAIGCPromptsIfNeeded(after, feedback, modules)

  const selfCritique = runRevisionSelfCritique(after, modules)
  const revisionRecord = buildRevisionRecord(feedback, modules, before, after)

  return {
    ...previousResult,
    id: makeId("run-revised"),
    analysis: after,
    createdAt: new Date().toLocaleString("zh-CN"),
    selfCritique,
    toolCallLogs: [
      ...previousResult.toolCallLogs,
      "等待用户反馈",
      "理解用户反馈",
      feedbackUnderstanding,
      "选择需要修订的模块",
      "修订分析结果",
      "对比修订前后差异",
      "执行修订自检",
    ],
    revisionHistory: [...(previousWithHistory.revisionHistory ?? []), revisionRecord],
  }
}

export function detectLongScript(input: TextInput) {
  const chineseChars = Array.from(input.sourceText).filter((char) => /[\u4e00-\u9fa5]/.test(char)).length
  return chineseChars > 3000 || input.sourceText.length > 5000
}

export function splitScriptIntoChunks(text: string) {
  const targetSize = 1900
  const titles = ["开端与人物引入", "冲突升级", "转折与压力", "高潮与收束", "余波与尾声"]
  const strongBreaks = Array.from(text.matchAll(/(?:第[一二三四五六七八九十\d]+场|场景|INT\.|EXT\.|\n\s*\n)/g))
    .map((match) => match.index ?? 0)
    .filter((index) => index > 0)
  const chunks: ReturnType<typeof buildChunk>[] = []
  let cursor = 0

  while (cursor < text.length) {
    const idealEnd = Math.min(text.length, cursor + targetSize)
    const nearbyBreak = strongBreaks
      .filter((index) => index > cursor + 900 && index <= cursor + 2500)
      .sort((a, b) => Math.abs(a - idealEnd) - Math.abs(b - idealEnd))[0]
    const end = nearbyBreak ?? idealEnd
    const chunkText = text.slice(cursor, end).trim()
    if (chunkText) {
      chunks.push(buildChunk(chunks.length, titles[chunks.length] ?? `第 ${chunks.length + 1} 段`, chunkText, cursor, end))
    }
    cursor = end
  }

  return chunks.length
    ? chunks
    : [buildChunk(0, titles[0], text.trim(), 0, text.length)]
}

function buildChunk(index: number, title: string, text: string, startChar: number, endChar: number) {
  return {
    id: `chunk-${index + 1}`,
    index,
    title: `第${index + 1}段：${title}`,
    text,
    startChar,
    endChar,
    estimatedSceneCount: Math.max(2, Math.ceil(text.length / 700)),
  }
}

function analyzeChunk(chunk: ReturnType<typeof buildChunk>, input: TextInput): ChunkAnalysisResult {
  const localAnalysis = analyzeText({
    ...input,
    sourceText: chunk.text,
    requestedSceneCount: undefined,
  })
  const localEmotionPeak = Math.max(...localAnalysis.scenes.map((scene) => scene.emotionValue))

  return {
    chunk,
    localAnalysis,
    localSummary: localAnalysis.overview.summary,
    detectedCharacters: localAnalysis.characters,
    localEmotionPeak,
    continuityNotes: [
      `${chunk.title} 的局部情绪峰值为 ${localEmotionPeak}。`,
      `与前后段落合并时需要追踪 ${localAnalysis.characters.map((character) => character.name).join("、")} 的动机连续性。`,
    ],
  }
}

function mergeSceneAnalyses(chunkResults: ChunkAnalysisResult[]) {
  return chunkResults.flatMap((result, chunkIndex) =>
    result.localAnalysis.scenes.map((scene, sceneIndex): SceneSlice => ({
      ...scene,
      id: `${result.chunk.id}-scene-${sceneIndex + 1}`,
      title: `${result.chunk.title}｜${scene.title}`,
      emotionValue: clamp(scene.emotionValue + chunkIndex * 4),
    }))
  )
}

function mergeCharacters(chunkResults: ChunkAnalysisResult[]) {
  const merged = new Map<string, Character>()
  chunkResults.flatMap((result) => result.detectedCharacters).forEach((character) => {
    const existing = merged.get(character.name)
    if (!existing) {
      merged.set(character.name, character)
      return
    }
    merged.set(character.name, {
      ...existing,
      note: `${existing.note} / ${character.note}`,
    })
  })
  return Array.from(merged.values()).map((character, index) => ({ ...character, id: `char-${index + 1}` }))
}

function mergeRelationships(chunkResults: ChunkAnalysisResult[]) {
  const relations = new Map<string, Relationship>()
  chunkResults.flatMap((result) => result.localAnalysis.relationships).forEach((relationship) => {
    const key = [relationship.from, relationship.to].sort().join("::")
    const existing = relations.get(key)
    relations.set(key, {
      ...relationship,
      tension: existing ? clamp((existing.tension + relationship.tension) / 2 + 8) : relationship.tension,
      label: existing ? `${existing.label}/${relationship.label}` : relationship.label,
    })
  })
  return Array.from(relations.values()).slice(0, 8)
}

function mergeRhythm(chunkResults: ChunkAnalysisResult[], scenes: SceneSlice[]) {
  return scenes.map((scene, index) => {
    const source = chunkResults.flatMap((result) => result.localAnalysis.rhythm)[index]
    return {
      sceneId: scene.id,
      rhythmType: source?.rhythmType ?? (scene.rhythmValue > 72 ? "fast" : "medium"),
      editingSuggestion: source?.editingSuggestion ?? "按全剧节奏重新衔接，保留段落间呼吸。",
      reason: `全局合并后位于第 ${index + 1} 个场景，节奏值 ${scene.rhythmValue}。`,
    }
  })
}

function mergeShotSuggestions(chunkResults: ChunkAnalysisResult[], scenes: SceneSlice[]) {
  const localShots = chunkResults.flatMap((result) => result.localAnalysis.shotSuggestions)
  return scenes.map((scene, index): ShotSuggestion => {
    const source = localShots[index % Math.max(1, localShots.length)]
    return {
      ...source,
      sceneId: scene.id,
      aiVideoPrompt: `${source.aiVideoPrompt}，chunk linked，${scene.title}`,
    }
  })
}

function buildGlobalContinuityNotes(chunkResults: ChunkAnalysisResult[]) {
  return [
    `共拆分 ${chunkResults.length} 个段落并完成局部分析。`,
    `全局合并重点：人物别名去重、关系张力平均后增强、情绪曲线按剧本顺序重建。`,
    ...chunkResults.map((result) => `${result.chunk.title}：${result.localSummary.slice(0, 72)}...`),
  ]
}

function runGlobalSelfCritique(analysis: SceneAnalysis) {
  return [
    `场景数量 ${analysis.scenes.length}，满足结构化展示要求。`,
    `人物关系数量 ${analysis.relationships.length}，可继续通过用户反馈校准。`,
    `镜头建议数量 ${analysis.shotSuggestions.length}，已覆盖每个场景。`,
  ]
}

export function runLongScriptSceneLabAgent(
  input: TextInput,
  forceLongScript = false
): LongScriptAnalysisResult {
  const isLongScript = forceLongScript || detectLongScript(input)
  const chunks = isLongScript
    ? splitScriptIntoChunks(input.sourceText)
    : splitScriptIntoChunks(input.sourceText).slice(0, 1)
  const chunkResults = chunks.map((chunk) => analyzeChunk(chunk, input))
  const scenes = mergeSceneAnalyses(chunkResults)
  const characters = mergeCharacters(chunkResults)
  const relationships = mergeRelationships(chunkResults)
  const rhythm = mergeRhythm(chunkResults, scenes)
  const shotSuggestions = mergeShotSuggestions(chunkResults, scenes)
  const globalMergeNotes = buildGlobalContinuityNotes(chunkResults)
  const base = chunkResults[0]?.localAnalysis ?? analyzeText(input)
  const analysis: SceneAnalysis = {
    ...base,
    overview: {
      ...base.overview,
      summary: `长剧本全局报告：${globalMergeNotes[0]} ${base.overview.summary}`,
      emotionalArc: `按 ${scenes.length} 个全局场景重建情绪曲线，峰值 ${Math.max(...scenes.map((scene) => scene.emotionValue))}。`,
    },
    scenes,
    characters,
    relationships,
    rhythm,
    shotSuggestions,
  }

  return {
    ...createAgentRunFromAnalysis(analysis, input),
    id: makeId("long-run"),
    isLongScript,
    chunks,
    chunkResults,
    globalMergeNotes,
    selfCritique: runGlobalSelfCritique(analysis),
    toolCallLogs: [
      "理解任务",
      "制定分析计划",
      "检测长剧本",
      "拆分长剧本段落",
      "逐段分析剧本",
      "合并分段分析",
      "合并人物信息",
      "合并人物关系",
      "合并情绪曲线",
      "合并镜头建议",
      "执行全局自检",
      "输出报告",
    ],
  }
}
