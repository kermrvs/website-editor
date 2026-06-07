import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Star,
  Heart,
  Menu,
  Search,
  Check,
  ArrowRight,
  Mail,
  Phone,
} from 'lucide-react'
import { WebEditor, createEmptyProject } from '../index'
import type { Project } from '../index'

const icons = {
  star: Star,
  heart: Heart,
  menu: Menu,
  search: Search,
  check: Check,
  'arrow-right': ArrowRight,
  mail: Mail,
  phone: Phone,
}

function Demo() {
  const [project, setProject] = useState<Project>(createEmptyProject())
  return (
    <WebEditor value={project} onChange={setProject} config={{ icons }} />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
