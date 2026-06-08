export function normalizePromptForReuse(prompt: string) {
  return prompt
    .replace(/\s+/g, " ")
    .replace(/[，。；：、]/g, (mark) => {
      const map: Record<string, string> = {
        "，": ",",
        "。": ".",
        "；": ";",
        "：": ":",
        "、": ",",
      }
      return map[mark] ?? mark
    })
    .trim()
    .toLowerCase()
}

export function samePrompt(left: string, right: string) {
  return normalizePromptForReuse(left) === normalizePromptForReuse(right)
}
