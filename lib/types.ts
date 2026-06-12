export type TextInput = {
  sourceText: string
  textType: string
  analysisDepth: string
  style: string
}

export type SceneAnalysis = {
  meta: AnalysisMeta
  overview: StoryOverview
  scenes: SceneSlice[]
  characters: Character[]
  relationships: Relationship[]
  rhythm: RhythmAdvice[]
  shotSuggestions: ShotSuggestion[]
}

export type AnalysisMeta = {
  textType: string
  analysisDepth: string
  style: string
  generatedAt: string
  provider?: string
  model?: string
  fallbackReason?: string
}

export type StoryOverview = {
  summary: string
  theme: string
  coreConflict: string
  emotionalArc: string
  visualKeywords: string[]
}

export type SceneSlice = {
  id: string
  title: string
  location: string
  timeOfDay: string
  characters: string[]
  summary: string
  emotionValue: number
  rhythmValue: number
  keyLine: string
}

export type Character = {
  id: string
  name: string
  role: string
  goal: string
  currentEmotion: string
  note: string
}

export type Relationship = {
  from: string
  to: string
  label: string
  tension: number
}

export type RhythmAdvice = {
  sceneId: string
  rhythmType: "slow" | "medium" | "fast" | "explosive"
  editingSuggestion: string
  reason: string
}

export type ShotSuggestion = {
  sceneId: string
  shotSize: string
  cameraAngle: string
  cameraMovement: string
  lighting: string
  colorTone: string
  soundDesign: string
  aiVideoPrompt: string
}

export type FeedbackTargetModule =
  | "overall"
  | "overview"
  | "scenes"
  | "characters"
  | "relationships"
  | "emotionCurve"
  | "rhythm"
  | "shotSuggestions"
  | "aigcPrompts"
  | "selfCritique"

export type UserFeedback = {
  targetModule: FeedbackTargetModule
  feedbackText: string
  adjustmentStrength: "light" | "medium" | "strong"
  keepOriginalStructure: boolean
}

export type AgentRunResult = {
  id: string
  input?: TextInput
  analysis: SceneAnalysis
  createdAt: string
  selfCritique: string[]
  toolCallLogs: string[]
}

export type RevisionRecord = {
  id: string
  createdAt: string
  feedback: UserFeedback
  changedModules: FeedbackTargetModule[]
  summary: string
  beforeSnapshot: Partial<SceneAnalysis>
  afterSnapshot: Partial<SceneAnalysis>
}

export type RevisedAgentRunResult = AgentRunResult & {
  revisionHistory: RevisionRecord[]
}

export type EditableModule =
  | "overview"
  | "scenes"
  | "characters"
  | "relationships"
  | "emotionCurve"
  | "rhythm"
  | "shotSuggestions"
  | "aigcPrompts"
  | "soundDesign"
  | "selfCritique"

export type EditableFieldPath = string

export type UserEditRecord = {
  id: string
  createdAt: string
  module: EditableModule
  targetId: string
  fieldPath: EditableFieldPath
  oldValue: unknown
  newValue: unknown
  editNote?: string
  locked: boolean
}

export type LockedField = {
  module: EditableModule
  targetId: string
  fieldPath: EditableFieldPath
  value: unknown
  lockedAt: string
  reason: "user-edited" | "user-locked"
}

export type RegenerationScope =
  | "affectedOnly"
  | "currentModule"
  | "downstreamModules"
  | "fullReportPreserveUserEdits"

export type RegenerationRequest = {
  sourceEditIds: string[]
  scope: RegenerationScope
  instruction?: string
}

export type RegenerationResult = {
  id: string
  createdAt: string
  request: RegenerationRequest
  preservedFields: LockedField[]
  regeneratedModules: EditableModule[]
  summary: string
  warnings: string[]
  result: AgentRunResult
}

export type EditableAgentRunResult = RevisedAgentRunResult & {
  userEdits: UserEditRecord[]
  lockedFields: LockedField[]
  regenerationHistory: RegenerationResult[]
  visualState?: VisualAgentState
}

export type VisualGenerationProvider =
  | "mock"
  | "jimeng"
  | "image2"
  | "kling"
  | "runway"
  | "pika"
  | "midjourney"
  | "sdxl"
  | "dalle"
  | "comfyui"

export type StoryboardImageStatus = "idle" | "generating" | "completed" | "failed"

export type StoryboardImageRequest = {
  id: string
  sceneId: string
  shotId?: string
  provider: VisualGenerationProvider
  prompt: string
  negativePrompt?: string
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "21:9"
  stylePreset: string
  characterConsistencyIds: string[]
  lockedReferenceImageIds: string[]
  createdAt: string
}

export type StoryboardImageResult = {
  id: string
  requestId: string
  sceneId: string
  shotId?: string
  provider: VisualGenerationProvider
  imageUrl: string
  prompt: string
  status: StoryboardImageStatus
  createdAt: string
  isSelected: boolean
  isLocked: boolean
  generationNote?: string
}

export type StoryboardVisualSet = {
  sceneId: string
  images: StoryboardImageResult[]
  selectedImageId?: string
  lockedImageId?: string
}

