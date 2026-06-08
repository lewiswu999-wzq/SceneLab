import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { StoryOverview } from "@/lib/types"

type OverviewPanelProps = {
  overview: StoryOverview
}

export function OverviewPanel({ overview }: OverviewPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Overview</CardTitle>
        <CardDescription>故事摘要、核心冲突、主题和视觉关键词</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <p className="text-sm leading-7 text-zinc-300">{overview.summary}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/[0.03] p-3">
            <span className="text-xs text-zinc-500">核心冲突</span>
            <span className="text-sm leading-6 text-zinc-200">{overview.coreConflict}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/[0.03] p-3">
            <span className="text-xs text-zinc-500">主题</span>
            <span className="text-sm leading-6 text-zinc-200">{overview.theme}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500">视觉关键词</span>
          <div className="flex flex-wrap gap-2">
            {overview.visualKeywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="border-teal-300/20 bg-teal-300/10 text-teal-100"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-amber-300/15 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
          {overview.emotionalArc}
        </div>
      </CardContent>
    </Card>
  )
}
