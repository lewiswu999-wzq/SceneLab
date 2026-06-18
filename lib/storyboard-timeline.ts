import type { RhythmAdvice, SceneAnalysis, StoryboardTimeline, TimelineShot } from "@/lib/types"

function now() {
  return new Date().toISOString()
}

function withOrder(shots: TimelineShot[]) {
  return shots.map((shot, index) => ({ ...shot, order: index + 1 }))
}

function totalDuration(shots: TimelineShot[]) {
  return shots.reduce((total, shot) => total + Math.max(1, Number(shot.durationSeconds) || 1), 0)
}

function finalize(timeline: StoryboardTimeline, shots: TimelineShot[]): StoryboardTimeline {
  const ordered = withOrder(shots)
  return {
    ...timeline,
    shots: ordered,
    totalDurationSeconds: totalDuration(ordered),
    updatedAt: now(),
  }
}

export function buildTimelineFromAnalysis(analysis: SceneAnalysis): StoryboardTimeline {
  const shots = analysis.scenes.map((scene, index) => {
    const shot = analysis.shotSuggestions.find((item) => item.sceneId === scene.id)
    return {
      id: `timeline-shot-${scene.id}`,
      sceneId: scene.id,
      order: index + 1,
      title: scene.title,
      durationSeconds: scene.rhythmValue >= 75 ? 5 : scene.rhythmValue >= 45 ? 8 : 12,
      shotSize: shot?.shotSize ?? "中景",
      cameraAngle: shot?.cameraAngle ?? "平视",
      cameraMovement: shot?.cameraMovement ?? "静态观察",
      emotionValue: scene.emotionValue,
      rhythmValue: scene.rhythmValue,
      transition: index === 0 ? "fade" : "cut",
      isClimax: scene.emotionValue >= 82,
      isLocked: false,
      note: scene.summary,
    } satisfies TimelineShot
  })

  return {
    id: `storyboard-timeline-${analysis.meta.generatedAt}`,
    title: `${analysis.meta.textType} 镜头时间线`,
    shots,
    totalDurationSeconds: totalDuration(shots),
    updatedAt: now(),
  }
}

export function reorderTimelineShots(
  timeline: StoryboardTimeline,
  fromIndex: number,
  toIndex: number
): StoryboardTimeline {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return timeline
  }
  const shots = [...timeline.shots]
  if (!shots[fromIndex] || !shots[toIndex] || shots[fromIndex].isLocked) {
    return timeline
  }
  const [moved] = shots.splice(fromIndex, 1)
  shots.splice(toIndex, 0, moved)
  return finalize(timeline, shots)
}

export function updateTimelineShot(
  timeline: StoryboardTimeline,
  shotId: string,
  patch: Partial<TimelineShot>
): StoryboardTimeline {
  const shots = timeline.shots.map((shot) => {
    if (shot.id !== shotId) {
      return shot
    }
    return {
      ...shot,
      ...patch,
      durationSeconds: Math.max(1, Number(patch.durationSeconds ?? shot.durationSeconds) || shot.durationSeconds),
    }
  })
  return finalize(timeline, shots)
}

export function insertTimelineShot(
  timeline: StoryboardTimeline,
  afterShotId: string,
  shot: TimelineShot
): StoryboardTimeline {
  const index = timeline.shots.findIndex((item) => item.id === afterShotId)
  const shots = [...timeline.shots]
  shots.splice(index >= 0 ? index + 1 : shots.length, 0, shot)
  return finalize(timeline, shots)
}

export function deleteTimelineShot(
  timeline: StoryboardTimeline,
  shotId: string
): StoryboardTimeline {
  const target = timeline.shots.find((shot) => shot.id === shotId)
  if (target?.isLocked) {
    return timeline
  }
  return finalize(
    timeline,
    timeline.shots.filter((shot) => shot.id !== shotId)
  )
}

export function recalculateRhythmFromTimeline(timeline: StoryboardTimeline): RhythmAdvice[] {
  return timeline.shots.map((shot) => {
    const rhythmType =
      shot.isClimax || shot.rhythmValue >= 82
        ? "explosive"
        : shot.durationSeconds <= 5
          ? "fast"
          : shot.durationSeconds >= 12
            ? "slow"
            : "medium"
    return {
      sceneId: shot.sceneId,
      rhythmType,
      editingSuggestion: `${shot.durationSeconds}s ${shot.transition}，${shot.cameraMovement}；${
        shot.isClimax ? "作为高潮点强化停顿或冲击。" : "保持与前后镜头的情绪连续。"
      }`,
      reason: `由时间线顺序、镜头时长、情绪值 ${shot.emotionValue} 和节奏值 ${shot.rhythmValue} 重新计算。`,
    }
  })
}

export function duplicateTimelineShot(shot: TimelineShot): TimelineShot {
  return {
    ...shot,
    id: `timeline-shot-${crypto.randomUUID()}`,
    title: `${shot.title} copy`,
    isLocked: false,
  }
}
