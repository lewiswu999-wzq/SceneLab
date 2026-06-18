const runLogLabels: Record<string, string> = {
  "生成 AIGC Prompt 准备数据": "准备生成式视觉提示词数据",
  understandFeedback: "理解用户反馈",
  selectModulesToRevise: "选择需要修订的模块",
  reviseSceneLabResult: "修订分析结果",
  compareRevisionDiff: "对比修订前后差异",
  runRevisionSelfCritique: "执行修订自检",
  detectLongScript: "检测长剧本",
  splitScriptIntoChunks: "拆分长剧本段落",
  analyzeChunk: "逐段分析剧本",
  mergeChunkAnalyses: "合并分段分析",
  mergeCharacters: "合并人物信息",
  mergeRelationships: "合并人物关系",
  mergeEmotionCurve: "合并情绪曲线",
  mergeShotSuggestions: "合并镜头建议",
  runGlobalSelfCritique: "执行全局自检",
  applyUserEdit: "应用用户修改",
  detectAffectedModules: "检测受影响模块",
  collectLockedFields: "收集用户锁定内容",
  buildRegenerationContext: "整理重生成上下文",
  regenerateAffectedModules: "重生成受影响模块",
  mergeWithLockedFields: "合并并保留锁定内容",
  runPostRegenerationSelfCritique: "执行重生成自检",
  updateStoryboardTimeline: "更新时间线",
  generateStoryboardVariants: "生成分镜候选版本",
  selectStoryboardVariant: "选用分镜候选版本",
  "selectStoryboardVariant:locked": "锁定并选用分镜候选版本",
  buildCharacterConsistencyPrompt: "生成人物一致性设定",
  generateConceptPoster: "生成概念海报",
  lockStoryboardImage: "锁定分镜图",
  selectStoryboardImage: "选用分镜图",
  generateStoryboardImage: "生成分镜图",
  buildStoryboardReel: "生成视觉预演",
}

const runLogPrefixes: Array<[string, string]> = [
  ["lockField:", "锁定用户修改字段"],
  ["unlockField:", "解除字段锁定"],
  ["restoreUserEdit:", "恢复用户修改"],
]

export function localizeRunLog(log: string) {
  const normalized = log.trim()
  if (!normalized) return "完成未命名步骤"

  const exactLabel = runLogLabels[normalized]
  if (exactLabel) return exactLabel

  const prefixLabel = runLogPrefixes.find(([prefix]) => normalized.startsWith(prefix))
  if (prefixLabel) return prefixLabel[1]

  if (/^[a-z][a-zA-Z]*(?::.*)?$/.test(normalized)) {
    return "执行内部处理步骤"
  }

  return normalized
}
