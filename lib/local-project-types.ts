import type { EditableAgentRunResult, SceneAnalysis, TextInput } from "@/lib/types"

export type LocalProjectSnapshot = {
  schemaVersion: 1
  id: string
  title: string
  createdAt: string
  updatedAt: string
  input: TextInput
  analysis: SceneAnalysis
  agentResult?: EditableAgentRunResult
}

export type LocalProjectSummary = Pick<
  LocalProjectSnapshot,
  "id" | "title" | "createdAt" | "updatedAt"
> & {
  sceneCount: number
  imageCount: number
}

export type SaveLocalProjectInput = {
  projectId?: string
  input: TextInput
  analysis: SceneAnalysis
  agentResult?: EditableAgentRunResult
}
