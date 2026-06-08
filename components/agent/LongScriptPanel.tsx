"use client"

import { FileStackIcon, SplitIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { ChunkAnalysisPanel } from "@/components/agent/ChunkAnalysisPanel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { detectLongScript, runLongScriptSceneLabAgent } from "@/lib/scenelab-agent"
import type { LongScriptAnalysisResult, TextInput } from "@/lib/types"

type LongScriptPanelProps = {
  input?: TextInput
  onApplyAnalysis: (result: LongScriptAnalysisResult) => void
}

export function LongScriptPanel({ input, onApplyAnalysis }: LongScriptPanelProps) {
  const [forceLongScript, setForceLongScript] = useState(false)
  const [result, setResult] = useState<LongScriptAnalysisResult>()
  const charCount = input?.sourceText.length ?? 0
  const autoDetected = useMemo(() => (input ? detectLongScript(input) : false), [input])

  function runChunks() {
    if (!input) {
      return
    }
    const nextResult = runLongScriptSceneLabAgent(input, forceLongScript)
    setResult(nextResult)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="text-zinc-100">长剧本分段</CardTitle>
          <CardDescription>自动识别长文本，拆 chunk 后局部分析，再合并全局报告。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              当前字数：<span className="font-mono text-teal-100">{charCount}</span>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              自动识别：{autoDetected ? "长剧本模式" : "普通文本"}
            </div>
            <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
              <span>启用长剧本模式</span>
              <input
                type="checkbox"
                checked={forceLongScript || autoDetected}
                disabled={autoDetected}
                onChange={(event) => setForceLongScript(event.target.checked)}
                className="size-4 accent-teal-300"
              />
            </label>
          </div>

          <div className="rounded-md border border-white/10 bg-black/25 p-3 text-sm leading-6 text-zinc-400">
            分段策略：优先按“第X场 / 场景 / INT. / EXT. / 空行”切分；每段尽量控制在
            1500-2500 个中文字符，并为每段生成局部摘要、局部人物、情绪峰值和连贯性提示。
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runChunks} disabled={!input} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
              <SplitIcon data-icon="inline-start" />
              运行分段分析
            </Button>
            {result && (
              <Button
                variant="outline"
                onClick={() => onApplyAnalysis(result)}
                className="border-white/10 bg-white/[0.03] text-zinc-200"
              >
                <FileStackIcon data-icon="inline-start" />
                应用全局合并报告
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
            <CardHeader>
              <CardTitle className="text-zinc-100">Global Merge</CardTitle>
              <CardDescription>
                {result.isLongScript ? "已启用长剧本模式" : "普通文本预览模式"} / {result.chunks.length} 个 chunk
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {result.chunkResults.map((chunkResult) => (
                <div key={chunkResult.chunk.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div className="font-medium text-zinc-100">{chunkResult.chunk.title}</div>
                  <div className="mt-1 text-zinc-500">
                    {chunkResult.chunk.text.length} 字 / 预计场景 {chunkResult.chunk.estimatedSceneCount}
                  </div>
                  <p className="mt-2 line-clamp-2 text-zinc-400">{chunkResult.localSummary}</p>
                </div>
              ))}
              <div className="rounded-md border border-teal-300/15 bg-teal-300/10 p-3 text-sm leading-6 text-teal-100">
                {result.globalMergeNotes.join(" / ")}
              </div>
            </CardContent>
          </Card>
          <ChunkAnalysisPanel chunkResults={result.chunkResults} />
        </>
      )}
    </div>
  )
}
