import { useState } from 'react'
import type { NodeType } from '../model/types'
import { canHaveChildren, findParentId } from '../model/document'
import { useEditorStore } from '../store'

interface Block {
  type: NodeType
  label: string
}

interface Group {
  title: string
  blocks: Block[]
}

const GROUPS: Group[] = [
  {
    title: 'Layout',
    blocks: [
      { type: 'box', label: '▢  Box' },
      { type: 'form', label: '🗒  Form' },
      { type: 'divider', label: '―  Divider' },
      { type: 'spacer', label: '↕  Spacer' },
    ],
  },
  {
    title: 'Text',
    blocks: [
      { type: 'heading', label: 'H  Heading' },
      { type: 'text', label: '¶  Text' },
      { type: 'button', label: '⬜  Button' },
      { type: 'link', label: '🔗  Link' },
    ],
  },
  {
    title: 'Media',
    blocks: [
      { type: 'image', label: '\u{1f5bc}  Image' },
      { type: 'video', label: '▶  Video' },
      { type: 'embed', label: '⧉  Embed' },
    ],
  },
  {
    title: 'Forms',
    blocks: [
      { type: 'input', label: '▭  Input' },
      { type: 'textarea', label: '▤  Textarea' },
      { type: 'select', label: '▾  Select' },
      { type: 'checkbox', label: '☑  Checkbox' },
      { type: 'radio', label: '◉  Radio' },
    ],
  },
]

export function Palette() {
  const addNode = useEditorStore((s) => s.addNode)
  const doc = useEditorStore((s) => s.doc)
  const selectedId = useEditorStore((s) => s.selectedId)
  const startDragNew = useEditorStore((s) => s.startDragNew)
  const endDrag = useEditorStore((s) => s.endDrag)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (title: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })

  const resolveTarget = (): string => {
    if (!selectedId) return doc.root
    const selected = doc.nodes[selectedId]
    if (selected && canHaveChildren(selected.type)) return selectedId
    const parentId = findParentId(doc, selectedId)
    if (parentId && canHaveChildren(doc.nodes[parentId].type)) return parentId
    return doc.root
  }

  const targetId = resolveTarget()

  return (
    <div className="we-palette">
      <div className="we-panel-title">Blocks</div>

      {GROUPS.map((group) => {
        const open = !collapsed.has(group.title)
        return (
          <div key={group.title} className="we-block-group">
            <button
              className="we-group-head"
              onClick={() => toggle(group.title)}
            >
              <span className="we-caret">{open ? '▾' : '▸'}</span>
              {group.title}
            </button>
            {open &&
              group.blocks.map((b) => (
                <button
                  key={b.type}
                  className="we-palette-item"
                  draggable
                  onClick={() => addNode(b.type, targetId)}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy'
                    startDragNew(b.type)
                  }}
                  onDragEnd={() => endDrag()}
                >
                  {b.label}
                </button>
              ))}
          </div>
        )
      })}

      <div className="we-palette-hint">
        Adds into{' '}
        {targetId === doc.root ? 'the page' : `selected ${doc.nodes[targetId]?.type}`}
      </div>
    </div>
  )
}
