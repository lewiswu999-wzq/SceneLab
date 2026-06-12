import type {
  Character,
  PromptExpertFusion,
  SceneSlice,
  ShotSuggestion,
  StoryboardVariantStyle,
} from "@/lib/types"

export const PROMPT_EXPERT_PIPELINE_VERSION = "prompt-expert-v3"

type StyleRecipe = {
  label: string
  renderMedium: string
  palette: string
  light: string
  lens: string
  composition: string
  texture: string
  cameraBehavior: string
  mood: string
  mustShow: string
  forbiddenBlend: string
}

const styleRecipes: Record<StoryboardVariantStyle, StyleRecipe> = {
  "cinematic-realism": {
    label: "cinematic realism",
    renderMedium: "live-action film still with physically believable materials and restrained grading",
    palette: "charcoal gray, rain-muted teal, skin-neutral midtones, one small tungsten practical",
    light: "motivated practical light, soft falloff, realistic bounce, controlled low-key shadows",
    lens: "35mm full-frame lens, natural perspective, shallow but usable depth of field",
    composition: "actor-first blocking with layered foreground, readable middle ground, and clear location geography",
    texture: "worn cinema seats, damp fabric, dust, fingerprints, aged wood and metal",
    cameraBehavior: "stable dolly or restrained handheld movement with natural motion blur",
    mood: "truthful tension and restrained human performance",
    mustShow: "believable faces, practical production design, natural skin and material response",
    forbiddenBlend: "no neon-noir saturation, no dream haze, no illustration lines, no documentary exposure mistakes",
  },
  "cold-suspense": {
    label: "cold suspense",
    renderMedium: "psychological thriller storyboard frame with severe cold tonal separation",
    palette: "blue-green shadows, desaturated steel gray, tiny sickly amber practicals",
    light: "cold overhead spill, hard-edged shadows, narrow highlights on wet reflective surfaces",
    lens: "50mm compressed perspective through a foreground obstruction",
    composition: "off-center subject occupying less than one third of frame, dominant negative space, unseen threat outside frame",
    texture: "rain-streaked glass, damp concrete, peeling paper, condensation and dark door gaps",
    cameraBehavior: "slow predatory push-in or locked frame with tension created by offscreen space",
    mood: "unseen threat, surveillance pressure and delayed revelation",
    mustShow: "cold negative space, partial occlusion and one threatening reflection",
    forbiddenBlend: "no warm intimacy, no colorful neon, no soft dream bloom, no casual documentary framing",
  },
  "warm-realism": {
    label: "warm intimate realism",
    renderMedium: "naturalistic human drama frame with tactile memory-film warmth",
    palette: "tungsten amber, old wood brown, faded cream, softly warm skin",
    light: "warm practical lamp light, gentle shadow rolloff, subtle window fill",
    lens: "50mm naturalist lens with intimate shallow depth of field",
    composition: "close relational blocking, shared frame space, faces and hands carrying the emotional beat",
    texture: "old fabric, paper, fingerprints, worn photographs and personal objects",
    cameraBehavior: "quiet shoulder-level observation or a very slow compassionate push-in",
    mood: "vulnerability, memory, fragile trust and human closeness",
    mustShow: "warm skin response, tactile personal object and reduced interpersonal distance",
    forbiddenBlend: "no cold thriller lighting, no neon edges, no harsh geometric minimalism, no surreal haze",
  },
  "neon-noir": {
    label: "neon noir",
    renderMedium: "stylized urban noir frame with saturated practical neon and glossy optical layers",
    palette: "electric cyan, saturated magenta, deep black and selective toxic violet",
    light: "cyan-magenta rim lights, colored shadow separation, hard specular reflections",
    lens: "28mm anamorphic night lens with streak flare and reflective foreground planes",
    composition: "diagonal tension, glass layers, split reflections and bold silhouette separation",
    texture: "wet pavement, chrome, glass, smoke, signage glow and rain droplets",
    cameraBehavior: "lateral glide through foreground reflections with pronounced parallax",
    mood: "danger, desire, urban secrecy and moral ambiguity",
    mustShow: "visible cyan-magenta edge light, wet glossy reflection and anamorphic flare",
    forbiddenBlend: "no naturalistic warm grade, no available-light documentary look, no muted minimal palette, no soft pastoral mood",
  },
  documentary: {
    label: "observational documentary",
    renderMedium: "unpolished location documentary frame captured in the present tense",
    palette: "available-light neutrals, imperfect white balance, muted location color",
    light: "existing ambient light only, no designed key light, slight exposure imperfection",
    lens: "handheld 35mm observational lens with modest depth of field",
    composition: "caught-moment framing, imperfect edge crops, subject not posed, real location clutter retained",
    texture: "natural grain, practical noise, imperfect exposure and unstaged surfaces",
    cameraBehavior: "responsive handheld drift with small reframing corrections",
    mood: "immediate, factual, vulnerable and grounded",
    mustShow: "handheld imperfection, available-light exposure and unposed action",
    forbiddenBlend: "no glossy neon, no theatrical key light, no dream bloom, no polished poster composition",
  },
  dreamlike: {
    label: "dreamlike poetic realism",
    renderMedium: "poetic memory image with recognizable reality softened by optical unreality",
    palette: "pale cyan memory glow, soft violet haze, pearl highlights and low-contrast shadows",
    light: "diffuse bloom, luminous haze, softened shadow logic and floating backlight",
    lens: "soft-focus 65mm lens with edge bloom and shallow drifting focus",
    composition: "suspended spatial relationships, repeated reflections and gently displaced depth",
    texture: "haze, dust motes, translucent rain, gauze-like highlights and softened surfaces",
    cameraBehavior: "weightless slow drift with a subtle rack focus that feels like remembering",
    mood: "uncanny memory, grief, suspended time and emotional ambiguity",
    mustShow: "soft optical bloom, suspended depth and one impossible memory-like reflection",
    forbiddenBlend: "no hard thriller shadows, no documentary shake, no crisp neon graphics, no severe minimal geometry",
  },
  "minimal-artfilm": {
    label: "minimal art film",
    renderMedium: "austere art-film tableau with severe reduction and architectural precision",
    palette: "near-black, cool concrete gray, off-white and one restrained accent",
    light: "one motivated source creating a single precise shadow shape",
    lens: "static 65mm lens with flat geometric discipline and deep readable space",
    composition: "architectural negative space, sparse subject placement, centered or mathematically offset tableau",
    texture: "plain wall, empty floor, clean silhouette and quiet air",
    cameraBehavior: "locked camera, no decorative movement, long-hold visual tension",
    mood: "silence, isolation, withheld emotion and formal control",
    mustShow: "large empty geometry, one isolated figure and a single controlled accent",
    forbiddenBlend: "no busy production design, no handheld shake, no neon color wash, no soft sentimental warmth",
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
    .map((character) => `${character.name}: ${character.role}, ${character.currentEmotion}, goal ${character.goal}`)
    .join("; ")
}

export function getPromptExpertStyleRecipe(style: StoryboardVariantStyle) {
  return styleRecipes[style] ?? styleRecipes["cinematic-realism"]
}

function buildStoryboardNarrativePass({
  scene,
  shot,
  charactersText,
  aspectRatio,
}: {
  scene: SceneSlice
  shot: ShotSuggestion
  charactersText: string
  aspectRatio: string
}) {
  return compact(
    `AI Video Storyboard Skill pass A - narrative and camera continuity. ${aspectRatio}. ` +
      `Scene: ${scene.title}, ${scene.location}, ${scene.timeOfDay}. Dramatic action: ${scene.summary}. ` +
      `Characters: ${charactersText}. Shot: ${shot.shotSize}, ${shot.cameraAngle}, ${shot.cameraMovement}. ` +
      `Preserve actor identity, screen direction, eyeline, action continuity, readable blocking and scene geography.`
  )
}

function buildStoryboardStylePass({
  style,
  recipe,
}: {
  style: StoryboardVariantStyle
  recipe: StyleRecipe
}) {
  return compact(
    `AI Video Storyboard Skill pass B - visual differentiation. Variant identity: ${style} / ${recipe.label}. ` +
      `Render medium: ${recipe.renderMedium}. Palette: ${recipe.palette}. Lighting: ${recipe.light}. ` +
      `Lens: ${recipe.lens}. Composition: ${recipe.composition}. Texture: ${recipe.texture}. ` +
      `Camera behavior: ${recipe.cameraBehavior}. Emotional direction: ${recipe.mood}. ` +
      `Mandatory visible evidence: ${recipe.mustShow}. Do not blend with neighboring variants: ${recipe.forbiddenBlend}.`
  )
}

function fuseWithPromptMaster({
  scene,
  shot,
  charactersText,
  style,
  recipe,
  aspectRatio,
}: {
  scene: SceneSlice
  shot: ShotSuggestion
  charactersText: string
  style: StoryboardVariantStyle
  recipe: StyleRecipe
  aspectRatio: string
}) {
  return compact(
    `[PROMPT EXPERT ${PROMPT_EXPERT_PIPELINE_VERSION} | VARIANT ${style.toUpperCase()}]. ${aspectRatio}. ` +
      `${recipe.renderMedium}. Scene: ${scene.title}, ${scene.location}, ${scene.timeOfDay}; ${scene.summary}. ` +
      `Characters: ${charactersText}; keep the exact same actor identity, face structure, hairstyle silhouette, body type and costume logic. ` +
      `Shot design: ${shot.shotSize}, ${shot.cameraAngle}, ${shot.cameraMovement}; ${recipe.cameraBehavior}; ${recipe.lens}. ` +
      `Composition: ${recipe.composition}. Color system: ${recipe.palette}. Light physics: ${recipe.light}. ` +
      `Materials and atmosphere: ${recipe.texture}. Performance mood: ${recipe.mood}. ` +
      `Mandatory style evidence in the rendered frame: ${recipe.mustShow}. ` +
      `Hard style exclusion: ${recipe.forbiddenBlend}. Do not average this variant with another visual style. ` +
      `Keep screen direction, eyeline, action match and shootable foreground-middle-ground-background staging. ` +
      `No text, subtitle, logo or watermark. Negative: face drift, different actor, random hairstyle change, age shift, ` +
      `inconsistent body type, unexplained costume redesign, generic cinematic wallpaper, poster layout, extra limbs, plastic skin.`
  )
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
  const storyboardPrompt =
    upstreamStoryboardPrompt ??
    buildStoryboardNarrativePass({ scene, shot, charactersText, aspectRatio })
  const stylePrompt =
    upstreamStylePrompt ??
    buildStoryboardStylePass({ style, recipe })
  const finalPrompt = fuseWithPromptMaster({
    scene,
    shot,
    charactersText,
    style,
    recipe,
    aspectRatio,
  })

  return {
    pipelineVersion: PROMPT_EXPERT_PIPELINE_VERSION,
    storyboardPrompt,
    stylePrompt,
    finalPrompt,
    fusionNotes: [
      "Pass A locks story, action, character identity and continuity.",
      `Pass B forces visible ${recipe.label} differences across medium, palette, lighting, lens, composition and texture.`,
      "Prompt Master removes duplication, resolves conflicts and emits one provider-ready final prompt.",
    ],
  }
}
