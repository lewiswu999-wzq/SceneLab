"use client"

import { ArrowLeftIcon, BotIcon, FileJsonIcon, FileTextIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { CharacterPanel } from "@/components/analysis/CharacterPanel"
import { EmotionCurvePanel } from "@/components/analysis/EmotionCurvePanel"
import { ExportPanel } from "@/components/analysis/ExportPanel"
import { OverviewPanel } from "@/components/analysis/OverviewPanel"
import { RelationshipPanel } from "@/components/analysis/RelationshipPanel"
import { RhythmPanel } from "@/components/analysis/RhythmPanel"
import { SceneSlicesPanel } from "@/components/analysis/SceneSlicesPanel"
import { ShotSuggestionPanel } from "@/components/analysis/ShotSuggestionPanel"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { STORAGE_KEY } from "@/lib/constants"
import { copyToClipboard, exportAnalysisToJSON, exportAnalysisToMarkdown } from "@/lib/export"
import { sampleAnalysis } from "@/lib/sample-data"
import type { SceneAnalysis } from "@/lib/types"

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function AnalysisLayout() {
  const router = useRouter()
  const [analysis] = useState<SceneAnalysis>(() => {
    if (typeof window === "undefined") {
      return sampleAnalysis
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return sampleAnalysis
    }

    try {
      const parsed = JSON.parse(stored) as { analysis?: SceneAnalysis }
      return parsed.analysis ?? sampleAnalysis
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return sampleAnalysis
    }
  })
  const markdown = useMemo(() => exportAnalysisToMarkdown(analysis), [analysis])
  const json = useMemo(() => exportAnalysisToJSON(analysis), [analysis])

  async function handleCopy() {
    await copyToClipboard(markdown)
    toast.success("已复制完整分析")
  }

  function handleExportMarkdown() {
    downloadFile("scenelab-analysis.md", markdown, "text/markdown;charset=utf-8")
    toast.success("Markdown 已导出")
  }

  function handleExportJSON() {
    downloadFile("scenelab-analysis.json", json, "application/json;charset=utf-8")
    toast.success("JSON 已导出")
  }

  return (
    <main className="min-h-screen bg-background text-zinc-100">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 pb-8 sm:px-6 lg:px-8">
        <header className="app-titlebar -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="w-fit text-zinc-400 hover:text-zinc-100"
              >
                <ArrowLeftIcon data-icon="inline-start" />
                重新分析
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-zinc-50">
                  剧本分析
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  {analysis.overview.summary}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/agent")}
                className="border-primary/20 bg-primary/10 text-primary"
              >
                <BotIcon data-icon="inline-start" />
                打开 Agent 工作台
              </Button>
              <Button
                variant="outline"
                onClick={handleExportMarkdown}
                className="border-white/10 bg-white/[0.03] text-zinc-200"
              >
                <FileTextIcon data-icon="inline-start" />
                导出 Markdown
              </Button>
              <Button
                variant="outline"
                onClick={handleExportJSON}
                className="border-white/10 bg-white/[0.03] text-zinc-200"
              >
                <FileJsonIcon data-icon="inline-start" />
                导出 JSON
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 text-xs text-zinc-500 sm:grid-cols-4">
          <div>文本类型：{analysis.meta.textType}</div>
          <div>分析深度：{analysis.meta.analysisDepth}</div>
          <div>风格：{analysis.meta.style}</div>
          <div>
            来源：{analysis.meta.provider ?? "mock"} / {analysis.meta.model ?? "local"} /{" "}
            {analysis.meta.generatedAt}
          </div>
          {analysis.meta.fallbackReason && (
            <div className="sm:col-span-4 text-amber-200">
              fallback：{analysis.meta.fallbackReason}
            </div>
          )}
        </section>
        <Separator className="bg-white/10" />

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <OverviewPanel overview={analysis.overview} />
            <SceneSlicesPanel scenes={analysis.scenes} />
            <ShotSuggestionPanel scenes={analysis.scenes} shotSuggestions={analysis.shotSuggestions} />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <EmotionCurvePanel scenes={analysis.scenes} />
            <RhythmPanel scenes={analysis.scenes} rhythm={analysis.rhythm} />
            <CharacterPanel characters={analysis.characters} relationships={analysis.relationships} />
            <RelationshipPanel characters={analysis.characters} relationships={analysis.relationships} />
            <ExportPanel
              onCopy={handleCopy}
              onExportMarkdown={handleExportMarkdown}
              onExportJSON={handleExportJSON}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
