import { useEffect } from 'react'
import type { Project } from '../model/project'
import { buildSite, toHtmlDocument } from '../model/render'
import { createZip } from '../model/zip'
import { useEditorStore } from '../store'
import { NodeRenderer } from './NodeRenderer'
import { Preview } from './Preview'
import { Pages } from './Pages'
import { Palette } from './Palette'
import { Layers } from './Layers'
import { Inspector } from './Inspector'
import '../styles.css'

export interface WebEditorProps {
  value?: Project
  onChange?: (project: Project) => void
}

const MODES = ['visual', 'preview', 'code'] as const

export function WebEditor({ value, onChange }: WebEditorProps) {
  const project = useEditorStore((s) => s.project)
  const doc = useEditorStore((s) => s.doc)
  const setProject = useEditorStore((s) => s.setProject)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)

  useEffect(() => {
    if (value && value !== useEditorStore.getState().project) setProject(value)
  }, [value, setProject])

  useEffect(() => {
    onChange?.(project)
  }, [project, onChange])

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportHtml = () => {
    const current = project.pages.find((p) => p.id === project.currentPageId)
    const name = (current?.name || 'page').replace(/\s+/g, '-').toLowerCase()
    download(new Blob([toHtmlDocument(doc)], { type: 'text/html' }), `${name}.html`)
  }

  const exportSite = () => {
    download(createZip(buildSite(project)), 'site.zip')
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
          <button className="we-export" onClick={exportSite}>
            Export site
          </button>
        </div>
      </div>

      <div className="we-body">
        <div className="we-left">
          <Pages />
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
