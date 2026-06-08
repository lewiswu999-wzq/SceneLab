import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SceneSlice } from "@/lib/types"

type SceneSlicesPanelProps = {
  scenes: SceneSlice[]
}

function Meter({ value, tone }: { value: number; tone: "emotion" | "rhythm" }) {
  const color = tone === "emotion" ? "bg-rose-300" : "bg-amber-300"

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={color} style={{ width: `${value}%`, height: "100%" }} />
      </div>
      <span className="w-8 text-right font-mono text-xs text-zinc-400">{value}</span>
    </div>
  )
}

export function SceneSlicesPanel({ scenes }: SceneSlicesPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Scene Slices</CardTitle>
        <CardDescription>拆分后的场景、地点、人物与情绪/节奏值</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {scenes.map((scene, index) => (
          <article
            key={scene.id}
            className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4 md:grid-cols-[3.5rem_1fr]"
          >
            <div className="font-mono text-sm text-zinc-500">S{index + 1}</div>
            <div className="grid gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-medium text-zinc-100">{scene.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {scene.location} / {scene.timeOfDay}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scene.characters.map((character) => (
                    <Badge key={character} variant="secondary" className="bg-white/10 text-zinc-200">
                      {character}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm leading-6 text-zinc-300">{scene.summary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">情绪值</span>
                  <Meter value={scene.emotionValue} tone="emotion" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">节奏值</span>
                  <Meter value={scene.rhythmValue} tone="rhythm" />
                </div>
              </div>
              <p className="border-l border-teal-300/30 pl-3 font-mono text-xs leading-5 text-teal-100/80">
                {scene.keyLine}
              </p>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
