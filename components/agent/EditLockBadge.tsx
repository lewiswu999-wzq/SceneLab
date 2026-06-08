import type { LockedField } from "@/lib/types"

type EditLockBadgeProps = {
  locked?: boolean
  edited?: boolean
  field?: LockedField
}

export function EditLockBadge({ locked, edited, field }: EditLockBadgeProps) {
  const label = locked
    ? "已锁定"
    : edited
      ? "用户已修改"
      : "AI 生成"
  const detail = locked
    ? "后续重生成将保留"
    : edited
      ? "可继续锁定"
      : "可编辑"

  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400">
      <span className={locked ? "text-teal-200" : edited ? "text-amber-200" : "text-zinc-500"}>
        {label}
      </span>
      <span className="text-zinc-600">/</span>
      <span>{field?.reason === "user-locked" ? "用户手动锁定" : detail}</span>
    </span>
  )
}
