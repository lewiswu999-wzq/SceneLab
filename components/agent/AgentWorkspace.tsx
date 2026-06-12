"use client"

import {
  ArrowLeftIcon,
  ClapperboardIcon,
  FilmIcon,
  GitCompareIcon,
  HistoryIcon,
  ImageIcon,
  Layers3Icon,
  LockKeyholeIcon,
  MessageSquareTextIcon,
  PaletteIcon,
  PencilLineIcon,
  RefreshCcwIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { ElementType } from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AIGCPromptGeneratorPanel } from "@/components/agent/AIGCPromptGeneratorPanel"
import { EditableWorkbenchPanel } from "@/components/agent/EditableWorkbenchPanel"
import { EditHistoryPanel } from "@/components/agent/EditHistoryPanel"
import { FeatureIntroPanel } from "@/components/agent/FeatureIntroPanel"
import { FeedbackRevisionPanel } from "@/components/agent/FeedbackRevisionPanel"
import { LongScriptPanel } from "@/components/agent/LongScriptPanel"
import { RegenerateFromEditsPanel } from "@/components/agent/RegenerateFromEditsPanel"
import { RevisionHistoryPanel } from "@/components/agent/RevisionHistoryPanel"
import { UserEditPanel } from "@/components/agent/UserEditPanel"
import { ShotTimelineEditor } from "@/components/timeline/ShotTimelineEditor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CharacterConsistencyPanel } from "@/components/visual/CharacterConsistencyPanel"
import { ConceptPosterWorkspace } from "@/components/visual/ConceptPosterWorkspace"
import { StoryboardReelWorkspace } from "@/components/visual/StoryboardReelWorkspace"
import { StoryboardVariantComparison } from "@/components/visual/StoryboardVariantComparison"
import { VisualStoryboardPanel } from "@/components/visual/VisualStoryboardPanel"
import { STORAGE_KEY } from "@/lib/constants"
import { toEditableAgentRunResult } from "@/lib/editable-agent"
import { sampleAnalysis } from "@/lib/sample-data"
import { createAgentRunFromAnalysis } from "@/lib/scenelab-agent"
import type {
  CharacterConsistencyPack,
  EditableAgentRunResult,
  LongScriptAnalysisResult,
  RevisedAgentRunResult,
  SceneAnalysis,
  StoryboardComparisonSet,
  StoryboardImageResult,
  TextInput,
  VisualAgentState,
  LockedVisualStyle,
} from "@/lib/types"
import { ensureVisualAgentState, getAllStoryboardImages } from "@/lib/visual-agent-state"

type AgentSection =
  | "visualStoryboard"
  | "visualVariants"
  | "characterConsistency"
  | "shotTimeline"
  | "conceptPoster"
  | "storyboardReel"
  | "editable"
  | "userEdits"
  | "regenerateEdits"
  | "editHistory"
  | "feedback"
  | "longScript"
  | "aigcPrompts"
  | "history"

type NavItem = {
  id: AgentSection
  label: string
  icon: ElementType
}

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "视觉创作",
    items: [
      { id: "visualStoryboard", label: "视觉分镜", icon: ImageIcon },
      { id: "visualVariants", label: "多版本对比", icon: GitCompareIcon },
      { id: "characterConsistency", label: "角色一致性", icon: UsersIcon },
      { id: "shotTimeline", label: "镜头时间线", icon: ClapperboardIcon },
      { id: "conceptPoster", label: "概念海报", icon: PaletteIcon },
      { id: "storyboardReel", label: "视觉预演", icon: FilmIcon },
    ],
  },
  {
    title: "Agent 编辑",
    items: [
      { id: "editable", label: "可编辑工作台", icon: PencilLineIcon },
      { id: "userEdits", label: "用户修改", icon: LockKeyholeIcon },
      { id: "regenerateEdits", label: "根据修改重生成", icon: RefreshCcwIcon },
      { id: "editHistory", label: "编辑历史", icon: HistoryIcon },
    ],
  },
  {
    title: "分析优化",
    items: [
      { id: "feedback", label: "反馈调整", icon: MessageSquareTextIcon },
      { id: "longScript", label: "长剧本分段", icon: Layers3Icon },
      { id: "aigcPrompts", label: "AI 分镜 Prompt", icon: SparklesIcon },
      { id: "history", label: "版本历史", icon: HistoryIcon },
    ],
  },
]

