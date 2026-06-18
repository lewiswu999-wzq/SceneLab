"use client"

import { CopyIcon, DownloadIcon, RefreshCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { copyToClipboard } from "@/lib/export"
import { getVisualImageUrl } from "@/lib/visual-image-url"
import { getVisualProviderLabel } from "@/lib/visual-providers"
import type { ConceptPosterResult } from "@/lib/types"
import { posterTypeLabels } from "@/lib/visual-labels"

type PosterCardProps = {
  poster: ConceptPosterResult
  onSelect?: (posterId: string) => void
  onRegenerate?: (poster: ConceptPosterResult) => void
}

export function PosterCard({ poster, onSelect, onRegenerate }: PosterCardProps) {
  async function copyPrompt() {
    await copyToClipboard(poster.prompt)
    toast.success("已复制海报 Prompt")
  }

  return (
    <Card className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] ring-0">
      <div className="aspect-video bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getVisualImageUrl(poster.imageUrl)} alt={posterTypeLabels[poster.posterType]} className="h-full w-full object-cover" />
      </div>
      <CardContent className="grid gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-zinc-100">{posterTypeLabels[poster.posterType]}</div>
          <div className="rounded border border-white/10 px-2 py-0.5 text-xs text-zinc-500">{getVisualProviderLabel(poster.provider)}</div>
        </div>
        <p className="line-clamp-3 text-xs leading-5 text-zinc-400">{poster.prompt}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => onSelect?.(poster.id)}>
            选择
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => onRegenerate?.(poster)}>
            <RefreshCcwIcon data-icon="inline-start" />
            重生成
          </Button>
          <Button size="sm" variant="ghost" className="text-zinc-300" onClick={copyPrompt}>
            <CopyIcon data-icon="inline-start" />
            Prompt
          </Button>
          <a
            href={getVisualImageUrl(poster.imageUrl, true)}
            download={`scenelab-${poster.posterType}.svg`}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[0.8rem] font-medium text-zinc-300 hover:bg-muted hover:text-foreground"
          >
            <DownloadIcon className="size-3.5" />
            图片
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
