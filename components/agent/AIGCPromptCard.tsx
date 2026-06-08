"use client"

import { ClipboardCopyIcon } from "lucide-react"
import { toast } from "sonner"

import { EditableField } from "@/components/agent/EditableField"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { copyToClipboard } from "@/lib/export"
import type { AIGCStoryboardPrompt } from "@/lib/types"

function promptToText(prompt: AIGCStoryboardPrompt) {
  return [
    prompt.title,
    `Main Prompt:\n${prompt.mainPrompt}`,
    prompt.negativePrompt ? `Negative Prompt:\n${prompt.negativePrompt}` : undefined,
    prompt.cameraPrompt ? `Camera:\n${prompt.cameraPrompt}` : undefined,
    prompt.lightingPrompt ? `Lighting:\n${prompt.lightingPrompt}` : undefined,
    prompt.stylePrompt ? `Style:\n${prompt.stylePrompt}` : undefined,
    prompt.characterConsistencyPrompt
      ? `Character Consistency:\n${prompt.characterConsistencyPrompt}`
      : undefined,
    prompt.parameters ? `Parameters:\n${prompt.parameters}` : undefined,
    `Usage Tip:\n${prompt.usageTip}`,
  ]
    .filter(Boolean)
    .join("\n\n")
}

type AIGCPromptCardProps = {
  prompt: AIGCStoryboardPrompt
  editedFields?: string[]
  onEdit?: (fieldPath: keyof AIGCStoryboardPrompt, value: unknown) => void
}

export function AIGCPromptCard({ prompt, editedFields = [], onEdit }: AIGCPromptCardProps) {
  async function copyPrompt() {
    await copyToClipboard(promptToText(prompt))
    toast.success("已复制该场景 Prompt")
  }

  function editable(
    fieldPath: keyof AIGCStoryboardPrompt,
    label: string,
    value: string | undefined,
    type: "text" | "textarea" = "textarea"
  ) {
    if (!value) {
      return null
    }
    if (!onEdit) {
      return <InfoBlock label={label} value={value} />
    }
    return (
      <EditableField
        module="aigcPrompts"
        targetId={prompt.id}
        fieldPath={fieldPath}
        label={label}
        value={value}
        type={type}
        locked={editedFields.includes(fieldPath)}
        edited={editedFields.includes(fieldPath)}
        onSave={(newValue) => onEdit(fieldPath, newValue)}
      />
    )
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
      <CardHeader>
        <CardTitle className="text-base text-zinc-100">{prompt.title}</CardTitle>
        <CardDescription>{prompt.usageTip}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {editable("mainPrompt", "Main Prompt", prompt.mainPrompt)}
        {editable("negativePrompt", "Negative Prompt", prompt.negativePrompt)}
        {editable("cameraPrompt", "Camera Prompt", prompt.cameraPrompt, "text")}
        {editable("lightingPrompt", "Lighting Prompt", prompt.lightingPrompt, "text")}
        {editable("stylePrompt", "Style Prompt", prompt.stylePrompt)}
        {editable("characterConsistencyPrompt", "Consistency Prompt", prompt.characterConsistencyPrompt)}
        {editable("parameters", "Parameters", prompt.parameters, "text")}
        {editable("usageTip", "Usage Tip", prompt.usageTip)}
        <Button variant="outline" onClick={copyPrompt} className="w-fit border-white/10 bg-white/[0.03] text-zinc-200">
          <ClipboardCopyIcon data-icon="inline-start" />
          复制
        </Button>
      </CardContent>
    </Card>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{value}</div>
    </div>
  )
}
