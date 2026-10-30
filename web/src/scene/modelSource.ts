// The model download starts in index.html before the app code arrives (so the loading screen can
// show real progress); this hands that download to useGLTF as a blob URL.
declare global {
  interface Window {
    __boot?: { model: Promise<Blob>; appReady: () => void; finish: () => void }
  }
}

const MODEL_PATH = `${import.meta.env.BASE_URL}models/me.glb`

let url: string | null = null
const pending = (window.__boot?.model ?? Promise.reject(new Error('no early download'))).then(
  (blob) => {
    url = URL.createObjectURL(blob)
  },
  () => {
    // The early download failed or is missing: let useGLTF fetch the file itself.
    url = MODEL_PATH
  }
)

// Suspends until the model is downloaded.
export function useModelUrl(): string {
  if (url === null) throw pending
  return url
}

export const boot = {
  appReady: () => window.__boot?.appReady(),
  finish: () => window.__boot?.finish(),
}
