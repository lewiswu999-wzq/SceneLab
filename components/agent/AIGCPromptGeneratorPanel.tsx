"use client"

import { DownloadIcon, FileJsonIcon, FileTextIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { AIGCPromptCard } from "@/components/agent/AIGCPromptCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  exportAIGCPromptPackToJSON,
  exportAIGCPromptPackToTXT,
  generateAIGCStoryboardPrompts,
  toolLabels,
} from "@/lib/aigc-prompt-agent"
import { copyToClipboard } from "@/lib/export"
import type { AIGCPromptPack, AIGCPromptPreference, AIGCTool, SceneAnalysis } from "@/lib/types"

const tools: AIGCTool[] = [
  "midjourney",
  "stable-diffusion",
  "sdxl",
  "dalle",
  "runway",
  "pika",
  "kling",
  "jimeng",
  "tongyi-wanxiang",
  "comfyui",
  "generic-en",
  "generic-zh",
]

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

type AIGCPromptGeneratorPanelProps = {
  analysis: SceneAnalysis
}

export function AIGCPromptGeneratorPanel({ analysis }: AIGCPromptGeneratorPanelProps) {
  const [preference, setPreference] = useState<AIGCPromptPreference>({
    tool: "midjourney",
    language: "bilingual",
    aspectRatio: "16:9",
    styleIntensity: "balanced",
    includeNegativePrompt: true,
    includeCameraParams: true,
    includeLightingParams: true,
    includeConsistencyNotes: true,
  })
  const [pack, setPack] = useState<AIGCPromptPack>()
  const [editedPromptFields, setEditedPromptFields] = useState<Record<string, string[]>>({})

  function updatePreference(next: Partial<AIGCPromptPreference>) {
    setPreference((current) => ({ ...current, ...next }))
  }

  function generatePack() {
    setPack(generateAIGCStoryboardPrompts(analysis, preference))
    setEditedPromptFields({})
  }

  function editPrompt(promptId: string, fieldPath: string, value: unknown) {
    setPack((current) => {
      if (!current) {
        return current
      }
      const nextPack = {
        ...current,
        prompts: current.prompts.map((prompt) =>
          prompt.id === promptId
            ? {
                ...prompt,
                [fieldPath]: value,
              }
            : prompt
        ),
      }
      return {
        ...nextPack,
        exportText: exportAIGCPromptPackToTXT(nextPack),
      }
    })
    setEditedPromptFields((current) => ({
      ...current,
      [promptId]: Array.from(new Set([...(current[promptId] ?? []), fieldPath])),
    }))
    toast.success("Prompt 字段已保存并锁定")
  }

  async function copyAll() {
    if (!pack) {
      return
    }
    await copyToClipboard(pack.exportText)
    toast.success("已复制完整 Prompt 包")
  }

  function exportTXT() {
    if (!pack) {
      return
    }
    downloadFile("scenelab-aigc-prompts.txt", exportAIGCPromptPackToTXT(pack), "text/plain;charset=utf-8")
  }

  function exportJSON() {
    if (!pack) {
      return
    }
    downloadFile("scenelab-aigc-prompts.json", exportAIGCPromptPackToJSON(pack), "application/json;charset=utf-8")
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="text-zinc-100">AI 分镜 Prompt</CardTitle>
          <CardDescription>按不同 AIGC 工具格式化并导出 Prompt 文本；此处不会连接或调用对应图像 provider。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Field>
            <FieldLabel className="text-zinc-100">Prompt 格式目标</FieldLabel>
            <ToggleGroup
              value={[preference.tool]}
              onValueChange={(value) => value.at(-1) && updatePreference({ tool: value.at(-1) as AIGCTool })}
              className="flex flex-wrap"
              variant="outline"
              size="sm"
              spacing={1}
            >
              {tools.map((tool) => (
                <ToggleGroupItem
                  key={tool}
                  type="button"
                  value={tool}
                  className="border-white/10 bg-white/[0.03] px-3 text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100"
                >
                  {toolLabels[tool]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <div className="grid gap-4 lg:grid-cols-3">
            <OptionSet
              label="语言"
              value={preference.language}
              options={[
                ["zh", "中文"],
                ["en", "英文"],
                ["bilingual", "双语"],
              ]}
              onChange={(value) => updatePreference({ language: value as AIGCPromptPreference["language"] })}
            />
            <OptionSet
              label="画幅"
              value={preference.aspectRatio}
              options={["16:9", "9:16", "1:1", "4:3", "21:9"].map((value) => [value, value])}
              onChange={(value) => updatePreference({ aspectRatio: value as AIGCPromptPreference["aspectRatio"] })}
            />
            <OptionSet
              label="风格强度"
              value={preference.styleIntensity}
              options={[
                ["subtle", "克制"],
                ["balanced", "均衡"],
                ["strong", "强烈"],
              ]}
              onChange={(value) => updatePreference({ styleIntensity: value as AIGCPromptPreference["styleIntensity"] })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Flag
              label="负面 Prompt"
              checked={preference.includeNegativePrompt}
              onChange={(checked) => updatePreference({ includeNegativePrompt: checked })}
            />
            <Flag
              label="镜头参数"
              checked={preference.includeCameraParams}
              onChange={(checked) => updatePreference({ includeCameraParams: checked })}
            />
            <Flag
              label="光影参数"
              checked={preference.includeLightingParams}
              onChange={(checked) => updatePreference({ includeLightingParams: checked })}
            />
            <Flag
              label="角色一致性"
              checked={preference.includeConsistencyNotes}
              onChange={(checked) => updatePreference({ includeConsistencyNotes: checked })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generatePack} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
              <SparklesIcon data-icon="inline-start" />
              生成分镜 Prompt 包
            </Button>
            <Button variant="outline" onClick={copyAll} disabled={!pack} className="border-white/10 bg-white/[0.03] text-zinc-200">
              复制全部
            </Button>
            <Button variant="outline" onClick={exportTXT} disabled={!pack} className="border-white/10 bg-white/[0.03] text-zinc-200">
              <FileTextIcon data-icon="inline-start" />
              导出 txt
              <DownloadIcon data-icon="inline-end" />
            </Button>
            <Button variant="outline" onClick={exportJSON} disabled={!pack} className="border-white/10 bg-white/[0.03] text-zinc-200">
              <FileJsonIcon data-icon="inline-start" />
              导出 json
              <DownloadIcon data-icon="inline-end" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {pack && (
        <>
          <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
            <CardHeader>
              <CardTitle className="text-zinc-100">Prompt Pack Guide</CardTitle>
              <CardDescription>{toolLabels[pack.preference.tool]} / {pack.preference.aspectRatio}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Info label="Global Style Guide" value={pack.globalStyleGuide} />
              <Info label="Character Consistency Guide" value={pack.characterConsistencyGuide} />
            </CardContent>
          </Card>
          <div className="grid gap-4">
            {pack.prompts.map((prompt) => (
              <AIGCPromptCard
                key={prompt.id}
                prompt={prompt}
                editedFields={editedPromptFields[prompt.id]}
                onEdit={(fieldPath, value) => editPrompt(prompt.id, fieldPath, value)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function OptionSet({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[][]
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel className="text-zinc-100">{label}</FieldLabel>
      <ToggleGroup
        value={[value]}
        onValueChange={(next) => next.at(-1) && onChange(next.at(-1) ?? value)}
        className="flex flex-wrap"
        variant="outline"
        size="sm"
        spacing={1}
      >
        {options.map(([optionValue, optionLabel]) => (
          <ToggleGroupItem key={optionValue} type="button" value={optionValue} className="border-white/10 bg-white/[0.03] text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100">
            {optionLabel}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}

function Flag({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-teal-300"
      />
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-sm leading-6 text-zinc-300">{value}</div>
    </div>
  )
}
