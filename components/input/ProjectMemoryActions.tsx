"use client"

import {
  FilePlus2Icon,
  FolderClockIcon,
  Loader2Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  activateLocalProject,
  listLocalProjects,
  loadLocalProject,
} from "@/lib/local-project-client"
import type { LocalProjectSummary } from "@/lib/local-project-types"

type ProjectMemoryActionsProps = {
  onTextImported: (text: string, filename: string) => void
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function ProjectMemoryActions({
  onTextImported,
}: ProjectMemoryActionsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [latestProject, setLatestProject] = useState<LocalProjectSummary>()
  const [isImporting, setIsImporting] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  useEffect(() => {
    void listLocalProjects()
      .then(({ projects }) => setLatestProject(projects[0]))
      .catch(() => setLatestProject(undefined))
  }, [])

  async function handleFile(file?: File) {
    if (!file) return
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const response = await fetch("/api/files/extract", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as {
        text?: string
        filename?: string
        error?: string
      }
      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? "文件读取失败")
      }
      onTextImported(payload.text, payload.filename ?? file.name)
      toast.success(`已读取 ${payload.filename ?? file.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "文件读取失败")
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleContinue() {
    if (!latestProject) return
    setIsOpening(true)
    try {
      const project = await loadLocalProject(latestProject.id)
      activateLocalProject(project)
      router.push("/agent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法继续本地项目")
      setIsOpening(false)
    }
  }

  return (
    <div className="grid gap-3 border-b border-white/10 pb-5 sm:grid-cols-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
        className="min-h-14 justify-start border-white/10 bg-white/[0.025] px-4 text-left hover:border-primary/25 hover:bg-primary/[0.06]"
      >
        {isImporting ? (
          <Loader2Icon className="size-5 animate-spin text-primary" />
        ) : (
          <FilePlus2Icon className="size-5 text-primary" />
        )}
        <span className="grid gap-0.5">
          <span className="text-sm text-zinc-100">添加剧本文件</span>
          <span className="text-xs font-normal text-zinc-500">
            TXT、Markdown、PDF 或 DOCX
          </span>
        </span>
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!latestProject || isOpening}
        onClick={() => void handleContinue()}
        className="min-h-14 justify-start border-white/10 bg-white/[0.025] px-4 text-left hover:border-primary/25 hover:bg-primary/[0.06]"
      >
        {isOpening ? (
          <Loader2Icon className="size-5 animate-spin text-primary" />
        ) : (
          <FolderClockIcon className="size-5 text-primary" />
        )}
        <span className="min-w-0 grid gap-0.5">
          <span className="text-sm text-zinc-100">继续上次项目</span>
          <span className="truncate text-xs font-normal text-zinc-500">
            {latestProject
              ? `${latestProject.title} · ${formatUpdatedAt(latestProject.updatedAt)}`
              : "暂无本地项目"}
          </span>
        </span>
      </Button>
    </div>
  )
}
