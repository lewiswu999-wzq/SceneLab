"use client"

import { CheckIcon, CopyIcon, EyeIcon, LockIcon, RefreshCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { copyToClipboard } from "@/lib/export"
import { getVisualImageUrl } from "@/lib/visual-image-url"
import { getVisualProviderLabel } from "@/lib/visual-providers"
import type { StoryboardImageResult } from "@/lib/types"

type StoryboardImageCardProps = {
  image: StoryboardImageResult
  sceneTitle?: string
  onSelect?: (imageId: string) => void
  onLock?: (imageId: string) => void
  onRegenerate?: (image: StoryboardImageResult) => void
}

export function StoryboardImageCard({
  image,
  sceneTitle,
  onSelect,
  onLock,
  onRegenerate,
}: StoryboardImageCardProps) {
  async function copyPrompt() {
    await copyToClipboard(image.prompt)
    toast.success("已复制分镜 Prompt")
  }

  return (
    <Card className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] ring-0">
      <div className="relative aspect-video bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getVisualImageUrl(image.imageUrl)} alt={sceneTitle ?? image.sceneId} className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3 flex gap-2">
          {image.isSelected && <StatePill label="已选择" tone="teal" />}
          {image.isLocked && <StatePill label="已锁定" tone="amber" />}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-3 text-sm text-zinc-100">
          <span className="truncate">{sceneTitle ?? image.sceneId}</span>
          <span className="shrink-0 rounded border border-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
            {getVisualProviderLabel(image.provider)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="line-clamp-3 text-xs leading-5 text-zinc-400">{image.prompt}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => onSelect?.(image.id)}>
            <CheckIcon data-icon="inline-start" />
            选择
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => onLock?.(image.id)}>
            <LockIcon data-icon="inline-start" />
            锁定
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => onRegenerate?.(image)}>
            <RefreshCcwIcon data-icon="inline-start" />
            重生成
          </Button>
          <Button size="sm" variant="ghost" className="text-zinc-300" onClick={copyPrompt}>
            <CopyIcon data-icon="inline-start" />
            Prompt
          </Button>
          <Button size="sm" variant="ghost" className="text-zinc-300" onClick={() => toast.info(image.generationNote ?? "本地预览结果")}>
            <EyeIcon data-icon="inline-start" />
            详情
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StatePill({ label, tone }: { label: string; tone: "teal" | "amber" }) {
  return (
    <span
      className={
        tone === "teal"
          ? "rounded bg-teal-300/90 px-2 py-1 text-[11px] font-semibold text-zinc-950"
          : "rounded bg-amber-300/90 px-2 py-1 text-[11px] font-semibold text-zinc-950"
      }
    >
      {label}
    </span>
  )
}
