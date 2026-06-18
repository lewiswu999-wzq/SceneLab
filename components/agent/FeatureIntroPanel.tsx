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
    <section className="grid gap-3 border-b border-white/10 pb-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="hidden gap-x-6 gap-y-2 pl-11 md:grid md:grid-cols-3">
        {details.map((detail) => (
          <div key={detail} className="flex items-start gap-2 text-xs leading-5 text-zinc-600">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
