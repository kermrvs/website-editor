import { useEffect } from 'react'
import type { EditorDocument } from '../model/types'
import { toHtmlDocument } from '../model/render'
import { useEditorStore } from '../store'
import { NodeRenderer } from './NodeRenderer'
import { Preview } from './Preview'
import { Palette } from './Palette'
import { Layers } from './Layers'
import { Inspector } from './Inspector'
import '../styles.css'

export interface WebEditorProps {
  value?: EditorDocument
  onChange?: (doc: EditorDocument) => void
}

const MODES = ['visual', 'preview', 'code'] as const

export function WebEditor({ value, onChange }: WebEditorProps) {
  const doc = useEditorStore((s) => s.doc)
  const setDoc = useEditorStore((s) => s.setDoc)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)

  useEffect(() => {
    if (value && value !== useEditorStore.getState().doc) setDoc(value)
  }, [value, setDoc])

  useEffect(() => {
    onChange?.(doc)
  }, [doc, onChange])

  const exportHtml = () => {
    const blob = new Blob([toHtmlDocument(doc)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'page.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="we-editor">
      <div className="we-toolbar">
        <strong className="we-brand">web-editor</strong>
        <div className="we-toolbar-actions">
          <div className="we-mode-switch">
            {MODES.map((m) => (
              <button
                key={m}
                className={mode === m ? 'active' : ''}
                onClick={() => setMode(m)}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <button className="we-export" onClick={exportHtml}>
            Export HTML
          </button>
        </div>
      </div>

      <div className="we-body">
        <div className="we-left">
          <Palette />
          <Layers />
        </div>

        <div className="we-canvas">
          {mode === 'visual' && <NodeRenderer id={doc.root} />}
          {mode === 'preview' && (
            <div className="we-preview-wrap">
              <Preview />
            </div>
          )}
          {mode === 'code' && (
            <pre className="we-code-preview">{toHtmlDocument(doc)}</pre>
          )}
        </div>

        <Inspector />
      </div>
    </div>
  )
}
