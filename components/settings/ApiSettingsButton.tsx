"use client"

import {
  BracesIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  KeyRoundIcon,
  Loader2Icon,
  ScanSearchIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import type { ElementType } from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearApiSettings,
  defaultApiSettings,
  getApiRequestHeaders,
  getApiSettingsStorageLabel,
  loadApiSettings,
  saveApiSettings,
  type ApiIdentity,
  type ApiSettings,
  type ApiStream,
  type ApiStreamSettings,
} from "@/lib/api-settings"
import { cn } from "@/lib/utils"

type ApiSettingsButtonProps = {
  compact?: boolean
  className?: string
}

const streamMetadata: Record<
  ApiStream,
  {
    title: string
    description: string
    icon: ElementType
    pathPlaceholder: string
  }
> = {
  text: {
    title: "文字流 API",
    description: "用于剧本分析、Prompt 推理，并负责识别三个通道的模型来源。",
    icon: BracesIcon,
    pathPlaceholder: "/chat/completions",
  },
  image: {
    title: "图像流 API",
    description: "用于分镜图、多版本对比和概念海报，不限定即梦或其他供应商。",
    icon: ImageIcon,
    pathPlaceholder: "/images/generations",
  },
  video: {
    title: "视频流 API",
    description: "单独保存视频生成通道；当前视觉预演仍是 Storyboard Reel，不冒充真实视频生成。",
    icon: VideoIcon,
    pathPlaceholder: "/videos/generations",
  },
}

function maskedSuffix(apiKey: string) {
  return apiKey ? `•••• ${apiKey.slice(-4)}` : "未配置"
}

function IdentityBadge({ identity }: { identity?: ApiIdentity }) {
  if (!identity) {
    return null
  }
  const confidenceLabel = {
    high: "高置信",
    medium: "中置信",
    low: "低置信",
  }[identity.confidence]

  return (
    <div className="mt-3 grid gap-1 rounded-md border border-primary/15 bg-primary/[0.06] px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-primary">
        <ScanSearchIcon className="size-3.5" />
        <span>{identity.provider}</span>
        <span className="text-zinc-600">/</span>
        <span>{identity.model}</span>
        <span className="text-[10px] text-zinc-500">{confidenceLabel}</span>
      </div>
      <div className="text-zinc-500">
        {identity.apiStyle} · {identity.note}
      </div>
    </div>
  )
}

