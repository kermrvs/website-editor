import type { NodeType } from '../model/types'
import { canHaveChildren, findParentId } from '../model/document'
import { useEditorStore } from '../store'

const BLOCKS: { type: NodeType; label: string }[] = [
  { type: 'box', label: '▢  Box' },
  { type: 'heading', label: 'H  Heading' },
  { type: 'text', label: '¶  Text' },
  { type: 'button', label: '⬜  Button' },
  { type: 'image', label: '\u{1f5bc}  Image' },
]

export function Palette() {
  const addNode = useEditorStore((s) => s.addNode)
  const doc = useEditorStore((s) => s.doc)
  const selectedId = useEditorStore((s) => s.selectedId)
  const startDragNew = useEditorStore((s) => s.startDragNew)
  const endDrag = useEditorStore((s) => s.endDrag)

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
      {BLOCKS.map((b) => (
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
      <div className="we-palette-hint">
        Adds into{' '}
        {targetId === doc.root ? 'the page' : `selected ${doc.nodes[targetId]?.type}`}
      </div>
    </div>
  )
}
