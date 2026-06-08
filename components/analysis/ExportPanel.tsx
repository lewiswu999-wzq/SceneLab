import { ClipboardCopyIcon, DownloadIcon, FileJsonIcon, FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ExportPanelProps = {
  onCopy: () => void
  onExportMarkdown: () => void
  onExportJSON: () => void
}

export function ExportPanel({ onCopy, onExportMarkdown, onExportJSON }: ExportPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Export</CardTitle>
        <CardDescription>复制完整分析，或导出本地文件</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={onCopy} className="border-white/10 bg-white/[0.03] text-zinc-200">
          <ClipboardCopyIcon data-icon="inline-start" />
          复制完整分析
        </Button>
        <Button variant="outline" onClick={onExportMarkdown} className="border-white/10 bg-white/[0.03] text-zinc-200">
          <FileTextIcon data-icon="inline-start" />
          导出 Markdown
          <DownloadIcon data-icon="inline-end" />
        </Button>
        <Button variant="outline" onClick={onExportJSON} className="border-white/10 bg-white/[0.03] text-zinc-200">
          <FileJsonIcon data-icon="inline-start" />
          导出 JSON
          <DownloadIcon data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  )
}
