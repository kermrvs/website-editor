import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WebEditor, createEmptyDocument } from '../index'
import type { EditorDocument } from '../index'

/** Tiny host app that mimics how a real consumer would use the library. */
function Demo() {
  const [doc, setDoc] = useState<EditorDocument>(createEmptyDocument())
  return <WebEditor value={doc} onChange={setDoc} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
