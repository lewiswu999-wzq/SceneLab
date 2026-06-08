import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Character, Relationship } from "@/lib/types"

type RelationshipPanelProps = {
  characters: Character[]
  relationships: Relationship[]
}

export function RelationshipPanel({ characters, relationships }: RelationshipPanelProps) {
  const width = 520
  const height = 320
  const centerX = width / 2
  const centerY = height / 2
  const radius = 108
  const nodes = characters.map((character, index) => {
    const angle = (Math.PI * 2 * index) / characters.length - Math.PI / 2
    return {
      ...character,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  })

  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Relationship Map</CardTitle>
        <CardDescription>简单节点与连线展示人物关系张力</CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="人物关系图"
          className="mx-auto w-full"
        >
          {relationships.map((relationship) => {
            const from = nodes.find((node) => node.name === relationship.from)
            const to = nodes.find((node) => node.name === relationship.to)
            if (!from || !to) {
              return null
            }
            const labelX = (from.x + to.x) / 2
            const labelY = (from.y + to.y) / 2
            return (
              <g key={`${relationship.from}-${relationship.to}-${relationship.label}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(251,191,36,0.45)"
                  strokeWidth={Math.max(1.5, relationship.tension / 34)}
                />
                <rect x={labelX - 38} y={labelY - 13} width="76" height="26" rx="6" fill="#18181b" stroke="rgba(255,255,255,0.12)" />
                <text x={labelX} y={labelY + 4} textAnchor="middle" fill="#fde68a" fontSize="12">
                  {relationship.label}
                </text>
              </g>
            )
          })}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r="38" fill="rgba(20,184,166,0.16)" stroke="rgba(94,234,212,0.5)" strokeWidth="1.5" />
              <text x={node.x} y={node.y - 2} textAnchor="middle" fill="#f4f4f5" fontSize="15" fontWeight="600">
                {node.name}
              </text>
              <text x={node.x} y={node.y + 16} textAnchor="middle" fill="rgba(212,212,216,0.7)" fontSize="10">
                {node.role}
              </text>
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  )
}
