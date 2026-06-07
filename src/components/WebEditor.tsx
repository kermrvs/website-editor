import { createElement, useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Project } from '../model/project'
import { buildSite, toHtmlDocument } from '../model/render'
import { createZip } from '../model/zip'
import { ConfigProvider } from '../config'
import type { WebEditorConfig } from '../config'
import { useEditorStore } from '../store'
import { NodeRenderer } from './NodeRenderer'
import { Preview } from './Preview'
import { FormatBar } from './FormatBar'
import { Pages } from './Pages'
import { Palette } from './Palette'
import { Layers } from './Layers'
import { Inspector } from './Inspector'
import '../styles.css'

export interface WebEditorProps {
  value?: Project
  onChange?: (project: Project) => void
  config?: WebEditorConfig
}

const MODES = ['visual', 'preview', 'code'] as const

export function WebEditor({ value, onChange, config }: WebEditorProps) {
  const project = useEditorStore((s) => s.project)
  const doc = useEditorStore((s) => s.doc)
  const setProject = useEditorStore((s) => s.setProject)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)

  useEffect(() => {
    if (value && value !== useEditorStore.getState().project) setProject(value)
  }, [value, setProject])

  useEffect(() => {
    onChange?.(project)
  }, [project, onChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (target.isContentEditable) return

      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().undo()
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault()
        useEditorStore.getState().redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderIcon = (name: string): string | null => {
    const Component = config?.icons?.[name]
    return Component ? renderToStaticMarkup(createElement(Component)) : null
  }

  const exportHtml = () => {
    const current = project.pages.find((p) => p.id === project.currentPageId)
    const name = (current?.name || 'page').replace(/\s+/g, '-').toLowerCase()
    download(
      new Blob([toHtmlDocument(doc, { renderIcon })], { type: 'text/html' }),
      `${name}.html`,
    )
  }

  const exportSite = () => {
    download(createZip(buildSite(project, { renderIcon })), 'site.zip')
  }

  return (
    <ConfigProvider value={config ?? {}}>
    <div className="we-editor">
      <div className="we-toolbar">
        <strong className="we-brand">web-editor</strong>
        <div className="we-toolbar-actions">
          <div className="we-mode-switch">
            <button disabled={!canUndo} onClick={() => undo()} title="Undo (Ctrl+Z)">
              ↶
            </button>
            <button disabled={!canRedo} onClick={() => redo()} title="Redo (Ctrl+Y)">
              ↷
            </button>
          </div>
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
            <pre className="we-code-preview">
              {toHtmlDocument(doc, { renderIcon })}
            </pre>
          )}
        </div>

        <Inspector />
      </div>

      <FormatBar />
    </div>
    </ConfigProvider>
  )
}
