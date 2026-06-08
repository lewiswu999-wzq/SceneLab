"use client"

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChunkAnalysisResult } from "@/lib/types"

type ChunkAnalysisPanelProps = {
  chunkResults: ChunkAnalysisResult[]
}

export function ChunkAnalysisPanel({ chunkResults }: ChunkAnalysisPanelProps) {
  const [openIds, setOpenIds] = useState<string[]>(chunkResults.slice(0, 1).map((result) => result.chunk.id))

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Chunk Analysis</CardTitle>
        <CardDescription>每个段落的局部人物、情绪峰值和连贯性提示。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {chunkResults.map((result) => {
          const open = openIds.includes(result.chunk.id)
          return (
            <article key={result.chunk.id} className="rounded-lg border border-white/10 bg-white/[0.025]">
              <button
                type="button"
                onClick={() => toggle(result.chunk.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <div className="font-medium text-zinc-100">{result.chunk.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {result.chunk.text.length} 字 / 局部场景 {result.localAnalysis.scenes.length}
                  </div>
                </div>
                {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>
              {open && (
                <div className="grid gap-4 border-t border-white/10 p-4">
                  <p className="text-sm leading-6 text-zinc-300">{result.localSummary}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedCharacters.map((character) => (
                      <Badge key={`${result.chunk.id}-${character.name}`} variant="secondary" className="bg-white/10 text-zinc-200">
                        {character.name}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="border-rose-300/20 bg-rose-300/10 text-rose-100">
                      情绪峰值 {result.localEmotionPeak}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {result.continuityNotes.map((note) => (
                      <div key={note} className="rounded-md border border-white/10 bg-black/25 p-3 text-sm text-zinc-400">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}
