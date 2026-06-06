import { useEffect } from 'react'
import type { EditorDocument } from '../model/types'
import { useEditorStore } from '../store'
import { NodeRenderer } from './NodeRenderer'
import { Palette } from './Palette'
import { Inspector } from './Inspector'
import '../styles.css'

export interface WebEditorProps {
  value?: EditorDocument
  onChange?: (doc: EditorDocument) => void
}

export function WebEditor({ value, onChange }: WebEditorProps) {
  const doc = useEditorStore((s) => s.doc)
  const setDoc = useEditorStore((s) => s.setDoc)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)

  useEffect(() => {
    if (value) setDoc(value)
  }, [value, setDoc])

  useEffect(() => {
    onChange?.(doc)
  }, [doc, onChange])

  return (
    <div className="we-editor">
      <div className="we-toolbar">
        <strong className="we-brand">web-editor</strong>
        <div className="we-mode-switch">
          <button
            className={mode === 'visual' ? 'active' : ''}
            onClick={() => setMode('visual')}
          >
            Visual
          </button>
          <button
            className={mode === 'code' ? 'active' : ''}
            onClick={() => setMode('code')}
          >
            Code
          </button>
        </div>
      </div>

      <div className="we-body">
        <Palette />

        <div className="we-canvas">
          {mode === 'visual' ? (
            <NodeRenderer id={doc.root} />
          ) : (
            <pre className="we-code-preview">
              {JSON.stringify(doc, null, 2)}
            </pre>
          )}
        </div>

        <Inspector />
      </div>
    </div>
  )
}
