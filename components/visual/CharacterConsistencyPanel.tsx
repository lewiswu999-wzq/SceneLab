"use client"

import { CopyIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CharacterVisualProfileCard } from "@/components/visual/CharacterVisualProfileCard"
import {
  buildCharacterVisualProfiles,
  createCharacterConsistencyPack,
  toggleCharacterProfileFieldLock,
  updateCharacterVisualProfile,
} from "@/lib/character-consistency"
import { copyToClipboard } from "@/lib/export"
import type { CharacterConsistencyPack, SceneAnalysis } from "@/lib/types"

type CharacterConsistencyPanelProps = {
  analysis: SceneAnalysis
  pack?: CharacterConsistencyPack
  onChange: (pack: CharacterConsistencyPack) => void
}

export function CharacterConsistencyPanel({
  analysis,
  pack,
  onChange,
}: CharacterConsistencyPanelProps) {
  const currentPack = pack ?? createCharacterConsistencyPack(analysis.characters, analysis.meta.style)

  function regenerateAll() {
    onChange(createCharacterConsistencyPack(analysis.characters, analysis.meta.style))
    toast.success("已生成初始角色视觉档案")
  }

  function updateProfile(profileId: string, patch: Parameters<typeof updateCharacterVisualProfile>[2]) {
    onChange({
      ...currentPack,
      profiles: updateCharacterVisualProfile(currentPack.profiles, profileId, patch),
    })
  }

  function toggleLock(profileId: string, field: string) {
    onChange({
      ...currentPack,
      profiles: toggleCharacterProfileFieldLock(currentPack.profiles, profileId, field),
    })
  }

  function regenerateProfile(profileId: string) {
    const profile = currentPack.profiles.find((item) => item.id === profileId)
    const character = analysis.characters.find((item) => item.id === profile?.characterId)
    if (!profile || !character) {
      return
    }
    const [fresh] = buildCharacterVisualProfiles([character], analysis.meta.style)
    const preserved = profile.lockedFields.reduce<Record<string, unknown>>((values, field) => {
      values[field] = profile[field as keyof typeof profile]
      return values
    }, {})
    onChange({
      ...currentPack,
      profiles: currentPack.profiles.map((item) =>
        item.id === profileId
          ? {
              ...fresh,
              ...preserved,
              id: item.id,
              lockedFields: item.lockedFields,
              updatedAt: new Date().toISOString(),
            }
          : item
      ),
    })
    toast.success("已重生成未锁定字段")
  }

  async function exportPrompt() {
    const text = [
      currentPack.globalConsistencyRule,
      ...currentPack.profiles.map((profile) => `${profile.name}: ${profile.consistencyPrompt}`),
    ].join("\n\n")
    await copyToClipboard(text)
    toast.success("已复制角色一致性 Prompt")
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <UsersIcon />
          角色一致性
        </CardTitle>
        <CardDescription>为每个角色维护视觉档案，锁定字段会优先进入后续分镜、海报和预演 prompt。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={regenerateAll} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
            生成初始视觉档案
          </Button>
          <Button variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200" onClick={exportPrompt}>
            <CopyIcon data-icon="inline-start" />
            导出一致性 Prompt
          </Button>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-zinc-300">
          {currentPack.globalConsistencyRule}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {currentPack.profiles.map((profile) => (
            <CharacterVisualProfileCard
              key={profile.id}
              profile={profile}
              onChange={(nextProfile) => updateProfile(profile.id, nextProfile)}
              onToggleLock={(field) => toggleLock(profile.id, field)}
              onRegenerate={() => regenerateProfile(profile.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
