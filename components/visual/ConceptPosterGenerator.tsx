"use client"

import { Loader2Icon, PaletteIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { buildConceptPosterPrompt, generateConceptPoster } from "@/lib/concept-visuals"
import { samePrompt } from "@/lib/prompt-dedupe"
import {
  type AvailableVisualGenerationProvider,
  visualProviderOptions,
} from "@/lib/visual-providers"
import type {
  CharacterConsistencyPack,
  ConceptPosterResult,
  LockedVisualStyle,
  PosterType,
  SceneAnalysis,
} from "@/lib/types"

const posterTypes: PosterType[] = ["main-poster", "character-poster", "mood-poster", "vertical-cover", "horizontal-banner"]
const ratios = ["16:9", "9:16", "1:1", "4:3", "21:9"] as const

type ConceptPosterGeneratorProps = {
  analysis: SceneAnalysis
  lockedStyle?: LockedVisualStyle
  consistencyPack?: CharacterConsistencyPack
  existingPosters?: ConceptPosterResult[]
  onGenerated: (poster: ConceptPosterResult) => void
  onReuse?: (poster: ConceptPosterResult) => void
}

export function ConceptPosterGenerator({
  analysis,
  lockedStyle,
  consistencyPack,
  existingPosters = [],
  onGenerated,
  onReuse,
}: ConceptPosterGeneratorProps) {
  const [posterType, setPosterType] = useState<PosterType>("main-poster")
  const [provider, setProvider] = useState<AvailableVisualGenerationProvider>("image-api")
  const [aspectRatio, setAspectRatio] = useState<(typeof ratios)[number]>("16:9")
  const [visualStyle, setVisualStyle] = useState(lockedStyle?.label ?? analysis.meta.style)
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>(analysis.scenes.slice(0, 2).map((scene) => scene.id))
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(analysis.characters.slice(0, 3).map((character) => character.id))
  const [customPrompt, setCustomPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const prompt = useMemo(
    () =>
      customPrompt ||
      buildConceptPosterPrompt(
        analysis,
        posterType,
        consistencyPack?.profiles ?? [],
        selectedSceneIds,
        lockedStyle ? `全局锁定风格：${lockedStyle.label}。参考锁定 prompt：${lockedStyle.prompt}` : visualStyle
      ),
    [analysis, consistencyPack?.profiles, customPrompt, lockedStyle, posterType, selectedSceneIds, visualStyle]
  )

  function toggleScene(sceneId: string) {
    setSelectedSceneIds((current) =>
      current.includes(sceneId) ? current.filter((id) => id !== sceneId) : [...current, sceneId]
    )
  }

  function toggleCharacter(characterId: string) {
    setSelectedCharacterIds((current) =>
      current.includes(characterId) ? current.filter((id) => id !== characterId) : [...current, characterId]
    )
  }

  async function generate() {
    const duplicatedPoster = existingPosters.find(
      (poster) =>
        poster.posterType === posterType &&
        poster.provider === provider &&
        samePrompt(poster.prompt, prompt)
    )
    if (duplicatedPoster) {
      onReuse?.(duplicatedPoster)
      toast.info("相同 Prompt 已有海报结果，已直接复用，不再调用模型。")
      return
    }

    setLoading(true)
    try {
      const poster = await generateConceptPoster({
        id: `poster-request-${crypto.randomUUID()}`,
        posterType,
        title: analysis.meta.textType,
        logline: analysis.overview.summary,
        provider,
        aspectRatio,
        visualStyle: lockedStyle?.label ?? visualStyle,
        selectedSceneIds,
        selectedCharacterIds,
        prompt,
        createdAt: new Date().toISOString(),
      })
      onGenerated(poster)
      toast.success("概念海报已生成")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "概念海报生成失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <PaletteIcon />
          概念海报
        </CardTitle>
        <CardDescription>选择场景与角色，通过图像流 API 生成海报，或使用不联网的本地 SVG 预览。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <NativeSelect label="海报类型" value={posterType} options={posterTypes} onChange={(value) => setPosterType(value as PosterType)} />
          <ProviderSelect value={provider} onChange={setProvider} />
          <NativeSelect label="画幅" value={aspectRatio} options={[...ratios]} onChange={(value) => setAspectRatio(value as (typeof ratios)[number])} />
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">视觉风格</span>
            <input
              value={lockedStyle?.label ?? visualStyle}
              disabled={Boolean(lockedStyle)}
              onChange={(event) => setVisualStyle(event.target.value)}
              className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100 disabled:opacity-70"
            />
          </label>
        </div>
        {lockedStyle && (
          <p className="text-xs leading-5 text-teal-100">
            已跟随多版本比对锁定风格：{lockedStyle.label}
          </p>
        )}
        <p className="text-xs text-zinc-500">
          {visualProviderOptions.find((option) => option.value === provider)?.description}
        </p>
        <ChoiceGroup title="参与场景" items={analysis.scenes.map((scene) => [scene.id, scene.title])} selected={selectedSceneIds} onToggle={toggleScene} />
        <ChoiceGroup title="参与角色" items={analysis.characters.map((character) => [character.id, character.name])} selected={selectedCharacterIds} onToggle={toggleCharacter} />
        <Textarea value={prompt} onChange={(event) => setCustomPrompt(event.target.value)} className="min-h-44 border-white/10 bg-black/30 text-sm leading-6 text-zinc-200" />
        <div className="flex justify-end">
          <Button onClick={generate} disabled={loading} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
            {loading ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <PaletteIcon data-icon="inline-start" />}
            生成概念海报
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <label className="grid gap-1">
      <span className="text-xs text-zinc-400">模型通道</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AvailableVisualGenerationProvider)}
        className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
      >
        {visualProviderOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function NativeSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ChoiceGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: string[][]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="text-xs text-zinc-400">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map(([id, label]) => (
          <button
            key={id}
            type="button"
            data-active={selected.includes(id)}
            onClick={() => onToggle(id)}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 data-[active=true]:border-teal-300/50 data-[active=true]:bg-teal-300/10 data-[active=true]:text-teal-100"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
