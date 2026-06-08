"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { editableModuleLabel } from "@/lib/editable-agent"
import type { EditableAgentRunResult } from "@/lib/types"

type EditHistoryPanelProps = {
  result: EditableAgentRunResult
}

export function EditHistoryPanel({ result }: EditHistoryPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="text-zinc-100">用户修改历史</CardTitle>
          <CardDescription>记录手动修改、锁定字段和备注。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {result.userEdits.length === 0 && <Empty text="暂无用户修改。" />}
          {result.userEdits.map((edit) => (
            <div key={edit.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">
              <div className="text-zinc-100">
                {editableModuleLabel(edit.module)} / {edit.targetId} / {edit.fieldPath}
              </div>
              <div className="mt-1 text-xs text-zinc-500">{edit.createdAt}</div>
              <div className="mt-2 text-zinc-400">
                {String(edit.oldValue)} {"->"} <span className="text-teal-100">{String(edit.newValue)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="text-zinc-100">Agent 重生成历史</CardTitle>
          <CardDescription>记录每次重生成保留了哪些用户修改，以及更新了哪些模块。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {result.regenerationHistory.length === 0 && <Empty text="暂无重生成历史。" />}
          {result.regenerationHistory.map((item) => (
            <article key={item.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">
              <div className="text-zinc-100">{item.summary}</div>
              <div className="mt-1 text-xs text-zinc-500">{item.createdAt}</div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Box title="保留字段" items={item.preservedFields.map((field) => `${editableModuleLabel(field.module)} / ${field.targetId} / ${field.fieldPath}`)} />
                <Box title="重生成模块" items={item.regeneratedModules.map((module) => editableModuleLabel(module))} />
              </div>
              {item.warnings.length > 0 && (
                <div className="mt-3 rounded-md border border-amber-300/20 bg-amber-300/10 p-2 text-amber-100">
                  {item.warnings.join(" / ")}
                </div>
              )}
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-500">{text}</div>
}

function Box({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="mt-2 flex flex-col gap-1">
        {items.map((item) => (
          <div key={item} className="font-mono text-xs text-zinc-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
