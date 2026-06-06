import type { JSX } from 'react'
import type { NodeId } from '../model/types'
import { describeNode } from '../model/render'
import { useEditorStore } from '../store'

function PreviewNode({ id }: { id: NodeId }) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const selectPage = useEditorStore((s) => s.selectPage)
  if (!node) return null

  const view = describeNode(node)

  if (view.selfClosing) {
    return <img style={view.style} src={view.attrs?.src} alt={view.attrs?.alt} />
  }

  if (node.type === 'link') {
    const target = node.props.linkTo as string
    return (
      <a
        href="#"
        style={view.style}
        onClick={(e) => {
          e.preventDefault()
          if (target) selectPage(target)
        }}
      >
        {view.text}
      </a>
    )
  }

  const Tag = view.tag as keyof JSX.IntrinsicElements

  if (node.children.length === 0 && view.text !== undefined) {
    return <Tag style={view.style}>{view.text}</Tag>
  }

  return (
    <Tag style={view.style}>
      {node.children.map((childId) => (
        <PreviewNode key={childId} id={childId} />
      ))}
    </Tag>
  )
}

export function Preview() {
  const rootId = useEditorStore((s) => s.doc.root)
  return <PreviewNode id={rootId} />
}
