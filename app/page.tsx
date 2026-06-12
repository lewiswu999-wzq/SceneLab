import {
  ClapperboardIcon,
  FileTextIcon,
  ScanSearchIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react"

import { TextInputForm } from "@/components/input/TextInputForm"

const previewItems = [
  { icon: ScanSearchIcon, title: "剧本分析", description: "结构、冲突、人物与情绪" },
  { icon: ClapperboardIcon, title: "镜头设计", description: "景别、机位、运动与时间线" },
  { icon: SparklesIcon, title: "Prompt Expert", description: "融合生成最终视觉 Prompt" },
  { icon: WandSparklesIcon, title: "视觉生成", description: "分镜、风格版本与概念海报" },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="app-titlebar">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileTextIcon className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-50">SceneLab</div>
              <div className="text-[11px] text-zinc-500">AI PRE-PRODUCTION WORKSPACE</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            本地工作区
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] lg:min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-10 xl:px-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6">
              <div className="text-xs font-medium text-primary">新建项目</div>
              <h1 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
                从剧本开始视觉预演
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                输入故事文本，SceneLab 会建立可继续编辑的分析、镜头与视觉工作区。
              </p>
            </div>
            <div className="workspace-panel p-4 sm:p-6">
              <TextInputForm />
            </div>
          </div>
        </section>

        <aside className="border-t border-white/10 bg-[#0b0d0e] px-5 py-7 lg:border-l lg:border-t-0 lg:px-6 lg:py-10">
          <div className="sticky top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">项目流程</h2>
              <span className="font-mono text-[10px] text-zinc-600">4 STAGES</span>
            </div>
            <div className="grid gap-1">
              {previewItems.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  className="group grid min-h-16 grid-cols-[2rem_1fr] items-center gap-3 border-b border-white/[0.07] py-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.025] text-zinc-500 group-hover:text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-200">{title}</span>
                      <span className="font-mono text-[10px] text-zinc-700">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 border-l-2 border-primary/60 pl-3">
              <div className="text-xs font-medium text-zinc-300">Prompt Expert 已启用</div>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                不同视觉版本会使用独立风格证据生成最终 Prompt。
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
