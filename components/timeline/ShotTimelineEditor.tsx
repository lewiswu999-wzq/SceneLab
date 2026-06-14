"use client"

import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { TimelineInspector } from "@/components/timeline/TimelineInspector"
import { TimelineShotCard } from "@/components/timeline/TimelineShotCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteTimelineShot,
  duplicateTimelineShot,
  insertTimelineShot,
  recalculateRhythmFromTimeline,
  reorderTimelineShots,
  updateTimelineShot,
} from "@/lib/storyboard-timeline"
import type { RhythmAdvice, StoryboardImageResult, StoryboardTimeline, TimelineShot } from "@/lib/types"

const shotSizes = ["大全景", "全景", "中景", "近景", "特写", "过肩镜头", "主观镜头"]
const cameraAngles = ["平视", "低机位", "高机位", "俯拍", "仰拍", "倾斜机位", "主观视角"]
const cameraMovements = ["静态观察", "推镜", "拉镜", "横移", "跟拍", "手持", "摇镜", "快速横移", "升降"]
const transitions: TimelineShot["transition"][] = ["cut", "fade", "dissolve", "match-cut", "jump-cut", "black"]

type NewShotDraft = {
  title: string
  sceneId: string
  durationSeconds: number
  shotSize: string
  cameraAngle: string
  cameraMovement: string
  transition: TimelineShot["transition"]
  note: string
  isClimax: boolean
}

type ShotTimelineEditorProps = {
  timeline: StoryboardTimeline
  images: StoryboardImageResult[]
  onChange: (timeline: StoryboardTimeline, rhythm?: RhythmAdvice[]) => void
}

export function ShotTimelineEditor({ timeline, images, onChange }: ShotTimelineEditorProps) {
  const [selectedShotId, setSelectedShotId] = useState(timeline.shots[0]?.id)
  const [insertOpen, setInsertOpen] = useState(false)
  const selectedShot = timeline.shots.find((shot) => shot.id === selectedShotId) ?? timeline.shots[0]
  const [draft, setDraft] = useState<NewShotDraft>(() => createDraft(selectedShot))

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
      id: `timeline-shot-${crypto.randomUUID()}`,
      sceneId: draft.sceneId || selectedShot.sceneId,
      order: selectedShot.order + 1,
      title: draft.title.trim() || "新镜头",
      durationSeconds: draft.durationSeconds,
      shotSize: draft.shotSize,
      cameraAngle: draft.cameraAngle,
      cameraMovement: draft.cameraMovement,
      emotionValue: selectedShot.emotionValue,
      rhythmValue: selectedShot.rhythmValue,
      transition: draft.transition,
      isClimax: draft.isClimax,
      isLocked: false,
      note: draft.note,
    }
    commit(insertTimelineShot(timeline, selectedShot.id, nextShot))
    setSelectedShotId(nextShot.id)
    setDraft(createDraft(nextShot))
    setInsertOpen(false)
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
        <CardDescription>
          {timeline.title} / {timeline.shots.length} 个镜头 / {timeline.totalDurationSeconds} 秒
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-zinc-300">总时长：{timeline.totalDurationSeconds}s</div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-white/[0.03] text-zinc-200"
                onClick={() => {
                  setDraft(createDraft(selectedShot))
                  setInsertOpen(true)
                }}
              >
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
          <NewShotForm
            open={insertOpen}
            draft={draft}
            sceneIds={timeline.shots.map((shot) => shot.sceneId)}
            onToggle={() => {
              const nextOpen = !insertOpen
              setInsertOpen(nextOpen)
              if (nextOpen) {
                setDraft(createDraft(selectedShot))
              }
            }}
            onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
            onSubmit={insertAfter}
          />
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

function createDraft(shot?: TimelineShot): NewShotDraft {
  return {
    title: "",
    sceneId: shot?.sceneId ?? "",
    durationSeconds: 6,
    shotSize: shot?.shotSize ?? "中景",
    cameraAngle: shot?.cameraAngle ?? "平视",
    cameraMovement: shot?.cameraMovement ?? "静态观察",
    transition: "cut",
    note: "",
    isClimax: false,
  }
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function NewShotForm({
  open,
  draft,
  sceneIds,
  onToggle,
  onDraftChange,
  onSubmit,
}: {
  open: boolean
  draft: NewShotDraft
  sceneIds: string[]
  onToggle: () => void
  onDraftChange: (patch: Partial<NewShotDraft>) => void
  onSubmit: () => void
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-100">插入新镜头</div>
          <div className="mt-1 text-xs text-zinc-500">写明镜头内容，并选择景别、机位、运动和转场。</div>
        </div>
        <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={onToggle}>
          {open ? "收起" : "填写新镜头"}
        </Button>
      </div>
      {open && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1 md:col-span-2 xl:col-span-3">
            <span className="text-xs text-zinc-400">镜头标题</span>
            <Input value={draft.title} onChange={(event) => onDraftChange({ title: event.target.value })} className="border-white/10 bg-black/25 text-sm text-zinc-200" />
          </label>
          <FieldSelect label="所属场景" value={draft.sceneId} options={uniqueValues(sceneIds)} onChange={(value) => onDraftChange({ sceneId: value })} />
          <FieldSelect label="景别" value={draft.shotSize} options={shotSizes} onChange={(value) => onDraftChange({ shotSize: value })} />
          <FieldSelect label="机位" value={draft.cameraAngle} options={cameraAngles} onChange={(value) => onDraftChange({ cameraAngle: value })} />
          <FieldSelect label="镜头运动" value={draft.cameraMovement} options={cameraMovements} onChange={(value) => onDraftChange({ cameraMovement: value })} />
          <FieldSelect label="转场" value={draft.transition} options={transitions} onChange={(value) => onDraftChange({ transition: value as TimelineShot["transition"] })} />
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">时长（秒）</span>
            <Input type="number" min={1} value={draft.durationSeconds} onChange={(event) => onDraftChange({ durationSeconds: Math.max(1, Number(event.target.value) || 1) })} className="border-white/10 bg-black/25 text-sm text-zinc-200" />
          </label>
          <label className="flex h-16 items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-zinc-300">
            <span>高潮点</span>
            <input type="checkbox" checked={draft.isClimax} onChange={(event) => onDraftChange({ isClimax: event.target.checked })} className="size-4 accent-teal-300" />
          </label>
          <label className="grid gap-1 md:col-span-2 xl:col-span-3">
            <span className="text-xs text-zinc-400">镜头内容 / 备注</span>
            <Textarea value={draft.note} onChange={(event) => onDraftChange({ note: event.target.value })} className="min-h-24 border-white/10 bg-black/25 text-sm text-zinc-200" />
          </label>
          <div className="flex justify-end md:col-span-2 xl:col-span-3">
            <Button type="button" className="bg-teal-300 text-zinc-950 hover:bg-teal-200" onClick={onSubmit}>
              <PlusIcon data-icon="inline-start" />
              插入到当前镜头后
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
