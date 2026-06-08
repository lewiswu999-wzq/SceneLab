"use client"

import { EditableField } from "@/components/agent/EditableField"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { applyUserEdit } from "@/lib/editable-agent"
import type { EditableAgentRunResult, EditableModule } from "@/lib/types"

type EditableWorkbenchPanelProps = {
  result: EditableAgentRunResult
  onChange: (result: EditableAgentRunResult) => void
}

function isLocked(
  result: EditableAgentRunResult,
  module: EditableModule,
  targetId: string,
  fieldPath: string
) {
  return result.lockedFields.some(
    (field) =>
      field.module === module && field.targetId === targetId && field.fieldPath === fieldPath
  )
}

function isEdited(
  result: EditableAgentRunResult,
  module: EditableModule,
  targetId: string,
  fieldPath: string
) {
  return result.userEdits.some(
    (edit) => edit.module === module && edit.targetId === targetId && edit.fieldPath === fieldPath
  )
}

function saveField(
  result: EditableAgentRunResult,
  onChange: (result: EditableAgentRunResult) => void,
  module: EditableModule,
  targetId: string,
  fieldPath: string,
  oldValue: unknown,
  newValue: unknown,
  editNote?: string
) {
  onChange(
    applyUserEdit(result, {
      module,
      targetId,
      fieldPath,
      oldValue,
      newValue,
      editNote,
    })
  )
}

type FieldDef = {
  fieldPath: string
  label: string
  type?: "text" | "textarea" | "number" | "select"
  options?: string[]
}

function Editable({
  result,
  onChange,
  module,
  targetId,
  field,
  value,
}: {
  result: EditableAgentRunResult
  onChange: (result: EditableAgentRunResult) => void
  module: EditableModule
  targetId: string
  field: FieldDef
  value: string | number
}) {
  return (
    <EditableField
      module={module}
      targetId={targetId}
      fieldPath={field.fieldPath}
      label={field.label}
      value={value}
      type={field.type}
      options={field.options}
      locked={isLocked(result, module, targetId, field.fieldPath)}
      edited={isEdited(result, module, targetId, field.fieldPath)}
      onSave={(newValue, editNote) =>
        saveField(result, onChange, module, targetId, field.fieldPath, value, newValue, editNote)
      }
    />
  )
}

export function EditableWorkbenchPanel({ result, onChange }: EditableWorkbenchPanelProps) {
  const { analysis } = result

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-lg border border-white/10 bg-zinc-950/70 ring-0">
        <CardHeader>
          <CardTitle className="text-zinc-100">可编辑工作台</CardTitle>
          <CardDescription>用户编辑会自动锁定，Agent 后续重生成不会覆盖。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Section title="场景切片">
            {analysis.scenes.map((scene) => (
              <Card key={scene.id} className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-100">{scene.title}</CardTitle>
                  <CardDescription>{scene.id}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {[
                    { fieldPath: "title", label: "场景名称" },
                    { fieldPath: "location", label: "地点" },
                    { fieldPath: "timeOfDay", label: "时间" },
                    { fieldPath: "summary", label: "场景摘要", type: "textarea" as const },
                    { fieldPath: "emotionValue", label: "情绪值", type: "number" as const },
                    { fieldPath: "rhythmValue", label: "节奏值", type: "number" as const },
                    { fieldPath: "keyLine", label: "关键句" },
                  ].map((field) => (
                    <Editable
                      key={`${scene.id}-${field.fieldPath}`}
                      result={result}
                      onChange={onChange}
                      module={field.fieldPath === "emotionValue" ? "emotionCurve" : "scenes"}
                      targetId={scene.id}
                      field={field}
                      value={scene[field.fieldPath as keyof typeof scene] as string | number}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </Section>

          <Section title="人物设定">
            <div className="grid gap-3 md:grid-cols-2">
              {analysis.characters.map((character) => (
                <Card key={character.id} className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
                  <CardHeader>
                    <CardTitle className="text-base text-zinc-100">{character.name}</CardTitle>
                    <CardDescription>{character.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {[
                      { fieldPath: "name", label: "姓名" },
                      { fieldPath: "role", label: "角色定位" },
                      { fieldPath: "goal", label: "目标", type: "textarea" as const },
                      { fieldPath: "currentEmotion", label: "当前情绪" },
                      { fieldPath: "note", label: "备注", type: "textarea" as const },
                    ].map((field) => (
                      <Editable
                        key={`${character.id}-${field.fieldPath}`}
                        result={result}
                        onChange={onChange}
                        module="characters"
                        targetId={character.id}
                        field={field}
                        value={character[field.fieldPath as keyof typeof character] as string | number}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="人物关系">
            <div className="grid gap-3 md:grid-cols-2">
              {analysis.relationships.map((relationship, index) => {
                const targetId = `relationship-${index}`
                return (
                  <Card key={targetId} className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
                    <CardHeader>
                      <CardTitle className="text-base text-zinc-100">
                        {relationship.from} {"->"} {relationship.to}
                      </CardTitle>
                      <CardDescription>{targetId}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <Editable result={result} onChange={onChange} module="relationships" targetId={targetId} field={{ fieldPath: "label", label: "关系标签" }} value={relationship.label} />
                      <Editable result={result} onChange={onChange} module="relationships" targetId={targetId} field={{ fieldPath: "tension", label: "张力", type: "number" }} value={relationship.tension} />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </Section>

          <Section title="节奏建议">
            {analysis.rhythm.map((rhythm) => (
              <Card key={rhythm.sceneId} className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-100">{rhythm.sceneId}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <Editable result={result} onChange={onChange} module="rhythm" targetId={rhythm.sceneId} field={{ fieldPath: "rhythmType", label: "节奏类型", type: "select", options: ["slow", "medium", "fast", "explosive"] }} value={rhythm.rhythmType} />
                  <Editable result={result} onChange={onChange} module="rhythm" targetId={rhythm.sceneId} field={{ fieldPath: "editingSuggestion", label: "剪辑建议", type: "textarea" }} value={rhythm.editingSuggestion} />
                  <Editable result={result} onChange={onChange} module="rhythm" targetId={rhythm.sceneId} field={{ fieldPath: "reason", label: "原因", type: "textarea" }} value={rhythm.reason} />
                </CardContent>
              </Card>
            ))}
          </Section>

          <Section title="镜头建议 / 声音 / AI Prompt">
            {analysis.shotSuggestions.map((shot) => (
              <Card key={shot.sceneId} className="rounded-lg border border-white/10 bg-white/[0.025] ring-0">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-100">{shot.sceneId}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {[
                    { fieldPath: "shotSize", label: "景别" },
                    { fieldPath: "cameraAngle", label: "机位" },
                    { fieldPath: "cameraMovement", label: "运动方式" },
                    { fieldPath: "lighting", label: "光影" },
                    { fieldPath: "colorTone", label: "色调" },
                    { fieldPath: "soundDesign", label: "声音设计", type: "textarea" as const, module: "soundDesign" as const },
                    { fieldPath: "aiVideoPrompt", label: "AI 视频 Prompt", type: "textarea" as const, module: "aigcPrompts" as const },
                  ].map((field) => (
                    <Editable
                      key={`${shot.sceneId}-${field.fieldPath}`}
                      result={result}
                      onChange={onChange}
                      module={field.module ?? "shotSuggestions"}
                      targetId={shot.sceneId}
                      field={field}
                      value={shot[field.fieldPath as keyof typeof shot] as string | number}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </Section>
        </CardContent>
      </Card>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
      {children}
    </section>
  )
}
