import { createCharacterConsistencyPack } from "@/lib/character-consistency"
import { buildTimelineFromAnalysis } from "@/lib/storyboard-timeline"
import type { SceneAnalysis, VisualAgentState } from "@/lib/types"

export function createInitialVisualAgentState(analysis: SceneAnalysis): VisualAgentState {
  return {
    storyboardVisualSets: analysis.scenes.map((scene) => ({ sceneId: scene.id, images: [] })),
    storyboardComparisonSets: [],
    characterConsistencyPack: createCharacterConsistencyPack(analysis.characters, analysis.meta.style),
    timeline: buildTimelineFromAnalysis(analysis),
    posters: [],
    reels: [],
  }
}

export function ensureVisualAgentState(
  analysis: SceneAnalysis,
  state?: Partial<VisualAgentState>
): VisualAgentState {
  const initial = createInitialVisualAgentState(analysis)
  return {
    storyboardVisualSets: state?.storyboardVisualSets?.length ? state.storyboardVisualSets : initial.storyboardVisualSets,
    storyboardComparisonSets: state?.storyboardComparisonSets ?? initial.storyboardComparisonSets,
    characterConsistencyPack: state?.characterConsistencyPack ?? initial.characterConsistencyPack,
    timeline: state?.timeline ?? initial.timeline,
    posters: state?.posters ?? initial.posters,
    reels: state?.reels ?? initial.reels,
  }
}

export function getAllStoryboardImages(state: VisualAgentState) {
  return state.storyboardVisualSets.flatMap((set) => set.images)
}

export function appendStoryboardImage(state: VisualAgentState, sceneId: string, image: VisualAgentState["storyboardVisualSets"][number]["images"][number]) {
  const nextSets = state.storyboardVisualSets.some((set) => set.sceneId === sceneId)
    ? state.storyboardVisualSets.map((set) =>
        set.sceneId === sceneId
          ? {
              ...set,
              images: [...set.images, image],
            }
          : set
      )
    : [...state.storyboardVisualSets, { sceneId, images: [image] }]
  return {
    ...state,
    storyboardVisualSets: nextSets,
  }
}
