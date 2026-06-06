import { useState } from 'react'
import type { JSX } from 'react'
import type { NodeId } from '../model/types'
import { describeNode } from '../model/render'
import { useEditorStore } from '../store'

function PreviewNode({ id }: { id: NodeId }) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const selectPage = useEditorStore((s) => s.selectPage)
  const [hovered, setHovered] = useState(false)

  if (!node) return null

  const view = describeNode(node)
  const hasHover = !!view.hoverStyle

  const style = {
    ...view.style,
    ...(hasHover ? { transition: 'all 0.2s ease' } : {}),
    ...(hovered && view.hoverStyle ? view.hoverStyle : {}),
  }

  const hoverHandlers = hasHover
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {}

  if (view.selfClosing) {
    return (
      <img
        style={style}
        src={view.attrs?.src}
        alt={view.attrs?.alt}
        {...hoverHandlers}
      />
    )
  }

  if (node.type === 'link') {
    const target = node.props.linkTo as string
    return (
      <a
        href="#"
        style={style}
        {...hoverHandlers}
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
    return (
      <Tag style={style} {...hoverHandlers}>
        {view.text}
      </Tag>
    )
  }

  return (
    <Tag style={style} {...hoverHandlers}>
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
