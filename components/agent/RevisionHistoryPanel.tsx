"use client"

import { useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RevisedAgentRunResult, RevisionRecord } from "@/lib/types"

function diffSummary(record: RevisionRecord) {
  const beforeScenes = record.beforeSnapshot.scenes?.length
  const afterScenes = record.afterSnapshot.scenes?.length
  const beforePeak = record.beforeSnapshot.scenes
    ? Math.max(...record.beforeSnapshot.scenes.map((scene) => scene.emotionValue))
    : undefined
  const afterPeak = record.afterSnapshot.scenes
    ? Math.max(...record.afterSnapshot.scenes.map((scene) => scene.emotionValue))
    : undefined

  return [
    beforeScenes && afterScenes ? `场景数：${beforeScenes} -> ${afterScenes}` : undefined,
    beforePeak && afterPeak ? `情绪峰值：${beforePeak} -> ${afterPeak}` : undefined,
    `模块：${record.changedModules.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" / ")
}

type RevisionHistoryPanelProps = {
  result: RevisedAgentRunResult
}

export function RevisionHistoryPanel({ result }: RevisionHistoryPanelProps) {
  const [selectedId, setSelectedId] = useState(result.revisionHistory.at(-1)?.id)
  const selected = result.revisionHistory.find((record) => record.id === selectedId)

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">版本历史</CardTitle>
        <CardDescription>查看每次反馈、调整模块和修改前后差异摘要。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-2">
          {result.revisionHistory.length === 0 && (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-500">
              还没有修正记录。
            </div>
          )}
          {result.revisionHistory.map((record, index) => (
            <button
              key={record.id}
              type="button"
              onClick={() => setSelectedId(record.id)}
              className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-zinc-300 data-[active=true]:border-teal-300/40 data-[active=true]:bg-teal-300/10"
              data-active={selectedId === record.id}
            >
              <div className="text-zinc-100">版本 {index + 1}</div>
              <div className="mt-1 text-xs text-zinc-500">{record.createdAt}</div>
              <div className="mt-2 line-clamp-2 text-xs text-zinc-400">{record.feedback.feedbackText}</div>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 p-4">
          {selected ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs text-zinc-500">用户反馈</div>
                <p className="mt-1 text-sm leading-6 text-zinc-200">{selected.feedback.feedbackText}</p>
              </div>
              <div>
                <div className="text-xs text-zinc-500">修正摘要</div>
                <p className="mt-1 text-sm leading-6 text-zinc-200">{selected.summary}</p>
              </div>
              <div>
                <div className="text-xs text-zinc-500">修改前后差异摘要</div>
                <p className="mt-1 font-mono text-xs leading-6 text-teal-100">{diffSummary(selected)}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">选择一个历史版本查看详情。</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
