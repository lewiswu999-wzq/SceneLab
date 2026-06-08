import type { SceneSlice, ShotSuggestion } from "@/lib/types"

export const SCENELAB_SHOT_SCALE_GUIDE = [
  "EWS/大远景：建立空间、孤独感、史诗感或场景转换。",
  "WS/全景：让角色与环境关系清楚，常用于场景开场。",
  "MS/中景：适合对话、动作和人物关系推进。",
  "CU/近景：强调反应、情绪、秘密和心理变化。",
  "ECU/特写：强调眼睛、手、道具、文字、伤口等叙事细节。",
]

export const SCENELAB_CAMERA_GUIDE = [
  "平视：自然、客观，适合大多数对话和观察。",
  "低机位：强化威胁、权力、压迫或英雄感。",
  "高机位：表现脆弱、被俯视、失控或空间关系。",
  "过肩镜头：让观众站在角色关系里，适合对话和冲突。",
  "主观镜头：用于角色看见某物、发现线索或情绪被牵引。",
]

export const SCENELAB_MOVEMENT_GUIDE = [
  "推镜：靠近角色内心、压力或关键发现。",
  "拉镜：制造距离、失落、揭示环境或关系断裂。",
  "横移/跟拍：保持动作连续和空间方向。",
  "摇镜/俯仰：揭示信息、跟随视线或建立空间。",
  "静态镜头：让表演、沉默或构图承担张力。",
  "手持：制造不稳定、即时感和纪实压力。",
]

export const SCENELAB_CONTINUITY_GUIDE = [
  "180度轴线：对话或对峙时默认保持同一侧拍摄，除非用中性镜头或可见运动明确越轴。",
  "动作匹配：同一动作跨镜头剪接时，动作方向、阶段和力度要接得上。",
  "视线匹配：角色看向某处后，下一镜应呈现其所见对象或视线方向的合理结果。",
  "画面方向：角色从左到右运动后，后续镜头默认保持同方向，反向运动意味着转身或返回。",
  "建立镜头：新地点、新关系或复杂空间开始时，优先用全景/远景让观众知道人在何处。",
]

export function buildSceneContinuityCue(scene: SceneSlice, shot: ShotSuggestion) {
  const isDialogue = scene.characters.length >= 2
  const needsEstablishing =
    /全景|远景|wide|establish/i.test(shot.shotSize) ||
    /外景|街|天台|走廊|房间|办公室|室内|室外/.test(scene.location)
  const actionCue = /跟|横移|手持|推|拉|dolly|tracking|pan/i.test(shot.cameraMovement)

  return [
    needsEstablishing ? "本镜头需要清楚交代空间关系。" : "本镜头可把空间关系作为背景，重点放在人物反应。",
    isDialogue ? "若出现双人对话或对峙，保持180度轴线和稳定视线方向。" : "单人镜头也要保持角色运动方向和视线逻辑。",
    actionCue ? "镜头运动要服务动作连续，避免无理由改变人物屏幕方向。" : "静态或轻运动镜头要让构图承担叙事重点。",
  ].join(" ")
}

export function buildSceneStoryboardCraftPrompt(scene: SceneSlice, shot: ShotSuggestion) {
  return [
    "SceneLab 分镜创作规范：",
    `景别判断：${shot.shotSize} 应服务当前情绪和信息量，不要所有镜头都使用同一种景别。`,
    `机位判断：${shot.cameraAngle} 必须解释人物权力关系、观察角度或空间信息。`,
    `运动判断：${shot.cameraMovement} 必须服务人物动作、视线、情绪推进或信息揭示。`,
    buildSceneContinuityCue(scene, shot),
    "连续性硬规则：保持180度轴线、动作匹配、视线匹配和画面方向。只有叙事明确需要混乱、迷失或越轴时，才允许打破，并且画面中要有可理解的过渡。",
    "分镜画面必须像可拍摄的影视画面，而不是孤立的概念插画。",
  ].join("\n")
}

export function buildStoryboardAnnotation(scene: SceneSlice, shot: ShotSuggestion) {
  return [
    `Scene: ${scene.id} / ${scene.title}`,
    `Shot: ${shot.shotSize}, ${shot.cameraAngle}`,
    `Movement: ${shot.cameraMovement}`,
    `Action: ${scene.summary}`,
    `Continuity: 180-degree axis, eyeline, action match, screen direction`,
    `Sound: ${shot.soundDesign}`,
  ].join("\n")
}
