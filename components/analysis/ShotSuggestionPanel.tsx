import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SceneSlice, ShotSuggestion } from "@/lib/types"

type ShotSuggestionPanelProps = {
  scenes: SceneSlice[]
  shotSuggestions: ShotSuggestion[]
}

export function ShotSuggestionPanel({ scenes, shotSuggestions }: ShotSuggestionPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Shot Suggestions</CardTitle>
        <CardDescription>按场景给出镜头、光影、声音和 AI 视频 prompt</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {shotSuggestions.map((shot) => {
          const scene = scenes.find((entry) => entry.id === shot.sceneId)
          const rows = [
            ["景别", shot.shotSize],
            ["机位", shot.cameraAngle],
            ["运动", shot.cameraMovement],
            ["光影", shot.lighting],
            ["色调", shot.colorTone],
            ["声音", shot.soundDesign],
          ]

          return (
            <article key={shot.sceneId} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-medium text-zinc-100">{scene?.title ?? shot.sceneId}</h3>
                <Badge variant="outline" className="w-fit border-rose-300/20 bg-rose-300/10 text-rose-100">
                  AI video ready
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-black/25 p-3">
                    <div className="text-xs text-zinc-500">{label}</div>
                    <div className="mt-1 text-sm leading-6 text-zinc-200">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-md border border-teal-300/15 bg-teal-300/10 p-3 font-mono text-xs leading-6 text-teal-100">
                {shot.aiVideoPrompt}
              </div>
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}
