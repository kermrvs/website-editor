import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../store'

export function FormatBar() {
  const editingId = useEditorStore((s) => s.editingId)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const savedRange = useRef<Range | null>(null)
  const savedHost = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!editingId) {
      setRect(null)
      return
    }
    const update = () => {
      const el = document.querySelector(`[data-node-id="${editingId}"]`)
      if (el) setRect(el.getBoundingClientRect())
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editingId])

  if (!editingId || !rect) return null

  const run = (command: string, value?: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand(command, false, value)
  }

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
      let n: Node | null = sel.anchorNode
      while (n && !(n instanceof HTMLElement && n.isContentEditable)) {
        n = n.parentNode
      }
      savedHost.current = (n as HTMLElement) ?? null
    }
  }

  const applyColor = (color: string) => {
    const host = savedHost.current
    const range = savedRange.current
    if (!host || !range) return
    host.focus()
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand('foreColor', false, color)
  }

  const top = rect.top - 44 < 8 ? rect.bottom + 8 : rect.top - 44
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 220))

  return createPortal(
    <div className="we-formatbar" style={{ top, left }}>
      <button onMouseDown={run('bold')}>
        <b>B</b>
      </button>
      <button onMouseDown={run('italic')}>
        <i>I</i>
      </button>
      <button onMouseDown={run('underline')}>
        <u>U</u>
      </button>
      <button onMouseDown={run('strikeThrough')}>
        <s>S</s>
      </button>
      <span className="we-formatbar-sep" />
      <label className="we-formatbar-color" title="Text color">
        <input
          type="color"
          onMouseDown={saveSelection}
          onChange={(e) => applyColor(e.target.value)}
        />
      </label>
    </div>,
    document.body,
  )
}
