"use client"

import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearApiSettings,
  defaultApiSettings,
  getApiSettingsStorageLabel,
  loadApiSettings,
  saveApiSettings,
  type ApiProviderSettings,
  type ApiSettings,
} from "@/lib/api-settings"
import { cn } from "@/lib/utils"

type ApiSettingsButtonProps = {
  compact?: boolean
  className?: string
}

function maskedSuffix(apiKey: string) {
  return apiKey ? `•••• ${apiKey.slice(-4)}` : "未配置"
}

function ProviderFields({
  title,
  description,
  value,
  onChange,
  showKey,
  onToggleKey,
  baseUrlPlaceholder,
  modelPlaceholder,
}: {
  title: string
  description: string
  value: ApiProviderSettings
  onChange: (next: ApiProviderSettings) => void
  showKey: boolean
  onToggleKey: () => void
  baseUrlPlaceholder: string
  modelPlaceholder: string
}) {
  const configured = Boolean(value.apiKey && value.baseUrl && value.model)

  return (
    <section className="border-b border-white/10 py-5 last:border-b-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
        <div
          className={cn(
            "flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px]",
            configured
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/[0.025] text-zinc-600"
          )}
        >
          {configured ? <CheckCircle2Icon className="size-3.5" /> : <KeyRoundIcon className="size-3.5" />}
          {maskedSuffix(value.apiKey)}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${title}-key`}>API Key</Label>
          <div className="relative">
            <Input
              id={`${title}-key`}
              type={showKey ? "text" : "password"}
              autoComplete="off"
              value={value.apiKey}
              onChange={(event) => onChange({ ...value, apiKey: event.target.value })}
              placeholder="输入 API Key"
              className="h-10 rounded-md border-white/10 bg-black/25 pr-10"
            />
            <button
              type="button"
              onClick={onToggleKey}
              className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
              aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}
            >
              {showKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)]">
          <div className="grid gap-2">
            <Label htmlFor={`${title}-base-url`}>Base URL</Label>
            <Input
              id={`${title}-base-url`}
              value={value.baseUrl}
              onChange={(event) => onChange({ ...value, baseUrl: event.target.value })}
              placeholder={baseUrlPlaceholder}
              className="h-10 rounded-md border-white/10 bg-black/25"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${title}-model`}>模型</Label>
            <Input
              id={`${title}-model`}
              value={value.model}
              onChange={(event) => onChange({ ...value, model: event.target.value })}
              placeholder={modelPlaceholder}
              className="h-10 rounded-md border-white/10 bg-black/25"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ApiSettingsButton({ compact = false, className }: ApiSettingsButtonProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<ApiSettings>(defaultApiSettings)
  const [showDeepseekKey, setShowDeepseekKey] = useState(false)
  const [showJimengKey, setShowJimengKey] = useState(false)
  const [storageLabel, setStorageLabel] = useState("本地存储")

  useEffect(() => {
    if (!open) {
      return
    }
    let active = true
    Promise.all([loadApiSettings(), Promise.resolve(getApiSettingsStorageLabel())]).then(
      ([stored, label]) => {
        if (active) {
          setSettings(stored)
          setStorageLabel(label)
        }
      }
    )
    return () => {
      active = false
    }
  }, [open])

  async function handleSave() {
    await saveApiSettings(settings)
    toast.success("API 设置已保存")
    setOpen(false)
  }

  async function handleClear() {
    await clearApiSettings()
    setSettings(defaultApiSettings)
    toast.success("已清除客户端 API 设置")
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon-sm" : "sm"}
        onClick={() => setOpen(true)}
        className={cn("border-white/10 bg-white/[0.025] text-zinc-400 hover:text-zinc-100", className)}
        aria-label="API 设置"
      >
        <Settings2Icon />
        {!compact ? "API 设置" : null}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 p-3 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-settings-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-md border border-white/10 bg-[#101315] shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#101315]/96 px-5 py-4 backdrop-blur">
              <div>
                <h2 id="api-settings-title" className="text-base font-semibold text-zinc-50">
                  API 设置
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <ShieldCheckIcon className="size-3.5 text-primary" />
                  {storageLabel}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="关闭 API 设置"
              >
                <XIcon />
              </Button>
            </header>

            <div className="px-5">
              <ProviderFields
                title="DeepSeek"
                description="用于剧本结构、人物、节奏和镜头分析。未配置或调用失败时会回退到本地 mock。"
                value={settings.deepseek}
                onChange={(deepseek) => setSettings((current) => ({ ...current, deepseek }))}
                showKey={showDeepseekKey}
                onToggleKey={() => setShowDeepseekKey((value) => !value)}
                baseUrlPlaceholder="https://api.deepseek.com"
                modelPlaceholder="deepseek-v4-flash"
              />
              <ProviderFields
                title="即梦"
                description="用于视觉分镜和概念海报。Base URL 应指向兼容 images/generations 的服务。"
                value={settings.jimeng}
                onChange={(jimeng) => setSettings((current) => ({ ...current, jimeng }))}
                showKey={showJimengKey}
                onToggleKey={() => setShowJimengKey((value) => !value)}
                baseUrlPlaceholder="https://..."
                modelPlaceholder="图像模型名称"
              />
            </div>

            <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-white/10 bg-[#101315]/96 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="text-zinc-500 hover:text-rose-300"
              >
                <Trash2Icon />
                清除设置
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="button" onClick={handleSave} className="bg-primary text-primary-foreground">
                  保存设置
                </Button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
