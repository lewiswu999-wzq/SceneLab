"use client"

import { FilmIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StoryboardReelPlayer } from "@/components/visual/StoryboardReelPlayer"
import { buildStoryboardReel } from "@/lib/concept-visuals"
import type { SceneAnalysis, VisualAgentState } from "@/lib/types"
import { getAllStoryboardImages } from "@/lib/visual-agent-state"

type StoryboardReelWorkspaceProps = {
  analysis: SceneAnalysis
  state: VisualAgentState
  onChange: (state: VisualAgentState, logs?: string[]) => void
}

export function StoryboardReelWorkspace({ analysis, state, onChange }: StoryboardReelWorkspaceProps) {
  const images = getAllStoryboardImages(state)
  const latestReel = state.reels.at(-1)

  function generateReel() {
    if (!state.timeline) {
      toast.error("需要先生成或编辑镜头时间线")
      return
    }
    const reel = buildStoryboardReel(state.timeline, images)
    onChange({ ...state, reels: [...state.reels, reel] }, ["buildStoryboardReel"])
    toast.success("视觉预演已生成")
  }

  return (
    <div className="grid gap-5">
      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <FilmIcon />
            视觉预演
          </CardTitle>
          <CardDescription>用时间线和已生成分镜图播放 Storyboard Reel，不做真实视频合成。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-400">
            分镜图 {images.length} 张 / Reel {state.reels.length} 个
          </div>
          <Button onClick={generateReel} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
            <FilmIcon data-icon="inline-start" />
            生成视觉预演
          </Button>
        </CardContent>
      </Card>
      <StoryboardReelPlayer reel={latestReel} analysis={analysis} images={images} />
    </div>
  )
}
