import { create } from 'zustand'
import type { Placement } from './scene/stickers'

// Sticker editor, opened with ?edit in the address: pick a sticker, click on the model to put it
// there, then copy the layout and hand it over to be saved in data/stickerPlacements.json.
// Switched off for now: set to true to bring the editor back.
const EDITOR_ENABLED = false
export const EDITING = EDITOR_ENABLED && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('edit')

const STORAGE_KEY = 'sticker-editor-edits'

function loadEdits(): Record<string, Placement> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

interface EditorState {
  selected: string | null
  // Only the stickers moved in the editor, by id.
  edits: Record<string, Placement>
  select: (id: string | null) => void
  update: (id: string, change: Partial<Placement>, base: Placement) => void
  reset: (id: string) => void
  resetAll: () => void
}

export const useEditor = create<EditorState>((set, get) => ({
  selected: null,
  edits: EDITING ? loadEdits() : {},
  select: (id) => set({ selected: id }),
  update: (id, change, base) => set({ edits: { ...get().edits, [id]: { ...base, ...get().edits[id], ...change } } }),
  reset: (id) => {
    const edits = { ...get().edits }
    delete edits[id]
    set({ edits })
  },
  resetAll: () => set({ edits: {} }),
}))

// Kept across reloads, so an unfinished layout isn't lost.
if (EDITING) {
  useEditor.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.edits))
    } catch {
      // Private mode or storage full: the layout still works for this visit.
    }
  })
}

// The layout to send over: every edited sticker, rounded to keep the text short.
export function exportEdits(edits: Record<string, Placement>) {
  const round = (n: number | undefined) => (n === undefined ? undefined : Math.round(n * 10000) / 10000)
  const out: Record<string, Placement> = {}
  for (const [id, p] of Object.entries(edits)) out[id] = { y: round(p.y)!, z: round(p.z)!, size: round(p.size), tilt: round(p.tilt) }
  return JSON.stringify(out, null, 1)
}
