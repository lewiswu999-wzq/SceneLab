import type { ElementType } from "react"

type FeatureIntroPanelProps = {
  icon: ElementType
  title: string
  description: string
  details: string[]
}

export function FeatureIntroPanel({
  icon: Icon,
  title,
  description,
  details,
}: FeatureIntroPanelProps) {
  return (
    <section className="grid gap-4 border-b border-white/10 pb-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-100">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-zinc-400">{description}</p>
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-2 pl-12 sm:grid-cols-2 xl:grid-cols-3">
        {details.map((detail) => (
          <div key={detail} className="flex items-start gap-2 text-xs leading-5 text-zinc-500">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-amber-300/80" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
