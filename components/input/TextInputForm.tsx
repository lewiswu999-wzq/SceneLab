"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, FlaskConicalIcon, Loader2Icon, RotateCcwIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  ANALYSIS_DEPTHS,
  DEFAULT_INPUT,
  STORAGE_KEY,
  STORY_STYLES,
  TEXT_TYPES,
} from "@/lib/constants"
import type { SceneAnalysis, TextInput } from "@/lib/types"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  sourceText: z.string().min(20, "至少输入 20 个字符，显微镜才有东西可看。"),
  textType: z.enum(TEXT_TYPES),
  analysisDepth: z.enum(ANALYSIS_DEPTHS),
  style: z.enum(STORY_STYLES),
})

type FormValues = z.infer<typeof formSchema>

type OptionGroupProps = {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  compact?: boolean
}

function OptionGroup({ value, onChange, options, compact }: OptionGroupProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(nextValue) => {
        const selected = nextValue.at(-1)
        if (selected) {
          onChange(selected)
        }
      }}
      className={cn("flex flex-wrap", compact && "max-w-xl")}
      variant="outline"
      size="sm"
      spacing={1}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          type="button"
          value={option}
          className="border-white/10 bg-white/[0.03] px-3 text-zinc-300 data-pressed:bg-teal-400/15 data-pressed:text-teal-100 data-pressed:ring-1 data-pressed:ring-teal-300/30"
        >
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function TextInputForm() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_INPUT,
  })
  const sourceText = useWatch({
    control: form.control,
    name: "sourceText",
  })

  async function onSubmit(values: FormValues) {
    const input: TextInput = values

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "分析请求失败")
      }

      const payload = (await response.json()) as {
        analysis: SceneAnalysis
        source: "deepseek" | "mock"
        fallbackReason?: string
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          analysis: payload.analysis,
        })
      )

      if (payload.source === "deepseek") {
        toast.success("DeepSeek V3 分析完成")
      } else {
        toast.warning(`已使用本地 mock fallback：${payload.fallbackReason ?? "未配置 DeepSeek"}`)
      }

      router.push("/analysis")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "分析请求失败")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.sourceText)}>
          <div className="flex items-end justify-between gap-3">
            <FieldLabel htmlFor="sourceText" className="text-zinc-100">
              片段输入
            </FieldLabel>
            <span className="font-mono text-xs text-zinc-500">
              {sourceText.length} chars
            </span>
          </div>
          <Textarea
            id="sourceText"
            aria-invalid={Boolean(form.formState.errors.sourceText)}
            {...form.register("sourceText")}
            className="min-h-72 resize-y border-white/10 bg-black/30 font-mono text-sm leading-7 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-teal-300/40 focus-visible:ring-teal-300/15 md:min-h-[420px]"
            placeholder="粘贴小说、剧本、短剧文案或故事梗概..."
          />
          <FieldDescription>
            优先调用服务端 DeepSeek V3；未配置 API key 或请求失败时自动回退到本地 mock。
          </FieldDescription>
          <FieldError errors={[form.formState.errors.sourceText]} />
        </Field>

        <Field>
          <FieldLabel className="text-zinc-100">文本类型</FieldLabel>
          <Controller
            control={form.control}
            name="textType"
            render={({ field }) => (
              <OptionGroup value={field.value} onChange={field.onChange} options={TEXT_TYPES} />
            )}
          />
        </Field>

        <Field>
          <FieldLabel className="text-zinc-100">分析深度</FieldLabel>
          <Controller
            control={form.control}
            name="analysisDepth"
            render={({ field }) => (
              <OptionGroup
                value={field.value}
                onChange={field.onChange}
                options={ANALYSIS_DEPTHS}
              />
            )}
          />
        </Field>

        <Field>
          <FieldLabel className="text-zinc-100">影像风格</FieldLabel>
          <Controller
            control={form.control}
            name="style"
            render={({ field }) => (
              <OptionGroup
                value={field.value}
                onChange={field.onChange}
                options={STORY_STYLES}
                compact
              />
            )}
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => form.reset(DEFAULT_INPUT)}
          className="justify-start text-zinc-400 hover:text-zinc-100"
        >
          <RotateCcwIcon data-icon="inline-start" />
          恢复示例
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="bg-teal-300 text-zinc-950 hover:bg-teal-200"
        >
          {form.formState.isSubmitting ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : (
            <FlaskConicalIcon data-icon="inline-start" />
          )}
          {form.formState.isSubmitting ? "DeepSeek 分析中" : "开始分析"}
          {!form.formState.isSubmitting && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </div>
    </form>
  )
}
