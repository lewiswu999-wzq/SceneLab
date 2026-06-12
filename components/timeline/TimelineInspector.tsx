"use client"

import { LockIcon, UnlockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { TimelineShot } from "@/lib/types"

const transitions: TimelineShot["transition"][] = ["cut", "fade", "dissolve", "match-cut", "jump-cut", "black"]
const shotSizes = ["大全景", "全景", "中景", "近景", "特写", "过肩镜头", "主观镜头"]
const cameraAngles = ["平视", "低机位", "高机位", "俯拍", "仰拍", "倾斜机位", "主观视角"]
const cameraMovements = ["静态观察", "推镜", "拉镜", "横移", "跟拍", "手持", "摇镜", "快速横移", "升降"]

type TimelineInspectorProps = {
  shot?: TimelineShot
  onChange: (patch: Partial<TimelineShot>) => void
}

export function TimelineInspector({ shot, onChange }: TimelineInspectorProps) {
  if (!shot) {
    return (
      <aside className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
        选择一个镜头后在这里编辑。
      </aside>
    )
  }

  const disabled = false

  return (
    <aside className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-100">镜头检查器</div>
          <div className="mt-1 text-xs text-zinc-500">#{shot.order} / {shot.sceneId}</div>
        </div>
        <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => onChange({ isLocked: !shot.isLocked })}>
          {shot.isLocked ? <LockIcon data-icon="inline-start" /> : <UnlockIcon data-icon="inline-start" />}
          {shot.isLocked ? "解锁" : "锁定"}
        </Button>
      </div>
      <FieldText label="标题" value={shot.title} disabled={disabled} onChange={(value) => onChange({ title: value })} />
      <FieldNumber label="时长（秒）" value={shot.durationSeconds} disabled={disabled} onChange={(value) => onChange({ durationSeconds: value })} />
      <FieldSelect label="景别" value={shot.shotSize} options={shotSizes} disabled={disabled} onChange={(value) => onChange({ shotSize: value })} />
      <FieldSelect label="机位" value={shot.cameraAngle ?? "平视"} options={cameraAngles} disabled={disabled} onChange={(value) => onChange({ cameraAngle: value })} />
      <FieldSelect label="镜头运动" value={shot.cameraMovement} options={cameraMovements} disabled={disabled} onChange={(value) => onChange({ cameraMovement: value })} />
      <FieldNumber label="情绪值" value={shot.emotionValue} disabled={disabled} onChange={(value) => onChange({ emotionValue: value })} />
      <FieldNumber label="节奏值" value={shot.rhythmValue} disabled={disabled} onChange={(value) => onChange({ rhythmValue: value })} />
      <label className="grid gap-1">
        <span className="text-xs text-zinc-400">转场</span>
        <select
          value={shot.transition}
          disabled={disabled}
          onChange={(event) => onChange({ transition: event.target.value as TimelineShot["transition"] })}
          className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 disabled:opacity-70"
        >
          {transitions.map((transition) => <option key={transition} value={transition}>{transition}</option>)}
        </select>
      </label>
      <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
        <span>高潮点</span>
        <input type="checkbox" checked={shot.isClimax} disabled={disabled} onChange={(event) => onChange({ isClimax: event.target.checked })} className="size-4 accent-teal-300" />
      </label>
      <label className="grid gap-1">
        <span className="text-xs text-zinc-400">备注</span>
        <Textarea value={shot.note ?? ""} disabled={disabled} onChange={(event) => onChange({ note: event.target.value })} className="min-h-24 border-white/10 bg-black/25 text-sm text-zinc-200 disabled:opacity-70" />
      </label>
    </aside>
  )
}

function FieldSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 disabled:opacity-70"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function FieldText({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="border-white/10 bg-black/25 text-sm text-zinc-200 disabled:opacity-70" />
    </label>
  )
}

function FieldNumber({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <Input type="number" value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} className="border-white/10 bg-black/25 text-sm text-zinc-200 disabled:opacity-70" />
    </label>
  )
}
