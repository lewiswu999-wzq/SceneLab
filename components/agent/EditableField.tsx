"use client"

import { CheckIcon, LockIcon, PencilIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { EditLockBadge } from "@/components/agent/EditLockBadge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { EditableModule } from "@/lib/types"

export type EditableFieldProps = {
  module: EditableModule
  targetId: string
  fieldPath: string
  label?: string
  value: string | number
  type?: "text" | "textarea" | "number" | "select"
  options?: string[]
  onSave: (newValue: unknown, editNote?: string) => void
  locked?: boolean
  edited?: boolean
}

export function EditableField({
  fieldPath,
  label,
  value,
  type = "text",
  options,
  onSave,
  locked,
  edited,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const [editNote, setEditNote] = useState("")

  function cancel() {
    setDraft(String(value))
    setEditNote("")
    setEditing(false)
  }

  function save() {
    onSave(type === "number" ? Number(draft) : draft, editNote || undefined)
    setEditing(false)
  }

  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-zinc-500">{label ?? fieldPath}</div>
        <EditLockBadge locked={locked} edited={edited} />
      </div>

      {editing ? (
        <div className="grid gap-2">
          {type === "textarea" ? (
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-24 border-white/10 bg-black/30 text-zinc-100"
            />
          ) : type === "select" ? (
            <select
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-9 rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
            >
              {options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-9 rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
            />
          )}
          <input
            value={editNote}
            onChange={(event) => setEditNote(event.target.value)}
            placeholder="编辑备注，可选"
            className="h-8 rounded-md border border-white/10 bg-zinc-950 px-2 text-xs text-zinc-300"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
              <CheckIcon data-icon="inline-start" />
              保存并锁定
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} className="text-zinc-400">
              <XIcon data-icon="inline-start" />
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{String(value)}</div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="w-fit border-white/10 bg-white/[0.03] text-zinc-200">
            {locked ? <LockIcon data-icon="inline-start" /> : <PencilIcon data-icon="inline-start" />}
            修改
          </Button>
        </div>
      )}
    </div>
  )
}
