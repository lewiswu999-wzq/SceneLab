import { analyzeText } from "@/lib/mock-analyzer"
import { createAgentRunFromAnalysis } from "@/lib/scenelab-agent"
import { ensureVisualAgentState } from "@/lib/visual-agent-state"
import type {
  EditableAgentRunResult,
  EditableModule,
  LockedField,
  RegenerationRequest,
  RegenerationResult,
  SceneAnalysis,
  UserEditRecord,
} from "@/lib/types"

export const MODULE_DEPENDENCY_MAP: Record<EditableModule, EditableModule[]> = {
  overview: ["scenes", "emotionCurve", "rhythm", "shotSuggestions", "aigcPrompts", "selfCritique"],
  scenes: ["characters", "relationships", "emotionCurve", "rhythm", "shotSuggestions", "aigcPrompts", "selfCritique"],
  characters: ["relationships", "shotSuggestions", "aigcPrompts", "selfCritique"],
  relationships: ["rhythm", "shotSuggestions", "aigcPrompts", "selfCritique"],
  emotionCurve: ["rhythm", "shotSuggestions", "aigcPrompts", "selfCritique"],
  rhythm: ["shotSuggestions", "aigcPrompts", "selfCritique"],
  shotSuggestions: ["aigcPrompts", "soundDesign", "selfCritique"],
  soundDesign: ["aigcPrompts", "selfCritique"],
  aigcPrompts: ["selfCritique"],
  selfCritique: [],
}

