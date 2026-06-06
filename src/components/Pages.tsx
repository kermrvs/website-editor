import { useState } from 'react'
import { useEditorStore } from '../store'

export function Pages() {
  const pages = useEditorStore((s) => s.project.pages)
  const currentId = useEditorStore((s) => s.project.currentPageId)
  const selectPage = useEditorStore((s) => s.selectPage)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const renamePage = useEditorStore((s) => s.renamePage)

  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="we-pages">
      <div className="we-panel-title">Pages</div>
      {pages.map((p) => (
        <div
          key={p.id}
          className={p.id === currentId ? 'we-page selected' : 'we-page'}
          onClick={() => selectPage(p.id)}
          onDoubleClick={() => setEditing(p.id)}
        >
          {editing === p.id ? (
            <input
              autoFocus
              className="we-page-input"
              defaultValue={p.name}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                renamePage(p.id, e.target.value.trim() || p.name)
                setEditing(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditing(null)
              }}
            />
          ) : (
            <>
              <span className="we-page-name">{p.name}</span>
              {pages.length > 1 && (
                <span
                  className="we-page-del"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePage(p.id)
                  }}
                >
                  ×
                </span>
              )}
            </>
          )}
        </div>
      ))}
      <button className="we-page-add" onClick={() => addPage()}>
        ＋ Add page
      </button>
    </div>
  )
}