export type StoryboardVariantStyle =
  | "cinematic-realism"
  | "cold-suspense"
  | "warm-realism"
  | "neon-noir"
  | "documentary"
  | "dreamlike"
  | "minimal-artfilm"

export type StoryboardVariant = {
  id: string
  sceneId: string
  label: string
  style: StoryboardVariantStyle
  image: StoryboardImageResult
  prompt: string
  promptExpert?: PromptExpertFusion
  reason: string
  isSelected: boolean
}

export type PromptExpertFusion = {
  pipelineVersion?: string
  storyboardPrompt: string
  stylePrompt: string
  finalPrompt: string
  fusionNotes: string[]
}

export type StoryboardComparisonSet = {
  id: string
  sceneId: string
  variants: StoryboardVariant[]
  selectedVariantId?: string
  createdAt: string
}

export type LockedVisualStyle = {
  style: StoryboardVariantStyle
  label: string
  sceneId: string
  variantId: string
  imageId: string
  prompt: string
  updatedAt: string
}

export type CharacterVisualProfile = {
  id: string
  characterId: string
  name: string
  ageRange: string
  genderPresentation?: string
  hairstyle: string
  faceKeywords: string
  clothing: string
  colorPalette: string
  temperament: string
  bodyLanguage: string
  referenceImageUrl?: string
  consistencyPrompt: string
  negativeConsistencyPrompt?: string
  lockedFields: string[]
  createdAt: string
  updatedAt: string
}

export type CharacterConsistencyPack = {
  profiles: CharacterVisualProfile[]
  globalConsistencyRule: string
}

export type TimelineShot = {
  id: string
  sceneId: string
  order: number
  title: string
  durationSeconds: number
  shotSize: string
  cameraAngle?: string
  cameraMovement: string
  emotionValue: number
  rhythmValue: number
  transition: "cut" | "fade" | "dissolve" | "match-cut" | "jump-cut" | "black"
  isClimax: boolean
  isLocked: boolean
  linkedStoryboardImageId?: string
  note?: string
}

export type StoryboardTimeline = {
  id: string
  title: string
  shots: TimelineShot[]
  totalDurationSeconds: number
  updatedAt: string
}

export type PosterType =
  | "main-poster"
  | "character-poster"
  | "mood-poster"
  | "vertical-cover"
  | "horizontal-banner"

export type ConceptPosterRequest = {
  id: string
  posterType: PosterType
  title: string
  logline: string
  provider: VisualGenerationProvider
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "21:9"
  visualStyle: string
  selectedSceneIds: string[]
  selectedCharacterIds: string[]
  prompt: string
  createdAt: string
}

export type ConceptPosterResult = {
  id: string
  requestId: string
  posterType: PosterType
  imageUrl: string
  prompt: string
  provider: VisualGenerationProvider
  status: StoryboardImageStatus
  isSelected: boolean
  createdAt: string
}

export type StoryboardReel = {
  id: string
  title: string
  shots: TimelineShot[]
  imageIds: string[]
  totalDurationSeconds: number
  captionsEnabled: boolean
  autoPlayIntervalMs: number
  createdAt: string
}

export type VisualAgentState = {
  storyboardVisualSets: StoryboardVisualSet[]
  storyboardComparisonSets: StoryboardComparisonSet[]
  lockedStyle?: LockedVisualStyle
  characterConsistencyPack?: CharacterConsistencyPack
  timeline?: StoryboardTimeline
  posters: ConceptPosterResult[]
  reels: StoryboardReel[]
}

export type ScriptChunk = {
  id: string
  index: number
  title: string
  text: string
  startChar: number
  endChar: number
  estimatedSceneCount: number
}

export type ChunkAnalysisResult = {
  chunk: ScriptChunk
  localAnalysis: SceneAnalysis
  localSummary: string
  detectedCharacters: Character[]
  localEmotionPeak: number
  continuityNotes: string[]
}

export type LongScriptAnalysisResult = AgentRunResult & {
  isLongScript: boolean
  chunks: ScriptChunk[]
  chunkResults: ChunkAnalysisResult[]
  globalMergeNotes: string[]
}

export type AIGCTool =
  | "midjourney"
  | "stable-diffusion"
  | "sdxl"
  | "dalle"
  | "runway"
  | "pika"
  | "kling"
  | "jimeng"
  | "tongyi-wanxiang"
  | "comfyui"
  | "generic-en"
  | "generic-zh"

export type AIGCPromptPreference = {
  tool: AIGCTool
  language: "zh" | "en" | "bilingual"
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "21:9"
  styleIntensity: "subtle" | "balanced" | "strong"
  includeNegativePrompt: boolean
  includeCameraParams: boolean
  includeLightingParams: boolean
  includeConsistencyNotes: boolean
}

export type AIGCStoryboardPrompt = {
  id: string
  sceneId: string
  tool: AIGCTool
  title: string
  mainPrompt: string
  negativePrompt?: string
  cameraPrompt?: string
  lightingPrompt?: string
  stylePrompt?: string
  characterConsistencyPrompt?: string
  parameters?: string
  usageTip: string
}

export type AIGCPromptPack = {
  preference: AIGCPromptPreference
  prompts: AIGCStoryboardPrompt[]
  globalStyleGuide: string
  characterConsistencyGuide: string
  exportText: string
}