const moduleLabels: Record<EditableModule, string> = {
  overview: "故事概览",
  scenes: "场景切片",
  characters: "人物",
  relationships: "人物关系",
  emotionCurve: "情绪曲线",
  rhythm: "节奏建议",
  shotSuggestions: "镜头建议",
  aigcPrompts: "AIGC Prompt",
  soundDesign: "声音设计",
  selfCritique: "自检",
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function findCollectionItem<T extends { id?: string; sceneId?: string }>(
  items: T[] | undefined,
  targetId: string
) {
  return items?.find((item) => item.id === targetId || item.sceneId === targetId)
}

function moduleTarget(result: EditableAgentRunResult, module: EditableModule, targetId: string) {
  const analysis = result.analysis
  if (module === "overview") {
    return analysis.overview
  }
  if (module === "scenes" || module === "emotionCurve") {
    return findCollectionItem(analysis.scenes, targetId)
  }
  if (module === "characters") {
    return findCollectionItem(analysis.characters, targetId)
  }
  if (module === "relationships") {
    const index = Number(targetId.replace("relationship-", ""))
    return analysis.relationships[index]
  }
  if (module === "rhythm") {
    return findCollectionItem(analysis.rhythm, targetId)
  }
  if (module === "shotSuggestions" || module === "soundDesign" || module === "aigcPrompts") {
    return findCollectionItem(analysis.shotSuggestions, targetId)
  }
  return undefined
}

function readField(result: EditableAgentRunResult, module: EditableModule, targetId: string, fieldPath: string) {
  const target = moduleTarget(result, module, targetId) as Record<string, unknown> | undefined
  return target?.[fieldPath]
}

function writeField(
  result: EditableAgentRunResult,
  module: EditableModule,
  targetId: string,
  fieldPath: string,
  value: unknown
) {
  const target = moduleTarget(result, module, targetId) as Record<string, unknown> | undefined
  if (target) {
    target[fieldPath] = value
  }
}

function lockKey(field: Pick<LockedField, "module" | "targetId" | "fieldPath">) {
  return `${field.module}:${field.targetId}:${field.fieldPath}`
}

export function toEditableAgentRunResult(result: Partial<EditableAgentRunResult> & { analysis: SceneAnalysis }) {
  const base = createAgentRunFromAnalysis(result.analysis, result.input)
  return {
    ...base,
    ...result,
    revisionHistory: result.revisionHistory ?? [],
    userEdits: result.userEdits ?? [],
    lockedFields: result.lockedFields ?? [],
    regenerationHistory: result.regenerationHistory ?? [],
    visualState: ensureVisualAgentState(result.analysis, result.visualState),
  } satisfies EditableAgentRunResult
}

export function applyUserEdit(
  currentResult: EditableAgentRunResult,
  edit: Omit<UserEditRecord, "id" | "createdAt" | "locked">
): EditableAgentRunResult {
  const next = clone(currentResult)
  const oldValue = edit.oldValue ?? readField(next, edit.module, edit.targetId, edit.fieldPath)
  writeField(next, edit.module, edit.targetId, edit.fieldPath, edit.newValue)

  const record: UserEditRecord = {
    ...edit,
    id: makeId("edit"),
    createdAt: new Date().toLocaleString("zh-CN"),
    oldValue,
    locked: true,
  }
  const lockedField: LockedField = {
    module: edit.module,
    targetId: edit.targetId,
    fieldPath: edit.fieldPath,
    value: edit.newValue,
    lockedAt: record.createdAt,
    reason: "user-edited",
  }
  const nextLockedFields = next.lockedFields.filter((field) => lockKey(field) !== lockKey(lockedField))

  return {
    ...next,
    userEdits: [...next.userEdits, record],
    lockedFields: [...nextLockedFields, lockedField],
    toolCallLogs: [...next.toolCallLogs, "应用用户修改", "锁定用户修改字段"],
  }
}

export function collectLockedFields(currentResult: EditableAgentRunResult) {
  return currentResult.lockedFields
}

export function detectAffectedModules(currentResult: EditableAgentRunResult, request: RegenerationRequest) {
  const sourceEdits = currentResult.userEdits.filter((edit) => request.sourceEditIds.includes(edit.id))
  const seedModules = sourceEdits.length
    ? Array.from(new Set(sourceEdits.map((edit) => edit.module)))
    : Array.from(new Set(currentResult.userEdits.map((edit) => edit.module)))

  if (request.scope === "fullReportPreserveUserEdits") {
    return Object.keys(MODULE_DEPENDENCY_MAP) as EditableModule[]
  }
  if (request.scope === "currentModule") {
    return seedModules
  }
  if (request.scope === "downstreamModules") {
    return Array.from(
      new Set(seedModules.flatMap((module) => [module, ...MODULE_DEPENDENCY_MAP[module]]))
    )
  }
  return Array.from(new Set(seedModules.flatMap((module) => MODULE_DEPENDENCY_MAP[module]).concat("selfCritique" as EditableModule)))
}

function buildRegenerationContext(currentResult: EditableAgentRunResult, lockedFields: LockedField[]) {
  return {
    input: currentResult.input,
    analysis: currentResult.analysis,
    lockedFields,
    userEdits: currentResult.userEdits,
  }
}

function moduleIsSelected(module: EditableModule, modules: EditableModule[]) {
  return modules.includes(module) || (module === "soundDesign" && modules.includes("shotSuggestions"))
}

function regenerateAffectedModules(
  context: ReturnType<typeof buildRegenerationContext>,
  request: RegenerationRequest,
  modules: EditableModule[]
) {
  const regenerated = context.input ? analyzeText(context.input) : clone(context.analysis)
  const next = clone(context.analysis)
  const instruction = request.instruction?.trim()

  if (moduleIsSelected("overview", modules)) {
    next.overview = {
      ...regenerated.overview,
      summary: `${regenerated.overview.summary}${instruction ? ` 重生成指令：${instruction}` : ""}`,
    }
  }
  if (moduleIsSelected("scenes", modules) || moduleIsSelected("emotionCurve", modules)) {
    next.scenes = next.scenes.map((scene, index) => {
      const source = regenerated.scenes[index] ?? scene
      return {
        ...scene,
        ...(moduleIsSelected("scenes", modules) ? source : {}),
        emotionValue: moduleIsSelected("emotionCurve", modules)
          ? Math.max(scene.emotionValue, source.emotionValue)
          : scene.emotionValue,
      }
    })
  }
  if (moduleIsSelected("characters", modules)) {
    next.characters = next.characters.map((character, index) => regenerated.characters[index] ?? character)
  }
  if (moduleIsSelected("relationships", modules)) {
    next.relationships = next.relationships.map((relationship, index) => regenerated.relationships[index] ?? relationship)
  }
  if (moduleIsSelected("rhythm", modules)) {
    next.rhythm = next.rhythm.map((item, index) => ({
      ...(regenerated.rhythm[index] ?? item),
      sceneId: item.sceneId,
      editingSuggestion: `${regenerated.rhythm[index]?.editingSuggestion ?? item.editingSuggestion}${instruction ? `；按指令调整：${instruction}` : ""}`,
    }))
  }
  if (moduleIsSelected("shotSuggestions", modules) || moduleIsSelected("soundDesign", modules) || moduleIsSelected("aigcPrompts", modules)) {
    next.shotSuggestions = next.shotSuggestions.map((shot, index) => {
      const source = regenerated.shotSuggestions[index] ?? shot
      return {
        ...shot,
        ...(moduleIsSelected("shotSuggestions", modules) ? source : {}),
        soundDesign: moduleIsSelected("soundDesign", modules)
          ? `${source.soundDesign}${instruction ? `；${instruction}` : ""}`
          : shot.soundDesign,
        aiVideoPrompt: moduleIsSelected("aigcPrompts", modules)
          ? `${source.aiVideoPrompt}${instruction ? `，${instruction}` : ""}`
          : shot.aiVideoPrompt,
        sceneId: shot.sceneId,
      }
    })
  }

  if (moduleIsSelected("selfCritique", modules)) {
    next.meta = {
      ...next.meta,
      generatedAt: new Date().toLocaleString("zh-CN"),
    }
  }

  return next
}

function applyLockedFieldToAnalysis(analysis: SceneAnalysis, field: LockedField) {
  const editable = toEditableAgentRunResult({ analysis })
  writeField(editable, field.module, field.targetId, field.fieldPath, field.value)
  return editable.analysis
}

export function mergeWithLockedFields<T>(
  original: T,
  regenerated: T,
  lockedFields: LockedField[]
): T {
  let merged = clone(regenerated)
  for (const field of lockedFields) {
    try {
      if (typeof merged === "object" && merged && "meta" in merged) {
        merged = applyLockedFieldToAnalysis(merged as unknown as SceneAnalysis, field) as T
      }
    } catch {
      merged = clone(original)
    }
  }
  return merged
}

function mergeRegeneratedContentWithLockedFields(
  original: SceneAnalysis,
  regenerated: SceneAnalysis,
  lockedFields: LockedField[]
) {
  const warnings: string[] = []
  let merged = clone(regenerated)

  for (const field of lockedFields) {
    const before = JSON.stringify(merged)
    merged = applyLockedFieldToAnalysis(merged, field)
    if (JSON.stringify(merged) === before) {
      warnings.push(`找不到锁定字段路径：${lockKey(field)}，已保留原始内容。`)
      merged = applyLockedFieldToAnalysis(clone(original), field)
    }
  }

  return { merged, warnings }
}

function runPostRegenerationSelfCritique(analysis: SceneAnalysis, modules: EditableModule[], lockedFields: LockedField[]) {
  return [
    `本轮重生成模块：${modules.map((module) => moduleLabels[module]).join("、")}。`,
    `已保留 ${lockedFields.length} 个用户锁定字段，未覆盖用户编辑内容。`,
    `当前报告包含 ${analysis.scenes.length} 个场景、${analysis.characters.length} 个人物、${analysis.relationships.length} 条关系。`,
  ]
}

function buildRegenerationHistory(
  currentResult: EditableAgentRunResult,
  request: RegenerationRequest,
  preservedFields: LockedField[],
  regeneratedModules: EditableModule[],
  warnings: string[],
  nextResult: EditableAgentRunResult
): RegenerationResult {
  return {
    id: makeId("regen"),
    createdAt: new Date().toLocaleString("zh-CN"),
    request,
    preservedFields,
    regeneratedModules,
    summary: `根据 ${request.sourceEditIds.length || currentResult.userEdits.length} 条用户修改，重生成 ${regeneratedModules.length} 个模块并保留锁定字段。`,
    warnings,
    result: nextResult,
  }
}

export function regenerateFromUserEdits(
  currentResult: EditableAgentRunResult,
  request: RegenerationRequest
): EditableAgentRunResult {
  const lockedFields = collectLockedFields(currentResult)
  const modules = detectAffectedModules(currentResult, request)
  const context = buildRegenerationContext(currentResult, lockedFields)
  const regenerated = regenerateAffectedModules(context, request, modules)
  const { merged, warnings } = mergeRegeneratedContentWithLockedFields(
    currentResult.analysis,
    regenerated,
    lockedFields
  )
  const selfCritique = runPostRegenerationSelfCritique(merged, modules, lockedFields)
  const nextResult: EditableAgentRunResult = {
    ...currentResult,
    id: makeId("editable-run"),
    analysis: merged,
    createdAt: new Date().toLocaleString("zh-CN"),
    selfCritique,
    toolCallLogs: [
      ...currentResult.toolCallLogs,
      "检测受影响模块",
      "收集用户锁定内容",
      "整理重生成上下文",
      "重生成受影响模块",
      "合并并保留锁定内容",
      "执行重生成自检",
    ],
  }
  const history = buildRegenerationHistory(currentResult, request, lockedFields, modules, warnings, nextResult)

  return {
    ...nextResult,
    regenerationHistory: [...currentResult.regenerationHistory, history],
  }
}

export function unlockField(result: EditableAgentRunResult, field: LockedField) {
  return {
    ...result,
    lockedFields: result.lockedFields.filter((item) => lockKey(item) !== lockKey(field)),
    toolCallLogs: [...result.toolCallLogs, "解除字段锁定"],
  }
}

export function restoreUserEdit(result: EditableAgentRunResult, edit: UserEditRecord) {
  const next = clone(result)
  writeField(next, edit.module, edit.targetId, edit.fieldPath, edit.oldValue)
  return {
    ...next,
    lockedFields: next.lockedFields.filter((field) => lockKey(field) !== lockKey(edit)),
    userEdits: next.userEdits.map((item) =>
      item.id === edit.id
        ? {
            ...item,
            locked: false,
          }
        : item
    ),
    toolCallLogs: [...next.toolCallLogs, "恢复用户修改"],
  }
}

export function describeRegenerationScope(scope: RegenerationRequest["scope"]) {
  const labels: Record<RegenerationRequest["scope"], string> = {
    affectedOnly: "只更新受影响内容",
    currentModule: "更新当前模块",
    downstreamModules: "更新后续依赖模块",
    fullReportPreserveUserEdits: "全局重生成但保留我的修改",
  }
  return labels[scope]
}

export function editableModuleLabel(module: EditableModule) {
  return moduleLabels[module]
}
