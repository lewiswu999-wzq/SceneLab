import type { PosterType, TimelineShot } from "@/lib/types"

export const posterTypeLabels: Record<PosterType, string> = {
  "main-poster": "主海报",
  "character-poster": "角色海报",
  "mood-poster": "氛围海报",
  "vertical-cover": "竖版封面",
  "horizontal-banner": "横版横幅",
}

export const transitionLabels: Record<TimelineShot["transition"], string> = {
  cut: "硬切",
  fade: "淡入淡出",
  dissolve: "叠化",
  "match-cut": "匹配剪辑",
  "jump-cut": "跳切",
  black: "黑场",
}

const shotSizeLabels: Record<string, string> = {
  "extreme wide shot": "大全景",
  "wide shot": "全景",
  "medium shot": "中景",
  "medium close-up": "中近景",
  "close-up": "特写",
  "extreme close-up": "大特写",
  "over-the-shoulder": "过肩镜头",
}

export function getShotSizeLabel(value: string) {
  return shotSizeLabels[value.toLowerCase()] ?? value
}
