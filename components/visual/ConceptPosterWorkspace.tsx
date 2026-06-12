"use client"

import { toast } from "sonner"

import { ConceptPosterGenerator } from "@/components/visual/ConceptPosterGenerator"
import { PosterCard } from "@/components/visual/PosterCard"
import type { ConceptPosterResult, LockedVisualStyle, SceneAnalysis, VisualAgentState } from "@/lib/types"

type ConceptPosterWorkspaceProps = {
  analysis: SceneAnalysis
  state: VisualAgentState
  lockedStyle?: LockedVisualStyle
  onChange: (state: VisualAgentState, logs?: string[]) => void
}

export function ConceptPosterWorkspace({ analysis, state, lockedStyle, onChange }: ConceptPosterWorkspaceProps) {
  function addPoster(poster: ConceptPosterResult) {
    onChange({ ...state, posters: [...state.posters, poster] }, ["generateConceptPoster"])
  }

  function selectPoster(posterId: string) {
    onChange({
      ...state,
      posters: state.posters.map((poster) => ({
        ...poster,
        isSelected: poster.id === posterId,
      })),
    })
    toast.success("已选择概念海报")
  }

  return (
    <div className="grid gap-5">
      <ConceptPosterGenerator
        analysis={analysis}
        lockedStyle={lockedStyle}
        consistencyPack={state.characterConsistencyPack}
        existingPosters={state.posters}
        onGenerated={addPoster}
        onReuse={(poster) => selectPoster(poster.id)}
      />
      {state.posters.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.posters.map((poster) => (
            <PosterCard
              key={poster.id}
              poster={poster}
              onSelect={selectPoster}
              onRegenerate={() => toast.info("保留当前 prompt，在上方重新生成一张即可。")}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
          暂无概念海报。
        </div>
      )}
    </div>
  )
}
