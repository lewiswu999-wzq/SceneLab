"use client"

import { CaptionsIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SceneAnalysis, StoryboardImageResult, StoryboardReel } from "@/lib/types"
import { getVisualImageUrl } from "@/lib/visual-image-url"

type StoryboardReelPlayerProps = {
  reel?: StoryboardReel
  analysis: SceneAnalysis
  images: StoryboardImageResult[]
}

export function StoryboardReelPlayer({ reel, analysis, images }: StoryboardReelPlayerProps) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [captionsEnabled, setCaptionsEnabled] = useState(reel?.captionsEnabled ?? true)
  const [intervalMs, setIntervalMs] = useState(reel?.autoPlayIntervalMs ?? 1800)
  const shots = reel?.shots ?? []
  const shot = shots[index]
  const image = useMemo(() => {
    if (!shot) {
      return undefined
    }
    const reelImageId = reel?.imageIds[index]
    return images.find((item) => item.id === reelImageId) ?? images.find((item) => item.sceneId === shot.sceneId && (item.isSelected || item.isLocked)) ?? images.find((item) => item.sceneId === shot.sceneId)
  }, [images, index, reel?.imageIds, shot])

  useEffect(() => {
    if (!playing || shots.length <= 1) {
      return
    }
    const timer = globalThis.setTimeout(() => {
      setIndex((current) => (current + 1) % shots.length)
    }, intervalMs)
    return () => globalThis.clearTimeout(timer)
  }, [index, intervalMs, playing, shots.length])

  if (!reel || shots.length === 0) {
    return (
      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="text-zinc-100">视觉预演</CardTitle>
          <CardDescription>生成时间线和分镜图后，可以在这里播放 Storyboard Reel。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-zinc-500">
            暂无视觉预演。
          </div>
        </CardContent>
      </Card>
    )
  }

  const scene = analysis.scenes.find((item) => item.id === shot.sceneId)

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">{reel.title}</CardTitle>
        <CardDescription>
          {shots.length} 个镜头 / {reel.totalDurationSeconds} 秒 / 本地分镜预演
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getVisualImageUrl(image.imageUrl)} alt={shot.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-500">暂无分镜图</div>
          )}
          {captionsEnabled && (
            <div className="absolute inset-x-4 bottom-4 rounded-md bg-black/65 p-3 backdrop-blur">
              <div className="text-sm font-medium text-zinc-100">#{shot.order} {shot.title}</div>
              <div className="mt-1 text-xs leading-5 text-zinc-300">{scene?.summary ?? shot.note}</div>
              <div className="mt-1 text-xs text-zinc-500">{shot.durationSeconds}s / {shot.cameraMovement}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button aria-label="上一镜" size="icon-sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => setIndex((current) => Math.max(0, current - 1))}>
              <SkipBackIcon />
            </Button>
            <Button size="sm" className="bg-teal-300 text-zinc-950 hover:bg-teal-200" onClick={() => setPlaying((current) => !current)}>
              {playing ? <PauseIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {playing ? "暂停" : "播放"}
            </Button>
            <Button aria-label="下一镜" size="icon-sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => setIndex((current) => Math.min(shots.length - 1, current + 1))}>
              <SkipForwardIcon />
            </Button>
            <Button size="sm" variant="ghost" className="text-zinc-300" onClick={() => setCaptionsEnabled((current) => !current)}>
              <CaptionsIcon data-icon="inline-start" />
              字幕
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            速度
            <input
              type="range"
              min={800}
              max={3200}
              step={200}
              value={intervalMs}
              onChange={(event) => setIntervalMs(Number(event.target.value))}
              className="accent-teal-300"
            />
            {intervalMs}ms
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
