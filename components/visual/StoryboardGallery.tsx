"use client"

import { useMemo, useState } from "react"

import { StoryboardImageCard } from "@/components/visual/StoryboardImageCard"
import type { SceneAnalysis, StoryboardImageResult, StoryboardVisualSet } from "@/lib/types"

type StoryboardGalleryProps = {
  analysis: SceneAnalysis
  visualSets: StoryboardVisualSet[]
  onSelect: (sceneId: string, imageId: string) => void
  onLock: (sceneId: string, imageId: string) => void
  onRegenerate: (image: StoryboardImageResult) => void
}

export function StoryboardGallery({
  analysis,
  visualSets,
  onSelect,
  onLock,
  onRegenerate,
}: StoryboardGalleryProps) {
  const [sceneFilter, setSceneFilter] = useState("all")
  const filteredSets = useMemo(
    () => visualSets.filter((set) => sceneFilter === "all" || set.sceneId === sceneFilter),
    [sceneFilter, visualSets]
  )

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">分镜图库</h3>
          <p className="mt-1 text-xs text-zinc-500">按场景查看已选择和已锁定的视觉结果。</p>
        </div>
        <select
          value={sceneFilter}
          onChange={(event) => setSceneFilter(event.target.value)}
          className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-teal-300/60"
        >
          <option value="all">全部场景</option>
          {analysis.scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>{scene.title}</option>
          ))}
        </select>
      </div>
      {filteredSets.map((set) => {
        const scene = analysis.scenes.find((item) => item.id === set.sceneId)
        return (
          <div key={set.sceneId} className="grid gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="text-sm text-zinc-200">{scene?.title ?? set.sceneId}</div>
              <div className="font-mono text-xs text-zinc-500">
                已选择: {set.selectedImageId ?? "-"} / 已锁定: {set.lockedImageId ?? "-"}
              </div>
            </div>
            {set.images.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {set.images.map((image) => (
                  <StoryboardImageCard
                    key={image.id}
                    image={image}
                    sceneTitle={scene?.title}
                    onSelect={() => onSelect(set.sceneId, image.id)}
                    onLock={() => onLock(set.sceneId, image.id)}
                    onRegenerate={onRegenerate}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
                这个场景还没有生成分镜图。
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
