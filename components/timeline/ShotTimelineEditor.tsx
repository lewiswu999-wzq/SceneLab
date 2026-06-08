"use client"

import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { TimelineInspector } from "@/components/timeline/TimelineInspector"
import { TimelineShotCard } from "@/components/timeline/TimelineShotCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deleteTimelineShot,
  duplicateTimelineShot,
  insertTimelineShot,
  recalculateRhythmFromTimeline,
  reorderTimelineShots,
  updateTimelineShot,
} from "@/lib/storyboard-timeline"
import type { RhythmAdvice, StoryboardImageResult, StoryboardTimeline, TimelineShot } from "@/lib/types"

type ShotTimelineEditorProps = {
  timeline: StoryboardTimeline
  images: StoryboardImageResult[]
  onChange: (timeline: StoryboardTimeline, rhythm?: RhythmAdvice[]) => void
}

export function ShotTimelineEditor({ timeline, images, onChange }: ShotTimelineEditorProps) {
  const [selectedShotId, setSelectedShotId] = useState(timeline.shots[0]?.id)
  const selectedShot = timeline.shots.find((shot) => shot.id === selectedShotId) ?? timeline.shots[0]

  function commit(next: StoryboardTimeline) {
    onChange(next, recalculateRhythmFromTimeline(next))
  }

  function imageForShot(shot: TimelineShot) {
    const linked = shot.linkedStoryboardImageId ? images.find((image) => image.id === shot.linkedStoryboardImageId) : undefined
    return linked ?? images.find((image) => image.sceneId === shot.sceneId && (image.isSelected || image.isLocked)) ?? images.find((image) => image.sceneId === shot.sceneId)
  }

  function insertAfter() {
    if (!selectedShot) {
      return
    }
    const nextShot: TimelineShot = {
      ...duplicateTimelineShot(selectedShot),
      id: `timeline-shot-${crypto.randomUUID()}`,
      title: "新镜头",
      durationSeconds: 6,
      isLocked: false,
      note: "手动插入的新镜头",
    }
    commit(insertTimelineShot(timeline, selectedShot.id, nextShot))
    setSelectedShotId(nextShot.id)
    toast.success("已插入新镜头")
  }

  function duplicateSelected() {
    if (!selectedShot) {
      return
    }
    const copy = duplicateTimelineShot(selectedShot)
    commit(insertTimelineShot(timeline, selectedShot.id, copy))
    setSelectedShotId(copy.id)
    toast.success("已复制镜头")
  }

  function removeSelected() {
    if (!selectedShot) {
      return
    }
    const next = deleteTimelineShot(timeline, selectedShot.id)
    commit(next)
    setSelectedShotId(next.shots[0]?.id)
    toast.success(next === timeline ? "锁定镜头不能删除" : "已删除镜头")
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">镜头时间线</CardTitle>
        <CardDescription>{timeline.title} / {timeline.shots.length} shots / {timeline.totalDurationSeconds}s</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-zinc-300">总时长：{timeline.totalDurationSeconds}s</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={insertAfter}>
                <PlusIcon data-icon="inline-start" />
                插入
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={duplicateSelected}>
                <CopyIcon data-icon="inline-start" />
                复制
              </Button>
              <Button size="sm" variant="destructive" onClick={removeSelected}>
                <Trash2Icon data-icon="inline-start" />
                删除
              </Button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {timeline.shots.map((shot, index) => (
              <TimelineShotCard
                key={shot.id}
                shot={shot}
                selected={shot.id === selectedShot?.id}
                imageUrl={imageForShot(shot)?.imageUrl}
                onSelect={() => setSelectedShotId(shot.id)}
                onMoveUp={() => commit(reorderTimelineShots(timeline, index, Math.max(0, index - 1)))}
                onMoveDown={() => commit(reorderTimelineShots(timeline, index, Math.min(timeline.shots.length - 1, index + 1)))}
              />
            ))}
          </div>
        </div>
        <TimelineInspector
          shot={selectedShot}
          onChange={(patch) => {
            if (!selectedShot) {
              return
            }
            commit(updateTimelineShot(timeline, selectedShot.id, patch))
          }}
        />
      </CardContent>
    </Card>
  )
}
