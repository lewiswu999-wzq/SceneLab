export const STORAGE_KEY = "scenelab.analysis.v1"
export const ACTIVE_PROJECT_KEY = "scenelab.project.active.v1"

export const TEXT_TYPES = [
  "小说片段",
  "剧本片段",
  "短剧文案",
  "故事梗概",
  "广告脚本",
] as const

export const ANALYSIS_DEPTHS = ["快速分析", "标准分析", "详细分析"] as const

export const STORY_STYLES = [
  "现实主义",
  "悬疑",
  "青春",
  "科幻",
  "古风",
  "纪录片感",
  "情绪短片",
] as const

export const DEFAULT_INPUT = {
  sourceText:
    "雨夜的旧影院即将拆除。年轻剪辑师林晚回到这里整理遗物，发现父亲留下的一卷无声胶片。胶片里反复出现一个陌生女孩和一扇从未打开的放映室门。她找到儿时好友周砚，一起追查胶片来源，却发现每一段影像都像在提前预告他们接下来会遇见的事。",
  textType: "故事梗概",
  analysisDepth: "标准分析",
  style: "悬疑",
} as const

export const STYLE_KEYWORDS: Record<string, string[]> = {
  现实主义: ["冷白日光", "生活质感", "克制表演", "街巷噪声"],
  悬疑: ["低照度", "反射", "空镜停顿", "未知声源"],
  青春: ["逆光", "奔跑", "手持呼吸", "夏日色温"],
  科幻: ["蓝绿色霓虹", "界面光", "金属回声", "空间压迫"],
  古风: ["烛火", "帘影", "留白", "鼓点"],
  纪录片感: ["自然光", "同期声", "观察距离", "粗粝颗粒"],
  情绪短片: ["近景", "浅焦", "环境低频", "慢动作"],
}
