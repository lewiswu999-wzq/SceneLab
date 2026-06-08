import type { VisualGenerationProvider } from "@/lib/types"

export const implementedRemoteVisualProviders = ["jimeng"] as const satisfies readonly VisualGenerationProvider[]
export const localVisualProviders = ["mock"] as const satisfies readonly VisualGenerationProvider[]
export const availableVisualGenerationProviders = ["jimeng", "mock"] as const satisfies readonly VisualGenerationProvider[]

export type AvailableVisualGenerationProvider = (typeof availableVisualGenerationProviders)[number]
export type ImplementedRemoteVisualProvider = (typeof implementedRemoteVisualProviders)[number]

type VisualProviderMetadata = {
  label: string
  description: string
}

const visualProviderMetadata: Record<AvailableVisualGenerationProvider, VisualProviderMetadata> = {
  jimeng: {
    label: "即梦 API",
    description: "通过服务端 /api/visual/generate 调用已配置的即梦图像模型。",
  },
  mock: {
    label: "本地 SVG 预览",
    description: "仅在浏览器生成占位预览，不调用外部模型，也不消耗 API 额度。",
  },
}

export const visualProviderOptions = availableVisualGenerationProviders.map((value) => ({
  value,
  ...visualProviderMetadata[value],
}))

export function getVisualProviderLabel(provider: VisualGenerationProvider) {
  return visualProviderMetadata[provider as AvailableVisualGenerationProvider]?.label ?? provider
}

export function isImplementedRemoteVisualProvider(
  provider: VisualGenerationProvider
): provider is ImplementedRemoteVisualProvider {
  return (implementedRemoteVisualProviders as readonly VisualGenerationProvider[]).includes(provider)
}
