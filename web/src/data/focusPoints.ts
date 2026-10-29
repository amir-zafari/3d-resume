import { ENTRY_COUNT } from './resume'

// One DOM marker per résumé entry, in order; Scene.tsx flies the camera to the sticker with the same index.
export const FOCUS_POINTS: readonly string[] = Array.from({ length: ENTRY_COUNT }, (_, i) => `focus-${i + 1}`)
