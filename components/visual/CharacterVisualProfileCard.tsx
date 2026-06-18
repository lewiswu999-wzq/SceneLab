"use client"

import { CopyIcon, LockIcon, UnlockIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { copyToClipboard } from "@/lib/export"
import type { CharacterVisualProfile } from "@/lib/types"

const editableFields: Array<keyof CharacterVisualProfile> = [
  "ageRange",
  "hairstyle",
  "faceKeywords",
  "clothing",
  "colorPalette",
  "temperament",
  "bodyLanguage",
  "referenceImageUrl",
  "consistencyPrompt",
  "negativeConsistencyPrompt",
]

const labels: Record<string, string> = {
  ageRange: "年龄段",
  hairstyle: "发型",
  faceKeywords: "面部关键词",
  clothing: "服装",
  colorPalette: "色彩",
  temperament: "气质",
  bodyLanguage: "肢体语言",
  referenceImageUrl: "参考图 URL",
  consistencyPrompt: "Consistency Prompt",
  negativeConsistencyPrompt: "Negative Prompt",
}

type CharacterVisualProfileCardProps = {
  profile: CharacterVisualProfile
  onChange: (profile: CharacterVisualProfile) => void
  onToggleLock: (field: string) => void
  onRegenerate: () => void
}

export function CharacterVisualProfileCard({
  profile,
  onChange,
  onToggleLock,
  onRegenerate,
}: CharacterVisualProfileCardProps) {
  async function copyPrompt() {
    await copyToClipboard(profile.consistencyPrompt)
    toast.success("已复制角色一致性 Prompt")
  }

  function update(field: keyof CharacterVisualProfile, value: string) {
    onChange({
      ...profile,
      [field]: value,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base text-zinc-100">
          <span>{profile.name}</span>
          <span className="rounded border border-white/10 px-2 py-0.5 text-xs text-zinc-500">
            已锁定 {profile.lockedFields.length} 项
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {editableFields.map((field) => {
          const locked = profile.lockedFields.includes(field)
          const value = String(profile[field] ?? "")
          const long = field.includes("Prompt") || field === "bodyLanguage" || field === "faceKeywords"
          return (
            <label key={field} className="grid gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-400">{labels[field]}</span>
                <Button size="icon-xs" variant="ghost" className="text-zinc-400" onClick={() => onToggleLock(field)}>
                  {locked ? <LockIcon /> : <UnlockIcon />}
                </Button>
              </div>
              {long ? (
                <Textarea
                  value={value}
                  disabled={locked}
                  onChange={(event) => update(field, event.target.value)}
                  className="min-h-20 border-white/10 bg-black/25 text-sm text-zinc-200 disabled:opacity-70"
                />
              ) : (
                <Input
                  value={value}
                  disabled={locked}
                  onChange={(event) => update(field, event.target.value)}
                  className="border-white/10 bg-black/25 text-sm text-zinc-200 disabled:opacity-70"
                />
              )}
            </label>
          )
        })}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={onRegenerate}>
            重新生成档案
          </Button>
          <Button size="sm" variant="ghost" className="text-zinc-300" onClick={copyPrompt}>
            <CopyIcon data-icon="inline-start" />
            复制 Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
