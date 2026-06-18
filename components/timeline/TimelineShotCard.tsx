"use client"

import { FlameIcon, LockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TimelineShot } from "@/lib/types"
import { getVisualImageUrl } from "@/lib/visual-image-url"
import { getShotSizeLabel, transitionLabels } from "@/lib/visual-labels"

type TimelineShotCardProps = {
  shot: TimelineShot
  selected: boolean
  imageUrl?: string
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function TimelineShotCard({
  shot,
  selected,
  imageUrl,
  onSelect,
  onMoveUp,
  onMoveDown,
}: TimelineShotCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect()
        }
      }}
      data-selected={selected}
      className="grid min-w-64 gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-left transition-colors hover:bg-white/[0.05] data-[selected=true]:border-teal-300/50 data-[selected=true]:bg-teal-300/10"
    >
      <div className="aspect-video overflow-hidden rounded-md bg-zinc-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getVisualImageUrl(imageUrl)} alt={shot.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-zinc-500">暂无画面</div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-zinc-100">#{shot.order} {shot.title}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {shot.durationSeconds} 秒 / {transitionLabels[shot.transition]}
          </div>
        </div>
        <div className="flex gap-1 text-amber-200">
          {shot.isClimax && <FlameIcon className="size-4" />}
          {shot.isLocked && <LockIcon className="size-4" />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <span>{getShotSizeLabel(shot.shotSize)}</span>
        <span>{shot.cameraAngle ?? "平视"}</span>
        <span>{shot.cameraMovement}</span>
        <span>情绪 {shot.emotionValue}</span>
        <span>节奏 {shot.rhythmValue}</span>
      </div>
      <div className="flex gap-2">
        <Button size="xs" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-300" onClick={(event) => { event.stopPropagation(); onMoveUp() }}>
          上移
        </Button>
        <Button size="xs" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-300" onClick={(event) => { event.stopPropagation(); onMoveDown() }}>
          下移
        </Button>
      </div>
    </div>
  )
}