const featureIntros: Record<
  AgentSection,
  {
    icon: ElementType
    title: string
    description: string
    details: string[]
  }
> = {
  visualStoryboard: {
    icon: ImageIcon,
    title: "视觉分镜",
    description: "把场景、角色、镜头建议、分镜规范和角色一致性规则合成分镜图 Prompt，可调用已接入的即梦 API，或生成不联网的本地 SVG 预览。",
    details: ["相同 Prompt 会复用已有结果，避免重复消耗额度。", "默认保持同一演员和同一角色形象连续。", "分镜 Prompt 会考虑轴线、动作匹配、视线匹配和画面方向。"],
  },
  visualVariants: {
    icon: GitCompareIcon,
    title: "多版本对比",
    description: "为同一场景生成多种视觉方案，比较写实、悬疑、纪录片、霓虹等风格后选定视觉基准。",
    details: ["同场景同模型通道已有候选组时会复用。", "选中版本会进入视觉参考库。", "锁定基准后不会被后续生成覆盖。"],
  },
  characterConsistency: {
    icon: UsersIcon,
    title: "角色一致性",
    description: "维护每个角色的演员身份、面部关键词、发型、服装、色彩和身体语言，供分镜、海报、预演复用。",
    details: ["默认不允许无理由换脸、换发型、变年龄。", "字段可锁定，锁定内容优先级最高。", "只有时间跳跃、受伤、伪装、明确换装等剧本证据才允许变化。"],
  },
  shotTimeline: {
    icon: ClapperboardIcon,
    title: "镜头时间线",
    description: "把分析出的场景和镜头建议转成可编辑时间线，用来调整顺序、时长、转场和高潮点。",
    details: ["修改时长会重新计算总时长。", "高潮标记会影响节奏建议。", "锁定镜头不会被 Agent 后续覆盖。"],
  },
  conceptPoster: {
    icon: PaletteIcon,
    title: "概念海报",
    description: "从故事概览、角色一致性和关键场景生成概念海报 Prompt，可调用已接入的即梦 API，或生成不联网的本地 SVG 预览。",
    details: ["同类型同 Prompt 会复用已有海报。", "可选择参与海报的场景和角色。", "适合做项目第一视觉和风格探索。"],
  },
  storyboardReel: {
    icon: FilmIcon,
    title: "视觉预演",
    description: "用已生成分镜图和镜头时间线播放 Storyboard Reel，模拟影片节奏，不做真实视频合成。",
    details: ["支持播放、暂停、上一镜和下一镜。", "可开关字幕和调节播放速度。", "没有分镜图的镜头会显示占位。"],
  },
  editable: {
    icon: PencilLineIcon,
    title: "可编辑工作台",
    description: "直接修改场景、人物、关系、节奏、镜头和 Prompt 字段，修改后自动记录为用户编辑。",
    details: ["用户编辑会自动锁定。", "锁定字段不会被重生成覆盖。", "适合精修 Agent 初稿。"],
  },
  userEdits: {
    icon: LockKeyholeIcon,
    title: "用户修改",
    description: "集中查看所有用户手动改过的字段，以及这些字段对应的锁定状态。",
    details: ["可检查哪些内容被保护。", "可恢复某次编辑。", "帮助判断后续重生成范围。"],
  },
  regenerateEdits: {
    icon: RefreshCcwIcon,
    title: "根据修改重生成",
    description: "根据用户编辑的内容重生成受影响模块，同时保留所有锁定字段。",
    details: ["可选择只更新受影响模块。", "可更新下游依赖模块。", "适合让 Agent 按你的改法继续推演。"],
  },
  editHistory: {
    icon: HistoryIcon,
    title: "编辑历史",
    description: "查看用户编辑与重生成记录，确认哪些内容被保留、哪些模块被更新。",
    details: ["保留每次编辑时间。", "记录锁定字段。", "便于回溯创作决策。"],
  },
  feedback: {
    icon: MessageSquareTextIcon,
    title: "反馈调整",
    description: "用自然语言告诉 Agent 想怎么改，让它按反馈调整分析结果。",
    details: ["适合整体方向调整。", "可控制调整强度。", "会生成版本历史。"],
  },
  longScript: {
    icon: Layers3Icon,
    title: "长剧本分段",
    description: "把长文本切成多个片段分别分析，再合并成全局结果。",
    details: ["适合超长剧本。", "会保留跨段连续性笔记。", "可应用合并后的完整分析。"],
  },
  aigcPrompts: {
    icon: SparklesIcon,
    title: "AI 分镜 Prompt",
    description: "把场景和镜头建议转成适配不同 AIGC 工具的 Prompt 文本模板，仅用于复制和导出，不代表对应图像 provider 已接入。",
    details: ["保留 SceneLab 分镜规范。", "Prompt 字段可编辑。", "可导出文本或 JSON。"],
  },
  history: {
    icon: HistoryIcon,
    title: "版本历史",
    description: "查看反馈修正生成的版本记录，理解每次调整影响了哪些模块。",
    details: ["记录修改摘要。", "保留前后快照。", "便于比较不同分析版本。"],
  },
}

