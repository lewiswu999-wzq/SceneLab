import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TextInputForm } from "@/components/input/TextInputForm"

const previewItems = [
  ["场景切片", "4+ 个可拍摄段落"],
  ["情绪曲线", "SVG 直观标记峰值"],
  ["人物关系", "节点与张力标签"],
  ["镜头建议", "景别、机位、声音、Prompt"],
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.10),transparent_34%),linear-gradient(180deg,#09090b_0%,#0d0d10_58%,#080809_100%)] text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-50 sm:text-5xl">
              SceneLab｜剧本显微镜
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              把故事拆开，看见节奏、情绪、人物和镜头。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-300">
              Local first
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-300">
              Mock analyzer
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-300">
              Open-source vibe
            </Badge>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card className="rounded-lg border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40 ring-0">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-lg text-zinc-100">输入文本</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <TextInputForm />
            </CardContent>
          </Card>

          <aside className="flex flex-col gap-4">
            <Card className="rounded-lg border border-white/10 bg-zinc-950/60 ring-0">
              <CardHeader>
                <CardTitle className="text-base text-zinc-100">分析输出</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {previewItems.map(([title, description], index) => (
                  <div key={title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] font-mono text-xs text-teal-200">
                      0{index + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-zinc-100">{title}</span>
                      <span className="text-sm text-zinc-500">{description}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-white/10 bg-black/35 ring-0">
              <CardContent className="flex flex-col gap-4 pt-4">
                <div className="font-mono text-xs uppercase tracking-normal text-zinc-500">
                  workflow
                </div>
                <Separator className="bg-white/10" />
                <div className="grid gap-3 text-sm text-zinc-400">
                  <p>1. 输入片段并选择类型、深度、风格。</p>
                  <p>2. 浏览 dashboard 式结构化分析。</p>
                  <p>3. 复制完整分析，或导出 Markdown / JSON。</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  )
}
