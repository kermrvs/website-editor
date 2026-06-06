import { useEffect } from 'react'
import type { EditorDocument } from '../model/types'
import { useEditorStore } from '../store'
import { NodeRenderer } from './NodeRenderer'
import { Palette } from './Palette'
import { Inspector } from './Inspector'
import '../styles.css'

export interface WebEditorProps {
  /** Controlled document. If provided, the editor renders this document. */
  value?: EditorDocument
  /** Called whenever the document changes. */
  onChange?: (doc: EditorDocument) => void
}

/**
 * The main editor component. Drop it into any React app:
 *
 *   <WebEditor value={doc} onChange={setDoc} />
 */
export function WebEditor({ value, onChange }: WebEditorProps) {
  const doc = useEditorStore((s) => s.doc)
  const setDoc = useEditorStore((s) => s.setDoc)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)

  // Sync incoming controlled value into the store.
  useEffect(() => {
    if (value) setDoc(value)
  }, [value, setDoc])

  // Notify the host app of changes.
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
