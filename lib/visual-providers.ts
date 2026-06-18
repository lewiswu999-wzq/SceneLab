import type { VisualGenerationProvider } from "@/lib/types"

export const implementedRemoteVisualProviders = ["image-api", "jimeng"] as const satisfies readonly VisualGenerationProvider[]
export const localVisualProviders = ["mock"] as const satisfies readonly VisualGenerationProvider[]
export const availableVisualGenerationProviders = ["image-api", "mock"] as const satisfies readonly VisualGenerationProvider[]

export type AvailableVisualGenerationProvider = (typeof availableVisualGenerationProviders)[number]
export type ImplementedRemoteVisualProvider = (typeof implementedRemoteVisualProviders)[number]

type VisualProviderMetadata = {
  label: string
  description: string
}

const visualProviderMetadata: Record<AvailableVisualGenerationProvider, VisualProviderMetadata> = {
  "image-api": {
    label: "图像流 API",
    description: "调用“API 接入”中配置的图像生成通道，不限定供应商。",
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
