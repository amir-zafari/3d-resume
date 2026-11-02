import { useEffect, useMemo, useRef, useState } from 'react'
import { exportEdits, useEditor } from '../editor'
import { STICKER_LIST, layout, makeStickerTexture } from '../scene/stickers'

// A small live picture of one sticker for the list (its canvas repaints when a logo loads).
function Thumb({ index }: { index: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const canvas = makeStickerTexture(STICKER_LIST[index].design).texture.image as HTMLCanvasElement
    ref.current?.replaceChildren(canvas)
  }, [index])
  return <span className="editor-thumb" ref={ref} />
}

export default function StickerEditor() {
  const { selected, edits, select, update, reset, resetAll } = useEditor()
  const [copied, setCopied] = useState(false)
  const stickers = useMemo(() => layout(edits), [edits])
  const current = stickers.find((sticker) => sticker.id === selected)
  const text = exportEdits(edits)
  const count = Object.keys(edits).length

  const change = (key: 'size' | 'tilt', value: number) => {
    if (!current) return
    update(current.id, { [key]: value }, { y: current.y, z: current.z, size: current.size, tilt: current.tilt })
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard access: the text box below can be copied by hand.
    }
  }

  return (
    <aside className="sticker-editor" lang="fa" dir="rtl">
      <h2>چیدن برچسب‌ها</h2>
      <ol className="editor-help">
        <li>یک برچسب را از لیست انتخاب کنید.</li>
        <li>روی مدل کلیک کنید تا همان‌جا بچسبد.</li>
        <li>با کشیدن، مدل را بچرخانید؛ با اسکرول بزرگ و کوچک کنید.</li>
        <li>آخر کار «کپی چیدمان» را بزنید و متنش را بفرستید.</li>
      </ol>

      <div className="editor-list">
        {STICKER_LIST.map((sticker, i) => (
          <button
            key={sticker.id}
            type="button"
            className={`editor-item${selected === sticker.id ? ' is-selected' : ''}${edits[sticker.id] ? ' is-edited' : ''}`}
            onClick={() => select(selected === sticker.id ? null : sticker.id)}
            title={sticker.id}
          >
            <Thumb index={i} />
          </button>
        ))}
      </div>

      {current ? (
        <div className="editor-controls">
          <p>
            انتخاب‌شده: <b dir="ltr">{current.id}</b>
          </p>
          <label>
            اندازه
            <input type="range" min={0.02} max={0.1} step={0.002} value={current.size} onChange={(e) => change('size', Number(e.target.value))} />
          </label>
          <label>
            چرخش
            <input type="range" min={-1.2} max={1.2} step={0.02} value={current.tilt} onChange={(e) => change('tilt', Number(e.target.value))} />
          </label>
          {edits[current.id] && (
            <button type="button" className="editor-link" onClick={() => reset(current.id)}>
              برگرداندن این برچسب به جای اول
            </button>
          )}
        </div>
      ) : (
        <p className="editor-hint">برچسبی انتخاب نشده است.</p>
      )}

      <div className="editor-export">
        <button type="button" className="editor-primary" onClick={copy} disabled={!count}>
          {copied ? 'کپی شد ✓' : `کپی چیدمان (${count.toLocaleString('fa-IR')} برچسب)`}
        </button>
        <textarea readOnly dir="ltr" value={text} onFocus={(e) => e.currentTarget.select()} rows={4} />
        {count > 0 && (
          <button type="button" className="editor-link" onClick={() => window.confirm('همه تغییرات پاک شود؟') && resetAll()}>
            پاک کردن همه تغییرات
          </button>
        )}
      </div>
    </aside>
  )
}
