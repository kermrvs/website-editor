import type { CSSProperties } from 'react'
import type { NodeId } from '../model/types'
import { useEditorStore } from '../store'

interface Props {
  id: NodeId
}

export function NodeRenderer({ id }: Props) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const selectedId = useEditorStore((s) => s.selectedId)
  const select = useEditorStore((s) => s.select)

  if (!node) return null
  const isSelected = selectedId === id

  const selectionStyle: CSSProperties = isSelected
    ? { outline: '2px solid #4f46e5', outlineOffset: 2 }
    : {}

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    select(id)
  }

  const p = node.props

  switch (node.type) {
    case 'root':
      return (
        <div className="we-root" onClick={() => select(null)}>
          {node.children.map((childId) => (
            <NodeRenderer key={childId} id={childId} />
          ))}
        </div>
      )

    case 'box':
      return (
        <div
          onClick={onClick}
          style={{
            padding: p.padding as number,
            background: p.background as string,
            border: '1px dashed #d1d5db',
            minHeight: 24,
            ...selectionStyle,
          }}
        >
          {node.children.map((childId) => (
            <NodeRenderer key={childId} id={childId} />
          ))}
        </div>
      )

    case 'heading': {
      const Tag = `h${(p.level as number) ?? 2}` as 'h1'
      return (
        <Tag onClick={onClick} style={{ margin: '0.4em 0', ...selectionStyle }}>
          {p.text as string}
        </Tag>
      )
    }

    case 'text':
      return (
        <p onClick={onClick} style={{ margin: '0.4em 0', ...selectionStyle }}>
          {p.text as string}
        </p>
      )

    case 'button':
      return (
        <button
          onClick={onClick}
          style={{
            padding: '8px 16px',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            ...selectionStyle,
          }}
        >
          {p.text as string}
        </button>
      )

    case 'image':
      return (
        <img
          onClick={onClick}
          src={p.src as string}
          alt={p.alt as string}
          style={{ maxWidth: '100%', display: 'block', ...selectionStyle }}
        />
      )

    default:
      return null
  }
}
