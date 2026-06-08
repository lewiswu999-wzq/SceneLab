"use client"

import { RotateCcwIcon, UnlockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { editableModuleLabel, restoreUserEdit, unlockField } from "@/lib/editable-agent"
import type { EditableAgentRunResult, LockedField, UserEditRecord } from "@/lib/types"

type UserEditPanelProps = {
  result: EditableAgentRunResult
  onChange: (result: EditableAgentRunResult) => void
}

function sameField(edit: UserEditRecord, field: LockedField) {
  return edit.module === field.module && edit.targetId === field.targetId && edit.fieldPath === field.fieldPath
}

export function UserEditPanel({ result, onChange }: UserEditPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">用户修改</CardTitle>
        <CardDescription>所有用户编辑会自动锁定，Agent 后续重生成不会覆盖。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {result.userEdits.length === 0 && (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-500">
            暂无用户修改。
          </div>
        )}
        {result.userEdits.map((edit) => {
          const field = result.lockedFields.find((item) => sameField(edit, item))
          return (
            <article key={edit.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {editableModuleLabel(edit.module)} / {edit.targetId} / {edit.fieldPath}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{edit.createdAt}</div>
                </div>
                <div className="text-xs text-teal-100">{field ? "已锁定" : "已解锁"}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ValueBox label="原始内容" value={edit.oldValue} />
                <ValueBox label="修改后" value={edit.newValue} />
              </div>
              {edit.editNote && <p className="mt-3 text-sm text-zinc-400">备注：{edit.editNote}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {field && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onChange(unlockField(result, field))}
                    className="border-white/10 bg-white/[0.03] text-zinc-200"
                  >
                    <UnlockIcon data-icon="inline-start" />
                    解锁
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(restoreUserEdit(result, edit))}
                  className="text-zinc-400"
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  恢复 AI 原始内容
                </Button>
              </div>
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ValueBox({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {String(value)}
      </div>
    </div>
  )
}
