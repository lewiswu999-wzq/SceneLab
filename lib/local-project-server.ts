import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import type {
  LocalProjectSnapshot,
  LocalProjectSummary,
  SaveLocalProjectInput,
} from "@/lib/local-project-types"
import { upstreamFetch } from "@/lib/upstream-fetch"

const PROJECT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/
const IMAGE_FIELDS = new Set(["imageUrl", "referenceImageUrl"])

function projectsRoot() {
  return (
    process.env.SCENELAB_PROJECTS_DIR ??
    path.join(
      process.env.USERPROFILE ?? process.env.HOME ?? ".",
      "Documents",
      "SceneLab Projects"
    )
  )
}

function assertProjectId(projectId: string) {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error("项目 ID 无效")
  }
  return projectId
}

function projectDirectory(projectId: string) {
  return path.join(projectsRoot(), assertProjectId(projectId))
}

function projectFile(projectId: string) {
  return path.join(projectDirectory(projectId), "project.json")
}

function inferTitle(payload: SaveLocalProjectInput) {
  const text =
    payload.analysis.overview.summary.trim() ||
    payload.input.sourceText.trim() ||
    "未命名项目"
  return text.replace(/\s+/g, " ").slice(0, 36)
}

function countImages(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0
  }
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countImages(item), 0)
  }
  return Object.entries(value).reduce(
    (total, [key, item]) =>
      total +
      (IMAGE_FIELDS.has(key) && typeof item === "string" && item.length > 0 ? 1 : 0) +
      countImages(item),
    0
  )
}

function extensionFor(contentType: string, source: string) {
  if (contentType.includes("svg") || source.startsWith("data:image/svg")) return ".svg"
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg"
  if (contentType.includes("webp")) return ".webp"
  if (contentType.includes("gif")) return ".gif"
  return ".png"
}

async function readDataImage(value: string) {
  const match = value.match(/^data:(image\/[^;,]+)(;base64)?,([\s\S]*)$/)
  if (!match) return null
  return {
    contentType: match[1],
    data: match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf8"),
  }
}

async function localizeImage(
  projectId: string,
  value: string,
  assetsDirectory: string
) {
  if (value.startsWith(`/api/projects/${projectId}/assets/`)) {
    return value
  }

  let contentType = ""
  let data: Buffer
  const dataImage = await readDataImage(value)

  if (dataImage) {
    contentType = dataImage.contentType
    data = dataImage.data
  } else {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      return value
    }
    if (url.protocol !== "https:") {
      return value
    }
    const response = await upstreamFetch(url.toString(), {
      headers: { Accept: "image/*" },
    })
    contentType = response.headers.get("content-type") ?? ""
    if (!response.ok || !contentType.startsWith("image/")) {
      return value
    }
    data = Buffer.from(await response.arrayBuffer())
  }

  const hash = createHash("sha256").update(data).digest("hex").slice(0, 24)
  const filename = `${hash}${extensionFor(contentType, value)}`
  const target = path.join(assetsDirectory, filename)
  try {
    await stat(target)
  } catch {
    await writeFile(target, data)
  }
  return `/api/projects/${projectId}/assets/${filename}`
}

async function localizeImages(
  projectId: string,
  value: unknown,
  assetsDirectory: string,
  imageCache: Map<string, Promise<string>>
): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) =>
        localizeImages(projectId, item, assetsDirectory, imageCache)
      )
    )
  }
  if (!value || typeof value !== "object") {
    return value
  }

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, item]) => {
      if (IMAGE_FIELDS.has(key) && typeof item === "string" && item) {
        let localizedImage = imageCache.get(item)
        if (!localizedImage) {
          localizedImage = localizeImage(projectId, item, assetsDirectory)
          imageCache.set(item, localizedImage)
        }
        return [key, await localizedImage] as const
      }
      return [
        key,
        await localizeImages(projectId, item, assetsDirectory, imageCache),
      ] as const
    })
  )
  return Object.fromEntries(entries)
}

export async function listProjects(): Promise<LocalProjectSummary[]> {
  await mkdir(projectsRoot(), { recursive: true })
  const entries = await readdir(projectsRoot(), { withFileTypes: true })
  const projects = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && PROJECT_ID_PATTERN.test(entry.name))
      .map(async (entry) => {
        try {
          const project = JSON.parse(
            await readFile(projectFile(entry.name), "utf8")
          ) as LocalProjectSnapshot
          return {
            id: project.id,
            title: project.title,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            sceneCount: project.analysis.scenes.length,
            imageCount: countImages(project.agentResult?.visualState),
          }
        } catch {
          return null
        }
      })
  )
  return projects
    .filter((project): project is LocalProjectSummary => Boolean(project))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function readProject(projectId: string) {
  return JSON.parse(
    await readFile(projectFile(projectId), "utf8")
  ) as LocalProjectSnapshot
}

export async function saveProject(payload: SaveLocalProjectInput) {
  const projectId = payload.projectId
    ? assertProjectId(payload.projectId)
    : `project-${randomUUID()}`
  const directory = projectDirectory(projectId)
  const sourceDirectory = path.join(directory, "source")
  const assetsDirectory = path.join(directory, "assets")
  await Promise.all([
    mkdir(sourceDirectory, { recursive: true }),
    mkdir(assetsDirectory, { recursive: true }),
  ])

  let existing: LocalProjectSnapshot | undefined
  try {
    existing = await readProject(projectId)
  } catch {
    existing = undefined
  }

  const now = new Date().toISOString()
  const localized = (await localizeImages(
    projectId,
    payload,
    assetsDirectory,
    new Map()
  )) as SaveLocalProjectInput
  const project: LocalProjectSnapshot = {
    schemaVersion: 1,
    id: projectId,
    title: existing?.title ?? inferTitle(payload),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    input: localized.input,
    analysis: localized.analysis,
    agentResult: localized.agentResult,
  }

  const temporaryFile = path.join(directory, "project.json.tmp")
  await Promise.all([
    writeFile(path.join(sourceDirectory, "source.txt"), payload.input.sourceText, "utf8"),
    writeFile(temporaryFile, JSON.stringify(project, null, 2), "utf8"),
  ])
  await rename(temporaryFile, projectFile(projectId))
  return project
}

export function resolveProjectAsset(projectId: string, filename: string) {
  assertProjectId(projectId)
  if (!/^[a-f0-9]{24}\.(png|jpg|webp|gif|svg)$/.test(filename)) {
    throw new Error("资源文件名无效")
  }
  return path.join(projectDirectory(projectId), "assets", filename)
}