type StoredPayload = {
  input?: TextInput
  analysis?: SceneAnalysis
  agentResult?: EditableAgentRunResult
}

function createFallbackPayload() {
  return {
    result: toEditableAgentRunResult(createAgentRunFromAnalysis(sampleAnalysis)),
    input: undefined,
  }
}

function loadInitialPayload() {
  if (typeof window === "undefined") {
    return createFallbackPayload()
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? (JSON.parse(stored) as StoredPayload) : {}
    const analysis = parsed.analysis ?? parsed.agentResult?.analysis ?? sampleAnalysis
    const result = toEditableAgentRunResult(parsed.agentResult ?? createAgentRunFromAnalysis(analysis, parsed.input))
    return {
      result,
      input: parsed.input,
    }
  } catch {
    return createFallbackPayload()
  }
}

function persist(input: TextInput | undefined, result: EditableAgentRunResult) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      input,
      analysis: result.analysis,
      agentResult: result,
    })
  )
}

export function AgentWorkspace() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AgentSection>("visualStoryboard")
  const [input, setInput] = useState<TextInput | undefined>()
  const [result, setResult] = useState<EditableAgentRunResult>(() => createFallbackPayload().result)
  const visualState = ensureVisualAgentState(result.analysis, result.visualState)
  const storyboardImageCount = visualState.storyboardVisualSets.reduce((total, set) => total + set.images.length, 0)

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const initial = loadInitialPayload()
      setInput(initial.input)
      setResult(initial.result)
    }, 0)

    return () => window.clearTimeout(restoreTimer)
  }, [])

  function handleRevised(nextResult: RevisedAgentRunResult) {
    const editableResult = toEditableAgentRunResult({
      ...nextResult,
      userEdits: result.userEdits,
      lockedFields: result.lockedFields,
      regenerationHistory: result.regenerationHistory,
      visualState: result.visualState,
    })
    setResult(editableResult)
    persist(input, editableResult)
    toast.success("已生成修正版报告")
  }

  function handleApplyLongScript(nextResult: LongScriptAnalysisResult) {
    const revisedResult = toEditableAgentRunResult({
      ...nextResult,
      revisionHistory: result.revisionHistory,
      userEdits: result.userEdits,
      lockedFields: result.lockedFields,
      regenerationHistory: result.regenerationHistory,
      visualState: result.visualState,
    })
    setResult(revisedResult)
    persist(input, revisedResult)
    toast.success("已应用长剧本全局合并报告")
  }

  function handleEditableChange(nextResult: EditableAgentRunResult) {
    setResult(nextResult)
    persist(input, nextResult)
  }

  function handleVisualStateChange(nextVisualState: VisualAgentState, logs: string[] = []) {
    const nextResult = {
      ...result,
      visualState: nextVisualState,
      toolCallLogs: [...result.toolCallLogs, ...logs],
    }
    setResult(nextResult)
    persist(input, nextResult)
  }

  function upsertStoryboardImage(
    state: VisualAgentState,
    image: StoryboardImageResult,
    lockImage = false
  ): VisualAgentState {
    const nextSets = state.storyboardVisualSets.some((set) => set.sceneId === image.sceneId)
      ? state.storyboardVisualSets.map((set) => {
          if (set.sceneId !== image.sceneId) {
            return set
          }
          const exists = set.images.some((item) => item.id === image.id)
          const images = (exists ? set.images : [...set.images, image]).map((item) =>
            item.id === image.id
              ? {
                  ...item,
                  isSelected: true,
                  isLocked: lockImage ? true : item.isLocked,
                }
              : {
                  ...item,
                  isSelected: false,
                }
          )
          return {
            ...set,
            images,
            selectedImageId: image.id,
            lockedImageId: lockImage ? image.id : set.lockedImageId,
          }
        })
      : [
          ...state.storyboardVisualSets,
          {
            sceneId: image.sceneId,
            images: [{ ...image, isSelected: true, isLocked: lockImage }],
            selectedImageId: image.id,
            lockedImageId: lockImage ? image.id : undefined,
          },
        ]
    return {
      ...state,
      storyboardVisualSets: nextSets,
    }
  }

  function handleComparisonChange(
    sets: StoryboardComparisonSet[],
    selectedImage?: StoryboardImageResult,
    lockImage = false,
    lockedStyle?: LockedVisualStyle
  ) {
    const nextBaseState = {
      ...visualState,
      storyboardComparisonSets: sets,
      lockedStyle: lockedStyle ?? visualState.lockedStyle,
    }
    const nextVisualState = selectedImage
      ? upsertStoryboardImage(nextBaseState, selectedImage, lockImage)
      : nextBaseState
    handleVisualStateChange(nextVisualState, [
      selectedImage ? (lockImage ? "selectStoryboardVariant:locked" : "selectStoryboardVariant") : "generateStoryboardVariants",
    ])
  }

  function handleCharacterConsistencyChange(pack: CharacterConsistencyPack) {
    handleVisualStateChange(
      {
        ...visualState,
        characterConsistencyPack: pack,
      },
      ["buildCharacterConsistencyPrompt"]
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col">
        <header className="app-titlebar px-4 py-2 sm:px-5">
          <div className="flex min-h-11 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/analysis")}
                className="size-9 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-100"
                aria-label="返回分析页"
              >
                <ArrowLeftIcon />
              </Button>
              <div className="grid gap-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold tracking-normal text-zinc-50">
                    SceneLab
                  </h1>
                  <span className="hidden h-4 w-px bg-white/10 sm:block" />
                  <span className="hidden text-xs text-zinc-500 sm:inline">
                    视觉制作台
                  </span>
                </div>
                <p className="line-clamp-1 max-w-3xl text-[11px] text-zinc-600">
                  {result.analysis.overview.summary}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <StatusPill label="模型" value={`${result.analysis.meta.provider ?? "mock"} / ${result.analysis.meta.model ?? "local"}`} />
              <StatusPill label="场景" value={String(result.analysis.scenes.length)} />
              <StatusPill label="分镜图" value={String(storyboardImageCount)} />
              <StatusPill label="锁定风格" value={visualState.lockedStyle?.label ?? "未锁定"} tone="amber" />
            </div>
          </div>
        </header>

        <section className="grid min-w-0 flex-1 gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="min-w-0 overflow-hidden border-b border-white/10 bg-[#0b0d0e] px-3 py-3 lg:border-b-0 lg:border-r">
            <nav className="flex min-w-0 max-w-full gap-2 overflow-x-auto lg:grid lg:gap-4 lg:overflow-visible">
              {navGroups.map((group) => (
                <div key={group.title} className="grid min-w-[190px] gap-1 lg:min-w-0">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase text-zinc-700">
                    {group.title}
                  </div>
                  <div className="grid gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          data-active={active}
                          className="relative flex min-h-10 items-center gap-2 rounded-md px-2.5 text-left text-sm text-zinc-500 transition-colors hover:bg-white/[0.045] hover:text-zinc-100 data-[active=true]:bg-primary/[0.08] data-[active=true]:text-primary"
                        >
                          <span className="absolute left-0 top-2 hidden h-6 w-0.5 rounded-full bg-primary data-[active=true]:block" data-active={active} />
                          <Icon className="size-4" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-5 hidden border-t border-white/10 pt-4 lg:block">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase text-zinc-700">运行记录</div>
              <div className="max-h-56 space-y-1 overflow-auto px-2">
                {result.toolCallLogs.slice(-14).map((log, index) => (
                  <div key={`${log}-${index}`} className="flex gap-2 font-mono text-[10px] leading-5 text-zinc-700">
                    <span className="text-primary/60">{String(index + 1).padStart(2, "0")}</span>
                    <span className="truncate">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 bg-[#090b0c] px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1280px] flex-col gap-4">
              <FeatureIntroPanel {...featureIntros[activeSection]} />

              <ProjectPulse analysis={result.analysis} />

              {activeSection === "visualStoryboard" && (
                <VisualStoryboardPanel
                  analysis={result.analysis}
                  state={visualState}
                  lockedStyle={visualState.lockedStyle}
                  onChange={handleVisualStateChange}
                />
              )}
              {activeSection === "visualVariants" && (
                <StoryboardVariantComparison
                  analysis={result.analysis}
                  comparisonSets={visualState.storyboardComparisonSets}
                  lockedStyle={visualState.lockedStyle}
                  onChange={handleComparisonChange}
                />
              )}
              {activeSection === "characterConsistency" && (
                <CharacterConsistencyPanel
                  analysis={result.analysis}
                  pack={visualState.characterConsistencyPack}
                  onChange={handleCharacterConsistencyChange}
                />
              )}
              {activeSection === "shotTimeline" && visualState.timeline && (
                <ShotTimelineEditor
                  timeline={visualState.timeline}
                  images={getAllStoryboardImages(visualState)}
                  onChange={(timeline, rhythm) => {
                    const nextResult = {
                      ...result,
                      analysis: {
                        ...result.analysis,
                        rhythm: rhythm ?? result.analysis.rhythm,
                      },
                      visualState: {
                        ...visualState,
                        timeline,
                      },
                      toolCallLogs: [...result.toolCallLogs, "updateStoryboardTimeline"],
                    }
                    setResult(nextResult)
                    persist(input, nextResult)
                  }}
                />
              )}
              {activeSection === "conceptPoster" && (
                <ConceptPosterWorkspace
                  analysis={result.analysis}
                  state={visualState}
                  lockedStyle={visualState.lockedStyle}
                  onChange={handleVisualStateChange}
                />
              )}
              {activeSection === "storyboardReel" && (
                <StoryboardReelWorkspace
                  analysis={result.analysis}
                  state={visualState}
                  onChange={handleVisualStateChange}
                />
              )}
              {activeSection === "feedback" && (
                <FeedbackRevisionPanel result={result} onRevised={handleRevised} />
              )}
              {activeSection === "editable" && (
                <EditableWorkbenchPanel result={result} onChange={handleEditableChange} />
              )}
              {activeSection === "userEdits" && (
                <UserEditPanel result={result} onChange={handleEditableChange} />
              )}
              {activeSection === "regenerateEdits" && (
                <RegenerateFromEditsPanel result={result} onChange={handleEditableChange} />
              )}
              {activeSection === "editHistory" && <EditHistoryPanel result={result} />}
              {activeSection === "longScript" && (
                <LongScriptPanel input={input} onApplyAnalysis={handleApplyLongScript} />
              )}
              {activeSection === "aigcPrompts" && (
                <AIGCPromptGeneratorPanel analysis={result.analysis} />
              )}
              {activeSection === "history" && <RevisionHistoryPanel result={result} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatusPill({
  label,
  value,
  tone = "teal",
}: {
  label: string
  value: string
  tone?: "teal" | "amber"
}) {
  return (
    <div className="flex h-7 items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-2.5">
      <span className="text-zinc-600">{label}</span>
      <span className={tone === "amber" ? "font-mono text-amber-200" : "font-mono text-primary"}>
        {value}
      </span>
    </div>
  )
}

function ProjectPulse({ analysis }: { analysis: SceneAnalysis }) {
  return (
    <Card className="rounded-md border border-white/10 bg-[#0d1011] py-0 ring-0">
      <CardContent className="grid gap-3 p-3 md:grid-cols-4">
        <PulseItem label="核心冲突" value={analysis.overview.coreConflict} />
        <PulseItem label="情绪曲线" value={analysis.overview.emotionalArc} />
        <PulseItem label="节奏建议" value={`${analysis.rhythm.length} 条场景节奏`} />
        <PulseItem label="视觉关键词" value={analysis.overview.visualKeywords.join(" / ")} />
      </CardContent>
    </Card>
  )
}

function PulseItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-white/10 px-3 first:border-l-0">
      <div className="text-[11px] text-zinc-600">{label}</div>
      <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{value}</div>
    </div>
  )
}
