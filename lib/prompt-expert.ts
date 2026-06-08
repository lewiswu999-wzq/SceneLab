import type {
  Character,
  PromptExpertFusion,
  SceneSlice,
  ShotSuggestion,
  StoryboardVariantStyle,
} from "@/lib/types"

type StyleRecipe = {
  label: string
  palette: string
  light: string
  lens: string
  composition: string
  texture: string
  mood: string
  lockedDifference: string
}

const styleRecipes: Record<StoryboardVariantStyle, StyleRecipe> = {
  "cinematic-realism": {
    label: "cinematic realism",
    palette: "restrained charcoal, rain-muted teal, practical warm accents",
    light: "motivated practical light with soft falloff and believable low-key shadows",
    lens: "35mm full-frame lens, natural perspective, shallow but usable depth of field",
    composition: "layered foreground, middle-ground subject, readable background geography",
    texture: "lived-in surfaces, dust, damp fabric, worn cinema seats",
    mood: "truthful, tense, restrained performance realism",
    lockedDifference: "natural motivated light, lived-in props, restrained actor-first blocking",
  },
  "cold-suspense": {
    label: "cold suspense",
    palette: "blue-green shadows, desaturated gray, small sickly amber practicals",
    light: "cold overhead spill, hard shadow edges, wet reflective highlights",
    lens: "50mm compressed perspective with foreground obstruction",
    composition: "large negative space and off-center subject placement",
    texture: "rain-streaked glass, concrete dampness, peeling poster paper",
    mood: "unseen threat, pressure, delayed revelation",
    lockedDifference: "negative space, cold color temperature, reflective threat outside frame",
  },
  "warm-realism": {
    label: "warm realism",
    palette: "tungsten amber, old wood brown, softened skin warmth",
    light: "warm practical lamp light with gentle shadow rolloff",
    lens: "50mm naturalist lens, intimate shallow depth of field",
    composition: "closer blocking, shared human space, less negative distance",
    texture: "old fabric, paper, fingerprints, worn personal objects",
    mood: "vulnerability, memory, fragile trust",
    lockedDifference: "human warmth, intimate distance, tactile memory objects",
  },
  "neon-noir": {
    label: "neon noir",
    palette: "cyan and magenta edge light against deep black",
    light: "neon rim light, glossy reflections, high contrast shadow color",
    lens: "35mm night street lens with reflective foreground planes",
    composition: "diagonal tension, glass layers, subject split by reflections",
    texture: "wet pavement, chrome, glass, smoke, electric signage glow",
    mood: "danger, desire, urban secrecy",
    lockedDifference: "saturated neon edge light, glossy reflection layers, noir diagonals",
  },
  documentary: {
    label: "documentary realism",
    palette: "available-light neutrals, imperfect white balance, muted location color",
    light: "existing ambient light, no obvious stylized key light",
    lens: "handheld 35mm observational lens with slight motion imperfection",
    composition: "caught moment framing, subject not over-posed",
    texture: "natural grain, real location clutter, imperfect exposure",
    mood: "present-tense observation and grounded reality",
    lockedDifference: "handheld observation, available light, imperfect real-location texture",
  },
  dreamlike: {
    label: "dreamlike poetic realism",
    palette: "soft violet haze, pale cyan memory glow, low-contrast highlights",
    light: "diffuse glow with softened shadow logic",
    lens: "soft-focus lens with gentle edge bloom",
    composition: "slightly suspended spatial relationship and memory-like depth",
    texture: "haze, dust motes, softened rain, translucent reflections",
    mood: "uncanny memory, grief, suspended time",
    lockedDifference: "soft memory haze, suspended spatial logic, poetic unreality",
  },
  "minimal-artfilm": {
    label: "minimal art-film",
    palette: "near-black, cool gray, one restrained accent color",
    light: "single motivated light source with austere shadow shape",
    lens: "static 50mm or 65mm lens, precise geometric framing",
    composition: "architectural negative space, sparse subject placement",
    texture: "plain wall, empty floor, clean silhouette, quiet air",
    mood: "silence, isolation, withheld emotion",
    lockedDifference: "austere geometry, sparse composition, long-hold silence",
  },
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function characterLine(scene: SceneSlice, characters: Character[]) {
  const sceneCharacterIds = scene.characters ?? []
  const sceneCharacters = characters.filter(
    (character) => sceneCharacterIds.includes(character.name) || sceneCharacterIds.includes(character.id)
  )

  if (!sceneCharacters.length) {
    return sceneCharacterIds.join(", ") || "no named characters"
  }

  return sceneCharacters
    .map((character) => `${character.name}: ${character.role}, current emotion ${character.currentEmotion}, goal ${character.goal}`)
    .join("; ")
}

export function getPromptExpertStyleRecipe(style: StoryboardVariantStyle) {
  return styleRecipes[style] ?? styleRecipes["cinematic-realism"]
}

export function buildPromptExpertFusion({
  scene,
  shot,
  characters,
  style,
  aspectRatio = "16:9",
  upstreamStoryboardPrompt,
  upstreamStylePrompt,
}: {
  scene: SceneSlice
  shot: ShotSuggestion
  characters: Character[]
  style: StoryboardVariantStyle
  aspectRatio?: string
  upstreamStoryboardPrompt?: string
  upstreamStylePrompt?: string
}): PromptExpertFusion {
  const recipe = getPromptExpertStyleRecipe(style)
  const charactersText = characterLine(scene, characters)
  const sceneText = `${scene.title}. ${scene.location}, ${scene.timeOfDay}. ${scene.summary}`
  const lighting = shot.lighting || "motivated scene lighting"
  const colorTone = shot.colorTone || recipe.palette
  const soundDesign = shot.soundDesign || "scene-appropriate ambient sound"
  const shotText = `${shot.shotSize}, ${shot.cameraAngle}, ${shot.cameraMovement}. Lighting: ${lighting}. Color: ${colorTone}. Sound mood: ${soundDesign}.`

  const storyboardPrompt =
    upstreamStoryboardPrompt ??
    compact(
      `${aspectRatio}. AI Video Storyboard pass. Scene action: ${sceneText}. ` +
        `Camera plan: ${shotText}. Characters: ${charactersText}. ` +
        "Preserve action continuity, screen direction, readable blocking, and character identity across shots."
    )

  const stylePrompt =
    upstreamStylePrompt ??
    compact(
      `Style variant pass: ${recipe.label}. Palette: ${recipe.palette}. Light: ${recipe.light}. ` +
        `Lens: ${recipe.lens}. Composition: ${recipe.composition}. Texture: ${recipe.texture}. Mood: ${recipe.mood}. ` +
        `Visible difference anchor: ${recipe.lockedDifference}.`
    )

  const finalPrompt = compact(
    `${aspectRatio}. Film storyboard frame, ${recipe.label}. ${sceneText}. ` +
      `Camera and blocking: ${shotText}; ${recipe.lens}; ${recipe.composition}. ` +
      `Primary visual recipe: ${recipe.lockedDifference}. Style lock: ${style}. ` +
      `Lighting and color: ${recipe.light}; palette of ${recipe.palette}. ` +
      `Environment texture: ${recipe.texture}. ` +
      `Characters: ${charactersText}; preserve the same actor identity, face structure, hairstyle silhouette, body type, and costume logic. ` +
      `Emotional direction: ${recipe.mood}. ` +
      "Readable foreground, middle ground, and background; subject position is clear; designed as a shootable storyboard frame, not a poster. " +
      "No text, no subtitle, no logo, no watermark. " +
      "Negative: face drift, different actor, random hairstyle change, unexplained age shift, inconsistent body type, unexplained costume redesign, " +
      "poster layout, marketing key art, generic cinematic wallpaper, extra limbs, plastic skin, text, watermark."
  )

  return {
    storyboardPrompt,
    stylePrompt,
    finalPrompt,
    fusionNotes: [
      "锁定故事动作、人物身份、场景地点和镜头连续性。",
      `风格差异由 ${recipe.label} 的色彩、光源、镜头、构图、材质和情绪共同承担。`,
      "prompt-master 融合层移除重复形容词，只保留一个负面约束块。",
    ],
  }
}
