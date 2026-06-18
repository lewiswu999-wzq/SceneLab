"use client"

import { ACTIVE_PROJECT_KEY, STORAGE_KEY } from "@/lib/constants"
import type {
  LocalProjectSnapshot,
  LocalProjectSummary,
  SaveLocalProjectInput,
} from "@/lib/local-project-types"

export async function listLocalProjects() {
  const response = await fetch("/api/projects", { cache: "no-store" })
  if (!response.ok) {
    throw new Error("无法读取本地项目")
  }
  return (await response.json()) as { projects: LocalProjectSummary[] }
}

export async function loadLocalProject(projectId: string) {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("无法打开本地项目")
  }
  return (await response.json()) as LocalProjectSnapshot
}

export async function saveLocalProject(payload: SaveLocalProjectInput) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("无法保存本地项目")
  }
  return (await response.json()) as LocalProjectSnapshot
}

export function getActiveProjectId() {
  return window.localStorage.getItem(ACTIVE_PROJECT_KEY) ?? undefined
}

export function activateLocalProject(project: LocalProjectSnapshot) {
  window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id)
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      input: project.input,
      analysis: project.analysis,
      agentResult: project.agentResult,
    })
  )
}
