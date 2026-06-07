import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { NodeId } from '../model/types'
import { describeNode, propsAt, styleFromProps } from '../model/render'
import { FormControl } from './FormControl'
import { Icon } from './Icon'
import { useEditorStore } from '../store'

function PreviewNode({ id }: { id: NodeId }) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const selectPage = useEditorStore((s) => s.selectPage)
  const breakpoint = useEditorStore((s) => s.breakpoint)
  const [hovered, setHovered] = useState(false)

  if (!node) return null

  const p = propsAt(node.props, breakpoint)
  const view = describeNode(node, undefined, breakpoint)
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
  } else if (node.type === 'icon') {
    element = (
      <Icon
        name={p.icon as string}
        {...hoverHandlers}
        style={{
          color: p.color as string,
          width: p.size as number,
          height: p.size as number,
          ...styleFromProps(p),
        }}
      />
    )
  } else if (
    node.type === 'select' ||
    node.type === 'checkbox' ||
    node.type === 'radio'
  ) {
    element = <FormControl node={node} interactive />
  } else if (node.type === 'form') {
    element = (
      <form
        style={style}
        {...attrs}
        {...hoverHandlers}
        onSubmit={(e) => e.preventDefault()}
      >
        {node.children.map((childId) => (
          <PreviewNode key={childId} id={childId} />
        ))}
      </form>
    )
  } else {
    const Tag = view.tag as keyof JSX.IntrinsicElements
    if (node.children.length === 0 && view.text !== undefined) {
      element =
        view.html != null ? (
          <Tag
            style={style}
            {...attrs}
            {...hoverHandlers}
            dangerouslySetInnerHTML={{ __html: view.html }}
          />
        ) : (
          <Tag style={style} {...attrs} {...hoverHandlers}>
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

  const labelText = p.label as string
  if (
    (node.type === 'input' ||
      node.type === 'textarea' ||
      node.type === 'select') &&
    labelText
  ) {
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{labelText}</span>
        {element}
      </label>
    )
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
