import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Character, Relationship } from "@/lib/types"

type CharacterPanelProps = {
  characters: Character[]
  relationships: Relationship[]
}

export function CharacterPanel({ characters, relationships }: CharacterPanelProps) {
  return (
    <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
      <CardHeader>
        <CardTitle className="text-zinc-100">Characters</CardTitle>
        <CardDescription>人物定位、目标、情绪和关系备注</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {characters.map((character) => {
          const relationNotes = relationships
            .filter((item) => item.from === character.name || item.to === character.name)
            .map((item) => `${item.from === character.name ? item.to : item.from}：${item.label}`)
            .join(" / ")

          return (
            <article key={character.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-teal-300/15 font-semibold text-teal-100">
                  {character.name.slice(0, 1)}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-medium text-zinc-100">{character.name}</h3>
                  <span className="text-xs text-zinc-500">{character.role}</span>
                </div>
              </div>
              <div className="grid gap-2 text-sm leading-6 text-zinc-300">
                <p>
                  <span className="text-zinc-500">目标：</span>
                  {character.goal}
                </p>
                <p>
                  <span className="text-zinc-500">情绪：</span>
                  {character.currentEmotion}
                </p>
                <p>
                  <span className="text-zinc-500">关系：</span>
                  {relationNotes || "待观察"}
                </p>
                <p className="text-zinc-500">{character.note}</p>
              </div>
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}
