# SceneLab｜剧本显微镜

本地运行的影视文本分析与可视化工具。输入小说、剧本、短剧文案或故事梗概后，生成场景切片、人物关系、情绪曲线、节奏分析、镜头建议和可导出的 Markdown / JSON。

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- DeepSeek API with local mock fallback

## DeepSeek V3 Setup

Create `.env.local`:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

`deepseek-v4-flash` is the default model used by the app. You can override it with any model ID supported by your DeepSeek account.

Restart the dev server after changing `.env.local`.

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Behavior

- `POST /api/analyze` runs on the server and never exposes `DEEPSEEK_API_KEY` to the browser.
- If `DEEPSEEK_API_KEY` is missing or the request fails, the app falls back to the local mock analyzer.
- Exported Markdown includes the provider/model used for that analysis.
