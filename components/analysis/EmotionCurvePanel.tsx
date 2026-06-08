import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SceneSlice } from "@/lib/types"

type EmotionCurvePanelProps = {
  scenes: SceneSlice[]
}

export function EmotionCurvePanel({ scenes }: EmotionCurvePanelProps) {
  const width = 720
  const height = 260
  const padding = 36
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  const points = scenes.map((scene, index) => {
    const x = padding + (usableWidth / Math.max(1, scenes.length - 1)) * index
    const y = padding + usableHeight - (scene.emotionValue / 100) * usableHeight
    return { x, y, scene }
  })
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Emotion Curve</CardTitle>
        <CardDescription>横轴为场景，纵轴为情绪强度</CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="情绪曲线"
          className="w-full"
        >
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padding + usableHeight - (value / 100) * usableHeight
            return (
              <g key={value}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
                <text x={10} y={y + 4} fill="rgba(161,161,170,0.75)" fontSize="11">
                  {value}
                </text>
              </g>
            )
          })}
          <path d={path} fill="none" stroke="rgba(45,212,191,0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`${path} L ${points.at(-1)?.x ?? padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="rgba(45,212,191,0.08)" />
          {points.map((point, index) => (
            <g key={point.scene.id}>
              <circle cx={point.x} cy={point.y} r="6" fill="#09090b" stroke="#fda4af" strokeWidth="3" />
              <text x={point.x} y={height - 14} textAnchor="middle" fill="rgba(212,212,216,0.78)" fontSize="11">
                S{index + 1}
              </text>
              <text x={point.x} y={point.y - 13} textAnchor="middle" fill="#fecdd3" fontSize="12">
                {point.scene.emotionValue}
              </text>
              <title>
                {point.scene.title}：{point.scene.emotionValue}
              </title>
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  )
}
