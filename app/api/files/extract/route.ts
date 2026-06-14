import mammoth from "mammoth"
import { extractText, getDocumentProxy } from "unpdf"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 25 * 1024 * 1024

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "请选择文件" }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "文件不能超过 25 MB" }, { status: 413 })
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ""
    let pageCount: number | undefined

    if (extension === "txt" || extension === "md") {
      text = buffer.toString("utf8").replace(/^\uFEFF/, "")
    } else if (extension === "docx") {
      text = (await mammoth.extractRawText({ buffer })).value
    } else if (extension === "pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const extracted = await extractText(pdf, { mergePages: true })
      text = extracted.text
      pageCount = extracted.totalPages
    } else {
      return Response.json(
        { error: "支持 TXT、Markdown、PDF 和 DOCX 文件" },
        { status: 415 }
      )
    }

    text = normalizeText(text)
    if (!text) {
      return Response.json(
        { error: "没有从文件中识别到可分析的文本" },
        { status: 422 }
      )
    }

    return Response.json({
      filename: file.name,
      text,
      pageCount,
      characterCount: text.length,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "文件读取失败" },
      { status: 500 }
    )
  }
}
