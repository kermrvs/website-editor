import type { NodeType } from '../model/types'
import { canHaveChildren } from '../model/document'
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

  const targetId =
    selectedId && canHaveChildren(doc.nodes[selectedId]?.type)
      ? selectedId
      : doc.root

  return (
    <div className="we-palette">
      <div className="we-panel-title">Blocks</div>
      {BLOCKS.map((b) => (
        <button
          key={b.type}
          className="we-palette-item"
          onClick={() => addNode(b.type, targetId)}
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
