import Image from "next/image"

import { cn } from "@/lib/utils"

type SceneLabBrandProps = {
  className?: string
  compact?: boolean
  subtitle?: string
}

export function SceneLabBrand({
  className,
  compact = false,
  subtitle = "AI PRE-PRODUCTION WORKSPACE",
}: SceneLabBrandProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f7f8f8]",
          compact ? "size-8" : "size-9"
        )}
      >
        <Image
          src="/brand/scenelab-mark.svg"
          alt=""
          width={compact ? 25 : 28}
          height={compact ? 25 : 28}
          priority
        />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-sm font-semibold text-zinc-50">
          SceneLab Agent
        </span>
        {subtitle ? (
          <span className="truncate text-[10px] tracking-[0.08em] text-zinc-500">
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  )
}
