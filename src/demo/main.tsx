import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WebEditor, createEmptyProject } from '../index'
import type { Project } from '../index'

function Demo() {
  const [project, setProject] = useState<Project>(createEmptyProject())
  return <WebEditor value={project} onChange={setProject} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
