import { readFile } from "node:fs/promises"
import path from "node:path"

import { resolveProjectAsset } from "@/lib/local-project-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]/assets/[filename]">
) {
  try {
    const { projectId, filename } = await context.params
    const file = await readFile(resolveProjectAsset(projectId, filename))
    return new Response(file, {
      headers: {
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Type": CONTENT_TYPES[path.extname(filename)] ?? "application/octet-stream",
      },
    })
  } catch {
    return Response.json({ error: "找不到本地资源" }, { status: 404 })
  }
}
