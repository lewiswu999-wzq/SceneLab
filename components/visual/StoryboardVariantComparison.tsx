"use client"

import { GitCompareIcon, LockIcon, PlayIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VariantStyleBadge } from "@/components/visual/VariantStyleBadge"
import { PROMPT_EXPERT_PIPELINE_VERSION } from "@/lib/prompt-expert"
import { generateStoryboardVariants } from "@/lib/visual-generation"
import {
  type AvailableVisualGenerationProvider,
  visualProviderOptions,
} from "@/lib/visual-providers"
import type {
  LockedVisualStyle,
  SceneAnalysis,
  StoryboardComparisonSet,
  StoryboardImageResult,
} from "@/lib/types"

type StoryboardVariantComparisonProps = {
  analysis: SceneAnalysis
  comparisonSets: StoryboardComparisonSet[]
  lockedStyle?: LockedVisualStyle
  onChange: (
    sets: StoryboardComparisonSet[],
    selectedImage?: StoryboardImageResult,
    lockImage?: boolean,
    lockedStyle?: LockedVisualStyle
  ) => void
}

export function StoryboardVariantComparison({
  analysis,
  comparisonSets,
  lockedStyle,
  onChange,
}: StoryboardVariantComparisonProps) {
  const [sceneId, setSceneId] = useState(analysis.scenes[0]?.id ?? "")
  const [provider, setProvider] = useState<AvailableVisualGenerationProvider>("image-api")
  const [loading, setLoading] = useState(false)
  const currentSet = comparisonSets.find((set) => set.sceneId === sceneId)
  const scene = analysis.scenes.find((item) => item.id === sceneId) ?? analysis.scenes[0]
  const shot = analysis.shotSuggestions.find((item) => item.sceneId === scene?.id) ?? analysis.shotSuggestions[0]

  async function generate() {
    if (!scene || !shot) {
      return
    }
    const currentProviderVariants = currentSet?.variants.filter(
      (variant) => variant.image.provider === provider
    )
    const hasCurrentPromptExpertVariants =
      currentProviderVariants?.length &&
      currentProviderVariants.every(
        (variant) => variant.promptExpert?.pipelineVersion === PROMPT_EXPERT_PIPELINE_VERSION
      )
    if (hasCurrentPromptExpertVariants) {
      toast.info("当前场景和模型通道已有候选版本，已复用现有对比组。")
      return
    }
    setLoading(true)
    try {
      const next = await generateStoryboardVariants(scene, shot, analysis.characters, provider, 5)
      onChange([...comparisonSets.filter((set) => set.sceneId !== scene.id), next])
      toast.success(currentProviderVariants?.length ? "旧版候选已按 Prompt Expert 重新生成" : "候选分镜已生成")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "候选分镜生成失败")
    } finally {
      setLoading(false)
    }
  }

  function selectVariant(variantId: string, lockImage = false) {
    if (!currentSet) {
      return
    }
    const variant = currentSet.variants.find((item) => item.id === variantId)
    const nextSet = {
      ...currentSet,
      selectedVariantId: variantId,
      variants: currentSet.variants.map((item) => ({
        ...item,
        isSelected: item.id === variantId,
        image: {
          ...item.image,
          isSelected: item.id === variantId,
          isLocked: lockImage && item.id === variantId ? true : item.image.isLocked,
        },
      })),
    }
    onChange(
      comparisonSets.map((set) => (set.id === currentSet.id ? nextSet : set)),
      variant
        ? {
            ...variant.image,
            isSelected: true,
            isLocked: lockImage,
          }
        : undefined,
      lockImage,
      lockImage && variant
        ? {
            style: variant.style,
            label: variant.label,
            sceneId: variant.sceneId,
            variantId: variant.id,
            imageId: variant.image.id,
            prompt: variant.promptExpert?.finalPrompt ?? variant.prompt,
            updatedAt: new Date().toISOString(),
          }
        : undefined
    )
    toast.success(lockImage ? `已锁定全局风格：${variant?.label ?? "当前风格"}` : "已选择最终版本")
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <GitCompareIcon />
          多版本分镜对比
        </CardTitle>
        <CardDescription>为同一场景生成不同视觉方案，选择后可作为后续视觉参考。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <div className="grid gap-1">
            <div className="text-xs font-medium text-zinc-300">当前全局锁定风格</div>
            <div className="text-sm text-teal-100">{lockedStyle?.label ?? "未锁定"}</div>
          </div>
          <p className="max-w-2xl text-xs leading-5 text-zinc-500">
            锁定某个候选风格后，分镜图、海报等视觉生成会默认按这个风格走。点击另一个候选的“锁定风格”即可更改。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={sceneId} onChange={(event) => setSceneId(event.target.value)} className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100">
            {analysis.scenes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <label className="sr-only" htmlFor="variant-provider">模型通道</label>
          <select id="variant-provider" value={provider} onChange={(event) => setProvider(event.target.value as AvailableVisualGenerationProvider)} className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100">
            {visualProviderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <Button onClick={generate} disabled={loading} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
            <SparklesIcon data-icon="inline-start" />
            {loading ? "生成中" : "生成候选版本"}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          {visualProviderOptions.find((option) => option.value === provider)?.description}
        </p>

        {currentSet ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {currentSet.variants.map((variant) => (
              <Card key={variant.id} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] ring-0">
                <div className="relative aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={variant.image.imageUrl} alt={variant.label} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3"><VariantStyleBadge style={variant.style} /></div>
                </div>
                <CardContent className="grid gap-3 p-4">
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{variant.label}</div>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{variant.reason}</p>
                  </div>
                  <PromptExpertPreview
                    finalPrompt={variant.promptExpert?.finalPrompt ?? variant.prompt}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => selectVariant(variant.id)}>
                      <PlayIcon data-icon="inline-start" />
                      选为最终
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={() => selectVariant(variant.id, true)}>
                      <LockIcon data-icon="inline-start" />
                      {lockedStyle?.variantId === variant.id ? "已锁定风格" : "锁定风格"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
            还没有候选版本，先生成一组。
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PromptExpertPreview({
  finalPrompt,
}: {
  finalPrompt: string
}) {
  return (
    <div className="grid gap-2 rounded-md border border-teal-300/15 bg-teal-300/[0.04] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-teal-100">Prompt Expert 最终 Prompt</div>
        <div className="rounded border border-teal-300/20 px-1.5 py-0.5 text-[10px] uppercase text-teal-200">
          fused
        </div>
      </div>
      <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-5 text-zinc-300">{finalPrompt}</p>
    </div>
  )
}
