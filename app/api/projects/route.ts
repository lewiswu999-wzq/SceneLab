import type { SaveLocalProjectInput } from "@/lib/local-project-types"
import { listProjects, saveProject } from "@/lib/local-project-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({ projects: await listProjects() })
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SaveLocalProjectInput
    if (!payload?.input?.sourceText || !payload.analysis) {
      return Response.json({ error: "项目数据不完整" }, { status: 400 })
    }
    return Response.json(await saveProject(payload))
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "本地项目保存失败" },
      { status: 500 }
    )
  }
}