function StreamFields({
  stream,
  value,
  identity,
  onChange,
  showKey,
  onToggleKey,
}: {
  stream: ApiStream
  value: ApiStreamSettings
  identity?: ApiIdentity
  onChange: (next: ApiStreamSettings) => void
  showKey: boolean
  onToggleKey: () => void
}) {
  const metadata = streamMetadata[stream]
  const Icon = metadata.icon
  const configured = Boolean(value.apiKey && value.baseUrl && value.model)

  return (
    <section className="border-b border-white/10 py-5 last:border-b-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.025] text-zinc-400">
            <Icon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{metadata.title}</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{metadata.description}</p>
          </div>
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
          <Label htmlFor={`${stream}-key`}>API Key</Label>
          <div className="relative">
            <Input
              id={`${stream}-key`}
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
              aria-label={showKey ? `隐藏${metadata.title} Key` : `显示${metadata.title} Key`}
            >
              {showKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${stream}-base-url`}>Base URL</Label>
            <Input
              id={`${stream}-base-url`}
              value={value.baseUrl}
              onChange={(event) => onChange({ ...value, baseUrl: event.target.value })}
              placeholder="https://api.example.com/v1"
              className="h-10 rounded-md border-white/10 bg-black/25"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${stream}-model`}>模型</Label>
            <Input
              id={`${stream}-model`}
              value={value.model}
              onChange={(event) => onChange({ ...value, model: event.target.value })}
              placeholder="输入模型 ID"
              className="h-10 rounded-md border-white/10 bg-black/25"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${stream}-path`}>接口路径</Label>
          <Input
            id={`${stream}-path`}
            value={value.apiPath}
            onChange={(event) => onChange({ ...value, apiPath: event.target.value })}
            placeholder={metadata.pathPlaceholder}
            className="h-10 rounded-md border-white/10 bg-black/25 font-mono text-xs"
          />
        </div>
      </div>
      <IdentityBadge identity={identity} />
    </section>
  )
}

export function ApiSettingsButton({ compact = false, className }: ApiSettingsButtonProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<ApiSettings>(defaultApiSettings)
  const [showKey, setShowKey] = useState<Record<ApiStream, boolean>>({
    text: false,
    image: false,
    video: false,
  })
  const [storageLabel, setStorageLabel] = useState("本地存储")
  const [detecting, setDetecting] = useState(false)

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

  function updateStream(stream: ApiStream, value: ApiStreamSettings) {
    setSettings((current) => ({ ...current, [stream]: value }))
  }

  async function handleDetect() {
    if (!settings.text.apiKey || !settings.text.baseUrl || !settings.text.model) {
      toast.error("请先完整填写文字流 API")
      return
    }
    setDetecting(true)
    try {
      await saveApiSettings(settings)
      const response = await fetch("/api/settings/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getApiRequestHeaders()),
        },
        body: JSON.stringify({
          text: {
            baseUrl: settings.text.baseUrl,
            model: settings.text.model,
            apiPath: settings.text.apiPath,
          },
          image: {
            baseUrl: settings.image.baseUrl,
            model: settings.image.model,
            apiPath: settings.image.apiPath,
          },
          video: {
            baseUrl: settings.video.baseUrl,
            model: settings.video.model,
            apiPath: settings.video.apiPath,
          },
        }),
      })
      const payload = (await response.json()) as {
        identities?: ApiSettings["identities"]
        error?: string
      }
      if (!response.ok || !payload.identities) {
        throw new Error(payload.error ?? "API 识别失败")
      }
      const next = { ...settings, identities: payload.identities }
      setSettings(next)
      await saveApiSettings(next)
      toast.success("文字流已完成 API 识别")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "API 识别失败")
    } finally {
      setDetecting(false)
    }
  }

  async function handleSave() {
    await saveApiSettings(settings)
    toast.success("API 接入设置已保存")
    setOpen(false)
  }

  async function handleClear() {
    await clearApiSettings()
    setSettings(defaultApiSettings)
    toast.success("已清除三个 API 通道")
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "border-white/10 bg-white/[0.025] text-zinc-400 hover:text-zinc-100",
          compact && "px-2.5",
          className
        )}
        aria-label="API 接入"
      >
        <Settings2Icon />
        API 接入
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
            className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-md border border-white/10 bg-[#101315] shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#101315]/96 px-5 py-4 backdrop-blur">
              <div>
                <h2 id="api-settings-title" className="text-base font-semibold text-zinc-50">
                  API 接入
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <ShieldCheckIcon className="size-3.5 text-primary" />
                  {storageLabel} · 三个通道互相独立
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="关闭 API 接入"
              >
                <XIcon />
              </Button>
            </header>

            <div className="px-5">
              {(["text", "image", "video"] as const).map((stream) => (
                <StreamFields
                  key={stream}
                  stream={stream}
                  value={settings[stream]}
                  identity={settings.identities?.[stream]}
                  onChange={(value) => updateStream(stream, value)}
                  showKey={showKey[stream]}
                  onToggleKey={() =>
                    setShowKey((current) => ({ ...current, [stream]: !current[stream] }))
                  }
                />
              ))}
            </div>

            <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-white/10 bg-[#101315]/96 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="text-zinc-500 hover:text-rose-300"
              >
                <Trash2Icon />
                清除
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetect}
                  disabled={detecting}
                >
                  {detecting ? <Loader2Icon className="animate-spin" /> : <ScanSearchIcon />}
                  {detecting ? "识别中" : "让文字流识别"}
                </Button>
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
