import type { Character, CharacterConsistencyPack, CharacterVisualProfile } from "@/lib/types"

function now() {
  return new Date().toISOString()
}

function visualSeed(character: Character, style: string) {
  const mood = character.currentEmotion || "克制"
  return {
    hairstyle: mood.includes("焦") || mood.includes("紧") ? "略显凌乱但轮廓稳定的自然发型" : "干净利落、便于识别的稳定发型轮廓",
    faceKeywords: `${character.role}气质，眼神有目标感，面部轮廓稳定，五官比例清晰，表情贴合“${mood}”`,
    clothing: style.includes("悬疑") ? "低饱和外套，实用剪裁，暗色内搭，后续场景保持同一服装轮廓或明确换装逻辑" : "贴近日常生活的分层服装，轮廓清晰，后续场景保持可识别的服装体系",
    colorPalette: style.includes("冷") ? "冷灰、青蓝、低饱和黑" : "中性灰、暖棕、少量强调色",
    temperament: `${character.goal}驱动下的${mood}状态`,
    bodyLanguage: "站姿和动作有明确动机，避免夸张摆拍，保持影视真实感",
  }
}

export function buildCharacterVisualProfiles(characters: Character[], style: string): CharacterVisualProfile[] {
  return characters.map((character) => {
    const seed = visualSeed(character, style)
    const timestamp = now()
    const consistencyPrompt = [
      `${character.name} visual continuity anchor: same actor identity across scenes.`,
      `Face: ${seed.faceKeywords}. Do not change face shape, facial proportions, age impression, skin tone, body type, or recognizable temperament unless the script explicitly states time jump, injury, disguise, aging, illness, mask, makeup, or costume change.`,
      `Hair: ${seed.hairstyle}. Keep hairstyle silhouette stable unless there is explicit narrative evidence for a change.`,
      `Clothing: ${seed.clothing}. If clothing must change for a new day or special setting, keep the same character identity, palette logic, silhouette language, and body language.`,
      `Palette: ${seed.colorPalette}. Temperament: ${seed.temperament}. Body language: ${seed.bodyLanguage}.`,
      "Negative continuity constraints: no face drift, no different actor, no unexplained hairstyle change, no unexplained age shift, no inconsistent body type, no random costume redesign.",
    ].join(" ")

    return {
      id: `character-visual-${character.id}`,
      characterId: character.id,
      name: character.name,
      ageRange: "25-40",
      hairstyle: seed.hairstyle,
      faceKeywords: seed.faceKeywords,
      clothing: seed.clothing,
      colorPalette: seed.colorPalette,
      temperament: seed.temperament,
      bodyLanguage: seed.bodyLanguage,
      consistencyPrompt,
      negativeConsistencyPrompt: "face drift, different actor identity, unexplained age change, random hairstyle change, inconsistent body type, unexplained costume redesign, extra limbs, plastic skin",
      lockedFields: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  })
}

export function buildCharacterConsistencyPrompt(
  profiles: CharacterVisualProfile[],
  sceneCharacters: string[]
) {
  const normalized = new Set(sceneCharacters.map((item) => item.toLowerCase()))
  const selected = profiles.filter(
    (profile) =>
      normalized.has(profile.characterId.toLowerCase()) ||
      normalized.has(profile.name.toLowerCase())
  )
  const scopedProfiles = selected.length > 0 ? selected : profiles

  return [
    "角色连续性总规则：默认所有角色都是同一位演员在同一部影视作品中连续出现。除非当前场景文本明确说明长时间推移、年龄变化、受伤/疤痕/病容、伪装/面具/假发/特殊妆容、明确换装或身份伪装，否则必须保持角色的脸型、五官比例、年龄感、发型轮廓、体型、肤色、核心气质和主要服装轮廓一致。",
    ...scopedProfiles.map((profile) => {
      const lockedNote =
        profile.lockedFields.length > 0
          ? `Locked fields must be preserved exactly: ${profile.lockedFields.join(", ")}.`
          : "No locked visual fields."
      return [
        `${profile.name}: ${profile.consistencyPrompt}`,
        `Negative: ${profile.negativeConsistencyPrompt ?? "avoid identity drift"}.`,
        lockedNote,
      ].join(" ")
    }),
  ].join("\n")
}

export function createCharacterConsistencyPack(
  characters: Character[],
  style: string
): CharacterConsistencyPack {
  const profiles = buildCharacterVisualProfiles(characters, style)
  return {
    profiles,
    globalConsistencyRule:
      "同一角色在分镜图、概念海报和视觉预演中必须保持同一演员身份、脸部关键词、年龄感、发型轮廓、体型、服装轮廓、主色彩和肢体语言一致；只有剧本明确出现长时间跨度、受伤、衰老、伪装、面具、假发、特殊妆容、换装等线索时，才允许做局部且可解释的变化；用户锁定字段优先级最高。",
  }
}

export function updateCharacterVisualProfile(
  profiles: CharacterVisualProfile[],
  profileId: string,
  patch: Partial<CharacterVisualProfile>
) {
  return profiles.map((profile) =>
    profile.id === profileId
      ? {
          ...profile,
          ...patch,
          updatedAt: now(),
        }
      : profile
  )
}

export function toggleCharacterProfileFieldLock(
  profiles: CharacterVisualProfile[],
  profileId: string,
  field: string
) {
  return profiles.map((profile) => {
    if (profile.id !== profileId) {
      return profile
    }
    const lockedFields = profile.lockedFields.includes(field)
      ? profile.lockedFields.filter((item) => item !== field)
      : [...profile.lockedFields, field]
    return {
      ...profile,
      lockedFields,
      updatedAt: now(),
    }
  })
}
