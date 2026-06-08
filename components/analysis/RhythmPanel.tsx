import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RhythmAdvice, SceneSlice } from "@/lib/types"

type RhythmPanelProps = {
  scenes: SceneSlice[]
  rhythm: RhythmAdvice[]
}

const rhythmLabels: Record<RhythmAdvice["rhythmType"], string> = {
  slow: "长镜头",
  medium: "静态观察",
  fast: "快切",
  explosive: "蒙太奇",
}

export function RhythmPanel({ scenes, rhythm }: RhythmPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Rhythm</CardTitle>
        <CardDescription>每个场景的剪辑节奏建议</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rhythm.map((item) => {
          const scene = scenes.find((entry) => entry.id === item.sceneId)
          return (
            <div key={item.sceneId} className="rounded-md border border-white/10 bg-white/[0.025] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-100">{scene?.title ?? item.sceneId}</span>
                <Badge variant="outline" className="border-amber-300/20 bg-amber-300/10 text-amber-100">
                  {rhythmLabels[item.rhythmType]}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-zinc-300">{item.editingSuggestion}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{item.reason}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
