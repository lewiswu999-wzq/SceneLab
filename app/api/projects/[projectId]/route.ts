import { readProject } from "@/lib/local-project-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]">
) {
  try {
    const { projectId } = await context.params
    return Response.json(await readProject(projectId))
  } catch {
    return Response.json({ error: "找不到该本地项目" }, { status: 404 })
  }
}
