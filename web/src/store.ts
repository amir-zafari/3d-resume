import { create } from 'zustand'
import { TOUR } from './data/tour'

const LAST = TOUR.length - 1
const clamp = (step: number) => Math.min(LAST, Math.max(0, step))

// The step is mirrored in the URL hash (#services, #contact…) so a link can open on a given step.
function stepFromHash() {
  const index = TOUR.findIndex((step) => `#${step.id}` === window.location.hash)
  return index < 0 ? 0 : index
}

interface TourState {
  step: number
  go: (step: number) => void
  next: () => void
  prev: () => void
}

export const useTour = create<TourState>((set, get) => ({
  step: typeof window === 'undefined' ? 0 : stepFromHash(),
  go: (step) => {
    const target = clamp(step)
    if (target === get().step) return
    set({ step: target })
    history.replaceState(null, '', target === 0 ? window.location.pathname + window.location.search : `#${TOUR[target].id}`)
  },
  next: () => get().go(get().step + 1),
  prev: () => get().go(get().step - 1),
}))
