"use client"

import { ImageIcon, Loader2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { buildCharacterConsistencyPrompt } from "@/lib/character-consistency"
import { samePrompt } from "@/lib/prompt-dedupe"
import { buildStoryboardImagePrompt, generateStoryboardImage } from "@/lib/visual-generation"
import {
  type AvailableVisualGenerationProvider,
  visualProviderOptions,
} from "@/lib/visual-providers"
import type {
  CharacterConsistencyPack,
  SceneAnalysis,
  StoryboardImageRequest,
  StoryboardImageResult,
} from "@/lib/types"

const ratios: StoryboardImageRequest["aspectRatio"][] = ["16:9", "9:16", "1:1", "4:3", "21:9"]
const styles = ["cinematic-realism", "cold-suspense", "warm-realism", "neon-noir", "documentary", "dreamlike"]
const statusText = {
  idle: "就绪",
  generating: "生成中",
  failed: "上次失败",
} satisfies Record<"idle" | "generating" | "failed", string>

type StoryboardImageGeneratorProps = {
  analysis: SceneAnalysis
  sceneId: string
  consistencyPack?: CharacterConsistencyPack
  existingImages?: StoryboardImageResult[]
  lockedReferenceImageIds?: string[]
  onGenerated: (image: StoryboardImageResult) => void
  onReuse?: (image: StoryboardImageResult) => void
}

export function StoryboardImageGenerator({
  analysis,
  sceneId,
  consistencyPack,
  existingImages = [],
  lockedReferenceImageIds = [],
  onGenerated,
  onReuse,
}: StoryboardImageGeneratorProps) {
  const scene = analysis.scenes.find((item) => item.id === sceneId) ?? analysis.scenes[0]
  const shot = analysis.shotSuggestions.find((item) => item.sceneId === scene.id) ?? analysis.shotSuggestions[0]
  const [provider, setProvider] = useState<AvailableVisualGenerationProvider>("jimeng")
  const [aspectRatio, setAspectRatio] = useState<StoryboardImageRequest["aspectRatio"]>("16:9")
  const [stylePreset, setStylePreset] = useState("cinematic-realism")
  const [status, setStatus] = useState<"idle" | "generating" | "failed">("idle")
  const basePrompt = useMemo(() => {
    const characterPrompt = consistencyPack
      ? `\n角色一致性：\n${buildCharacterConsistencyPrompt(consistencyPack.profiles, scene.characters)}`
      : ""
    return `${buildStoryboardImagePrompt(scene, shot, analysis.characters, stylePreset, provider)}${characterPrompt}`
  }, [analysis.characters, consistencyPack, provider, scene, shot, stylePreset])
  const [customPrompt, setCustomPrompt] = useState("")
  const prompt = customPrompt || basePrompt

  async function generate() {
    const duplicatedImage = existingImages.find(
      (image) =>
        image.sceneId === scene.id &&
        image.provider === provider &&
        samePrompt(image.prompt, prompt)
    )
    if (duplicatedImage) {
      onReuse?.(duplicatedImage)
      toast.info("相同 Prompt 已有生成结果，已直接复用，不再调用模型。")
      return
    }

    setStatus("generating")
    try {
      const result = await generateStoryboardImage({
        id: `storyboard-request-${crypto.randomUUID()}`,
        sceneId: scene.id,
        shotId: shot.sceneId,
        provider,
        prompt,
        aspectRatio,
        stylePreset,
        characterConsistencyIds: scene.characters,
        lockedReferenceImageIds,
        createdAt: new Date().toISOString(),
      })
      onGenerated(result)
      setStatus("idle")
      toast.success("分镜图已生成")
    } catch (error) {
      setStatus("failed")
      toast.error(error instanceof Error ? error.message : "分镜图生成失败")
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-medium text-zinc-100">生成分镜图</h3>
          <p className="text-xs leading-5 text-zinc-500">
            {scene.title} / {shot.shotSize} / {shot.cameraMovement}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="状态" value={statusText[status]} tone={status === "failed" ? "rose" : "teal"} />
          <StatusBadge label="锁定参考" value={String(lockedReferenceImageIds.length)} tone="amber" />
          <StatusBadge label="重复 Prompt" value="自动复用" tone="zinc" />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <ProviderSelect value={provider} onChange={setProvider} />
          <NativeSelect label="画幅" value={aspectRatio} options={ratios} onChange={(value) => setAspectRatio(value as StoryboardImageRequest["aspectRatio"])} />
          <NativeSelect label="视觉风格" value={stylePreset} options={styles} onChange={setStylePreset} />
        </div>
        <p className="text-xs text-zinc-500">
          {visualProviderOptions.find((option) => option.value === provider)?.description}
        </p>
        <Field>
          <FieldLabel className="text-zinc-100">Prompt</FieldLabel>
          <Textarea
            value={prompt}
            onChange={(event) => setCustomPrompt(event.target.value)}
            className="min-h-52 border-white/10 bg-black/30 text-sm leading-6 text-zinc-200"
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            SceneLab 会保留角色形象、镜头连续性和已锁定参考图。
          </p>
          <Button onClick={generate} disabled={status === "generating"} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
            {status === "generating" ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <ImageIcon data-icon="inline-start" />}
            生成分镜图
          </Button>
        </div>
      </div>
    </section>
  )
}

function ProviderSelect({
  value,
  onChange,
}: {
  value: AvailableVisualGenerationProvider
  onChange: (value: AvailableVisualGenerationProvider) => void
}) {
  return (
    <Field>
      <FieldLabel className="text-zinc-100">模型通道</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AvailableVisualGenerationProvider)}
        className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-teal-300/60"
      >
        {visualProviderOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  )
}

function NativeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel className="text-zinc-100">{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-teal-300/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </Field>
  )
}

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "teal" | "amber" | "rose" | "zinc"
}) {
  const toneClass =
    tone === "teal"
      ? "text-teal-100"
      : tone === "amber"
        ? "text-amber-100"
        : tone === "rose"
          ? "text-rose-100"
          : "text-zinc-200"

  return (
    <div className="flex h-7 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-2.5 text-xs">
      <span className="text-zinc-600">{label}</span>
      <span className={toneClass}>{value}</span>
    </div>
  )
}
