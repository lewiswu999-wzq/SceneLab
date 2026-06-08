"use client"

import { Axis3DIcon, FileJsonIcon, FileTextIcon, MoveRightIcon, ScanEyeIcon, ShieldCheckIcon } from "lucide-react"
import type { ElementType } from "react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { StoryboardGallery } from "@/components/visual/StoryboardGallery"
import { StoryboardImageGenerator } from "@/components/visual/StoryboardImageGenerator"
import { copyToClipboard, exportVisualStoryboardToJSON, exportVisualStoryboardToMarkdown } from "@/lib/export"
import { buildSceneContinuityCue, SCENELAB_CONTINUITY_GUIDE } from "@/lib/scenelab-storyboard-craft"
import type { SceneAnalysis, StoryboardImageResult, VisualAgentState } from "@/lib/types"
import { appendStoryboardImage } from "@/lib/visual-agent-state"

type VisualStoryboardPanelProps = {
  analysis: SceneAnalysis
  state: VisualAgentState
  onChange: (state: VisualAgentState, logs?: string[]) => void
}

export function VisualStoryboardPanel({ analysis, state, onChange }: VisualStoryboardPanelProps) {
  const [sceneId, setSceneId] = useState(analysis.scenes[0]?.id ?? "")
  const currentScene = analysis.scenes.find((scene) => scene.id === sceneId) ?? analysis.scenes[0]
  const currentShot = analysis.shotSuggestions.find((shot) => shot.sceneId === currentScene.id) ?? analysis.shotSuggestions[0]
  const currentVisualSet = state.storyboardVisualSets.find((set) => set.sceneId === sceneId)

  function updateImage(sceneIdValue: string, imageId: string, patch: Partial<StoryboardImageResult>) {
    const nextSets = state.storyboardVisualSets.map((set) =>
      set.sceneId === sceneIdValue
        ? {
            ...set,
            selectedImageId: patch.isSelected ? imageId : set.selectedImageId,
            lockedImageId: patch.isLocked ? imageId : set.lockedImageId,
            images: set.images.map((image) =>
              image.id === imageId
                ? { ...image, ...patch }
                : {
                    ...image,
                    isSelected: patch.isSelected ? false : image.isSelected,
                  }
            ),
          }
        : set
    )
    onChange({ ...state, storyboardVisualSets: nextSets }, patch.isLocked ? ["lockStoryboardImage"] : ["selectStoryboardImage"])
  }

  function onGenerated(image: StoryboardImageResult) {
    onChange(appendStoryboardImage(state, image.sceneId, image), ["generateStoryboardImage"])
  }

  async function exportMarkdown() {
    await copyToClipboard(exportVisualStoryboardToMarkdown(state))
    toast.success("已复制视觉分镜 Markdown")
  }

  async function exportJSON() {
    await copyToClipboard(exportVisualStoryboardToJSON(state))
    toast.success("已复制视觉分镜 JSON")
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="text-sm font-medium text-zinc-100">{currentScene.title}</div>
            <div className="text-xs leading-5 text-zinc-500">
              {currentScene.location} / {currentScene.timeOfDay} / {currentShot.shotSize} / {currentShot.cameraAngle}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sceneId}
              onChange={(event) => setSceneId(event.target.value)}
              className="h-8 max-w-[260px] rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-teal-300/60"
            >
              {analysis.scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>{scene.title}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={exportMarkdown}>
              <FileTextIcon data-icon="inline-start" />
              Markdown
            </Button>
            <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={exportJSON}>
              <FileJsonIcon data-icon="inline-start" />
              JSON
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <ContinuityItem icon={Axis3DIcon} label="180度轴线" value={currentScene.characters.length >= 2 ? "保持同侧关系" : "保持运动方向"} />
          <ContinuityItem icon={MoveRightIcon} label="动作匹配" value={currentShot.cameraMovement} />
          <ContinuityItem icon={ScanEyeIcon} label="视线匹配" value={currentScene.characters.join(" / ") || "无明确角色"} />
          <ContinuityItem icon={ShieldCheckIcon} label="形象连续" value="默认同一演员身份" />
        </div>

        <div className="grid gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 lg:grid-cols-[1fr_280px]">
          <p className="text-xs leading-5 text-zinc-400">
            {buildSceneContinuityCue(currentScene, currentShot)}
          </p>
          <div className="grid gap-1 border-t border-white/10 pt-3 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
            {SCENELAB_CONTINUITY_GUIDE.slice(0, 4).map((rule) => (
              <div key={rule} className="line-clamp-1 text-[11px] leading-5 text-zinc-600">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      <StoryboardImageGenerator
        analysis={analysis}
        sceneId={sceneId}
        consistencyPack={state.characterConsistencyPack}
        existingImages={currentVisualSet?.images ?? []}
        lockedReferenceImageIds={state.storyboardVisualSets.flatMap((set) => set.lockedImageId ? [set.lockedImageId] : [])}
        onGenerated={onGenerated}
        onReuse={(image) => updateImage(image.sceneId, image.id, { isSelected: true })}
      />
      <StoryboardGallery
        analysis={analysis}
        visualSets={state.storyboardVisualSets}
        onSelect={(targetSceneId, imageId) => updateImage(targetSceneId, imageId, { isSelected: true })}
        onLock={(targetSceneId, imageId) => updateImage(targetSceneId, imageId, { isSelected: true, isLocked: true })}
        onRegenerate={(image) => {
          setSceneId(image.sceneId)
          toast.info("已切换到该场景，可以基于当前 Prompt 继续调整。")
        }}
      />
    </div>
  )
}

function ContinuityItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#0c0c0d] px-3 py-2">
      <Icon className="size-4 text-teal-200" />
      <div className="min-w-0">
        <div className="text-[11px] text-zinc-600">{label}</div>
        <div className="truncate text-xs text-zinc-300">{value}</div>
      </div>
    </div>
  )
}
