"use client"

import { WandSparklesIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { reviseSceneLabResult } from "@/lib/scenelab-agent"
import type {
  AgentRunResult,
  FeedbackTargetModule,
  RevisedAgentRunResult,
  UserFeedback,
} from "@/lib/types"

const targetOptions: Array<{ value: FeedbackTargetModule; label: string }> = [
  { value: "overall", label: "整体" },
  { value: "overview", label: "概览" },
  { value: "scenes", label: "场景" },
  { value: "characters", label: "人物" },
  { value: "relationships", label: "关系" },
  { value: "emotionCurve", label: "情绪曲线" },
  { value: "rhythm", label: "节奏" },
  { value: "shotSuggestions", label: "镜头建议" },
  { value: "aigcPrompts", label: "AIGC Prompt" },
]

type FeedbackRevisionPanelProps = {
  result: AgentRunResult
  onRevised: (result: RevisedAgentRunResult) => void
}

export function FeedbackRevisionPanel({ result, onRevised }: FeedbackRevisionPanelProps) {
  const [targetModule, setTargetModule] = useState<FeedbackTargetModule>("overall")
  const [adjustmentStrength, setAdjustmentStrength] = useState<UserFeedback["adjustmentStrength"]>("medium")
  const [feedbackText, setFeedbackText] = useState("整体风格再悬疑一点，后半段情绪更强。")
  const [keepOriginalStructure, setKeepOriginalStructure] = useState(true)

  function submitFeedback() {
    const feedback: UserFeedback = {
      targetModule,
      feedbackText,
      adjustmentStrength,
      keepOriginalStructure,
    }
    onRevised(reviseSceneLabResult(result, feedback))
  }

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">反馈调整</CardTitle>
        <CardDescription>基于当前报告、原始输入和反馈，生成保留历史的修正版。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Field>
          <FieldLabel className="text-zinc-100">反馈目标模块</FieldLabel>
          <ToggleGroup
            value={[targetModule]}
            onValueChange={(value) => value.at(-1) && setTargetModule(value.at(-1) as FeedbackTargetModule)}
            className="flex flex-wrap"
            variant="outline"
            size="sm"
            spacing={1}
          >
            {targetOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                type="button"
                value={option.value}
                className="border-white/10 bg-white/[0.03] px-3 text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel className="text-zinc-100">反馈内容</FieldLabel>
          <Textarea
            value={feedbackText}
            onChange={(event) => setFeedbackText(event.target.value)}
            className="min-h-32 border-white/10 bg-black/30 text-zinc-100 focus-visible:border-teal-300/40 focus-visible:ring-teal-300/15"
            placeholder="例如：第三个场景节奏太慢，镜头建议更适合短视频一些。"
          />
          <FieldDescription>不会丢弃原报告，会生成版本记录和修改前后快照。</FieldDescription>
        </Field>

        <Field>
          <FieldLabel className="text-zinc-100">调整强度</FieldLabel>
          <ToggleGroup
            value={[adjustmentStrength]}
            onValueChange={(value) =>
              value.at(-1) && setAdjustmentStrength(value.at(-1) as UserFeedback["adjustmentStrength"])
            }
            className="flex flex-wrap"
            variant="outline"
            size="sm"
            spacing={1}
          >
            <ToggleGroupItem type="button" value="light" className="border-white/10 bg-white/[0.03] text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100">
              轻微
            </ToggleGroupItem>
            <ToggleGroupItem type="button" value="medium" className="border-white/10 bg-white/[0.03] text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100">
              中等
            </ToggleGroupItem>
            <ToggleGroupItem type="button" value="strong" className="border-white/10 bg-white/[0.03] text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100">
              明显
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
          <span>保持原始结构，不改变场景/人物/关系数量</span>
          <input
            type="checkbox"
            checked={keepOriginalStructure}
            onChange={(event) => setKeepOriginalStructure(event.target.checked)}
            className="size-4 accent-teal-300"
          />
        </label>

        <Button onClick={submitFeedback} disabled={!feedbackText.trim()} className="bg-teal-300 text-zinc-950 hover:bg-teal-200">
          <WandSparklesIcon data-icon="inline-start" />
          提交反馈并自动调整
        </Button>
      </CardContent>
    </Card>
  )
}
