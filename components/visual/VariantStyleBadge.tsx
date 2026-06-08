import type { StoryboardVariantStyle } from "@/lib/types"

const labels: Record<StoryboardVariantStyle, string> = {
  "cinematic-realism": "写实电影",
  "cold-suspense": "冷色悬疑",
  "warm-realism": "暖色现实",
  "neon-noir": "霓虹黑色",
  documentary: "纪录片感",
  dreamlike: "梦境诗意",
  "minimal-artfilm": "极简艺术",
}

export function VariantStyleBadge({ style }: { style: StoryboardVariantStyle }) {
  return (
    <span className="rounded border border-teal-300/20 bg-teal-300/10 px-2 py-0.5 text-xs text-teal-100">
      {labels[style]}
    </span>
  )
}
