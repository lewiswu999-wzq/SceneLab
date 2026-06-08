"use client"

import { RefreshCcwIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  describeRegenerationScope,
  detectAffectedModules,
  editableModuleLabel,
  regenerateFromUserEdits,
} from "@/lib/editable-agent"
import type { EditableAgentRunResult, RegenerationRequest, RegenerationScope } from "@/lib/types"

type RegenerateFromEditsPanelProps = {
  result: EditableAgentRunResult
  onChange: (result: EditableAgentRunResult) => void
}

const scopes: RegenerationScope[] = [
  "affectedOnly",
  "currentModule",
  "downstreamModules",
  "fullReportPreserveUserEdits",
]

export function RegenerateFromEditsPanel({ result, onChange }: RegenerateFromEditsPanelProps) {
  const [scope, setScope] = useState<RegenerationScope>("downstreamModules")
  const [instruction, setInstruction] = useState("后续内容整体更偏悬疑，但不要改我手动调整过的内容。")
  const sourceEditIds = result.userEdits.filter((edit) => edit.locked).map((edit) => edit.id)
  const request: RegenerationRequest = useMemo(
    () => ({ sourceEditIds, scope, instruction }),
    [sourceEditIds, scope, instruction]
  )
  const affectedModules = useMemo(() => detectAffectedModules(result, request), [result, request])

  function regenerate() {
    onChange(regenerateFromUserEdits(result, request))
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">根据修改重生成</CardTitle>
        <CardDescription>只重算受影响的后续内容，并保留所有用户锁定字段。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field>
          <FieldLabel className="text-zinc-100">重生成范围</FieldLabel>
          <ToggleGroup
            value={[scope]}
            onValueChange={(value) => value.at(-1) && setScope(value.at(-1) as RegenerationScope)}
            className="flex flex-wrap"
            variant="outline"
            size="sm"
            spacing={1}
          >
            {scopes.map((item) => (
              <ToggleGroupItem key={item} type="button" value={item} className="border-white/10 bg-white/[0.03] text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100">
                {describeRegenerationScope(item)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel className="text-zinc-100">额外指令</FieldLabel>
          <Textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            className="min-h-24 border-white/10 bg-black/30 text-zinc-100"
          />
        </Field>

        <div className="grid gap-3 lg:grid-cols-2">
          <InfoList
            title="将保留的用户修改字段"
            items={result.lockedFields.map((field) => `${editableModuleLabel(field.module)} / ${field.targetId} / ${field.fieldPath}`)}
          />
          <InfoList
            title="预计更新模块"
            items={affectedModules.map((module) => editableModuleLabel(module))}
          />
        </div>

        <Button onClick={regenerate} disabled={result.lockedFields.length === 0} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
          <RefreshCcwIcon data-icon="inline-start" />
          根据我的修改重新生成
        </Button>
      </CardContent>
    </Card>
  )
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 text-xs text-zinc-500">{title}</div>
      <div className="flex flex-col gap-1">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-600">暂无</div>
        ) : (
          items.map((item) => (
            <div key={item} className="font-mono text-xs text-zinc-300">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
