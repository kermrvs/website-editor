import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
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

  const attrs = view.attrs ?? {}

  let element: ReactNode

  if (view.selfClosing) {
    const Tag = view.tag as keyof JSX.IntrinsicElements
    element = <Tag style={style} {...attrs} {...hoverHandlers} />
  } else if (node.type === 'link') {
    const target = node.props.linkTo as string
    element = (
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
  } else {
    const Tag = view.tag as keyof JSX.IntrinsicElements
    if (node.children.length === 0 && view.text !== undefined) {
      element =
        view.html != null ? (
          <Tag
            style={style}
            {...hoverHandlers}
            dangerouslySetInnerHTML={{ __html: view.html }}
          />
        ) : (
          <Tag style={style} {...hoverHandlers}>
            {view.text}
          </Tag>
        )
    } else {
      element = (
        <Tag style={style} {...attrs} {...hoverHandlers}>
          {node.children.map((childId) => (
            <PreviewNode key={childId} id={childId} />
          ))}
        </Tag>
      )
    }
  }

  if (node.type !== 'link') {
    const linkTo = node.props.linkTo as string
    const href = node.props.href as string
    if (linkTo) {
      return (
        <a
          href="#"
          style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault()
            selectPage(linkTo)
          }}
        >
          {element}
        </a>
      )
    }
    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}
        >
          {element}
        </a>
      )
    }
  }

  return element
}

export function Preview() {
  const rootId = useEditorStore((s) => s.doc.root)
  return <PreviewNode id={rootId} />
}
