import type { CSSProperties, DragEvent } from 'react'
import { Fragment, useRef } from 'react'
import type { NodeId } from '../model/types'
import {
  buttonBaseStyle,
  imageBaseStyle,
  inputBaseStyle,
  layoutStyle,
  linkBaseStyle,
  propsAt,
  styleFromProps,
} from '../model/render'
import { useEditorStore } from '../store'
import { EditableText } from './EditableText'
import { FormControl } from './FormControl'
import { Icon } from './Icon'
import { PreviewNode } from './Preview'

interface Props {
  id: NodeId
}

function InstanceBody({ componentId }: { componentId: string }) {
  const comp = useEditorStore((s) => s.project.components[componentId])
  if (!comp) return <span className="we-empty">Missing component</span>
  return <PreviewNode id={comp.doc.root} nodes={comp.doc.nodes} />
}

function computeDropIndex(
  container: HTMLElement,
  e: DragEvent,
  horizontal: boolean,
): number {
  const kids = Array.from(container.children).filter(
    (el) => (el as HTMLElement).dataset.nodeId,
  ) as HTMLElement[]

  for (let i = 0; i < kids.length; i++) {
    const r = kids[i].getBoundingClientRect()
    const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2
    const pos = horizontal ? e.clientX : e.clientY
    if (pos < mid) return i
  }
  return kids.length
}

export function NodeRenderer({ id }: Props) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const selectedId = useEditorStore((s) => s.selectedId)
  const select = useEditorStore((s) => s.select)
  const draggingId = useEditorStore((s) => s.draggingId)
  const draggingType = useEditorStore((s) => s.draggingType)
  const dropTarget = useEditorStore((s) => s.dropTarget)
  const startDragExisting = useEditorStore((s) => s.startDragExisting)
  const setDropTarget = useEditorStore((s) => s.setDropTarget)
  const endDrag = useEditorStore((s) => s.endDrag)
  const moveNode = useEditorStore((s) => s.moveNode)
  const addNode = useEditorStore((s) => s.addNode)
  const breakpoint = useEditorStore((s) => s.breakpoint)

  const ref = useRef<HTMLDivElement>(null)

  if (!node) return null
  const isSelected = selectedId === id
  const isDragging = draggingId !== null || draggingType !== null

  const selectionStyle: CSSProperties = isSelected
    ? { outline: '2px solid #4f46e5', outlineOffset: -1 }
    : {}

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    select(id)
  }

  const onDragStart = (e: DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    startDragExisting(id)
  }

  const onDragEnd = () => endDrag()

  const p = propsAt(node.props, breakpoint)
  const base = styleFromProps(p)
  const layout = (p.layout as string) ?? 'column'

  const containerProps = (horizontal: boolean) => ({
    ref,
    onDragOver: (e: DragEvent) => {
      if (!isDragging) return
      e.preventDefault()
      e.stopPropagation()
      if (!ref.current) return
      const index = computeDropIndex(ref.current, e, horizontal)
      setDropTarget({ parentId: id, index })
    },
    onDrop: (e: DragEvent) => {
      if (!isDragging) return
      e.preventDefault()
      e.stopPropagation()
      const dt = useEditorStore.getState().dropTarget
      const index =
        dt && dt.parentId === id ? dt.index : node.children.length
      const { draggingId: drag, draggingType: dragType } =
        useEditorStore.getState()
      if (dragType) addNode(dragType, id, index)
      else if (drag) moveNode(drag, id, index)
      endDrag()
    },
  })

  const renderChildren = (horizontal: boolean) => {
    const dropIndex =
      dropTarget && dropTarget.parentId === id ? dropTarget.index : -1
    const lineClass = horizontal ? 'we-dropline-v' : 'we-dropline-h'

    if (node.children.length === 0) {
      const label = node.type === 'root' ? 'page' : node.type
      return (
        <>
          {dropIndex === 0 && <span className={lineClass} />}
          <span className="we-empty">Empty {label} — drop here</span>
        </>
      )
    }

    return (
      <>
        {node.children.map((childId, i) => (
          <Fragment key={childId}>
            {dropIndex === i && <span className={lineClass} />}
            <NodeRenderer id={childId} />
          </Fragment>
        ))}
        {dropIndex === node.children.length && <span className={lineClass} />}
      </>
    )
  }

  switch (node.type) {
    case 'root':
      return (
        <div
          className="we-root"
          onClick={() => select(null)}
          {...containerProps(false)}
        >
          {renderChildren(false)}
        </div>
      )

    case 'box':
    case 'form': {
      const horizontal = layout === 'row'
      return (
        <div
          className="we-box"
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{
            ...layoutStyle(p),
            ...base,
            minHeight: node.children.length ? undefined : 36,
            ...selectionStyle,
          }}
          {...containerProps(horizontal)}
        >
          {renderChildren(horizontal)}
        </div>
      )
    }

    case 'heading':
      return (
        <EditableText
          id={id}
          tag={`h${(p.level as number) ?? 2}`}
          style={{ margin: 0, ...base, ...selectionStyle }}
        />
      )

    case 'text':
      return (
        <EditableText
          id={id}
          tag="p"
          style={{ margin: 0, ...base, ...selectionStyle }}
        />
      )

    case 'button':
      return (
        <EditableText
          id={id}
          tag="button"
          style={{ ...buttonBaseStyle, ...base, ...selectionStyle }}
        />
      )

    case 'image':
      return (
        <img
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          src={p.src as string}
          alt={p.alt as string}
          style={{ ...imageBaseStyle, ...base, ...selectionStyle }}
        />
      )

    case 'link':
      return (
        <EditableText
          id={id}
          tag="a"
          isLink
          style={{ ...linkBaseStyle, ...base, ...selectionStyle }}
        />
      )

    case 'divider':
      return (
        <div
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="we-divider"
          style={{ ...base, ...selectionStyle }}
        >
          <div
            style={{
              borderTop: `${(p.lineThickness as number) ?? 1}px solid ${
                (p.lineColor as string) ?? '#e5e7eb'
              }`,
            }}
          />
        </div>
      )

    case 'spacer':
      return (
        <div
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="we-spacer"
          style={{ height: (p.height as number) ?? 40, ...base, ...selectionStyle }}
        >
          <span>Spacer</span>
        </div>
      )

    case 'video':
    case 'embed':
      return (
        <div
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="we-media-placeholder"
          style={{ ...base, ...selectionStyle }}
        >
          {node.type === 'video' ? '▶ Video' : '⧉ Embed'}
          {p.src ? <small>{p.src as string}</small> : <small>no source set</small>}
        </div>
      )

    case 'input':
    case 'textarea': {
      const labelText = p.label as string
      const fieldStyle = labelText
        ? { ...inputBaseStyle }
        : { ...inputBaseStyle, ...base, ...selectionStyle }
      const field =
        node.type === 'input' ? (
          <input
            readOnly
            type={(p.inputType as string) ?? 'text'}
            placeholder={p.placeholder as string}
            style={fieldStyle}
            {...(labelText
              ? {}
              : {
                  'data-node-id': id,
                  draggable: true,
                  onClick,
                  onDragStart,
                  onDragEnd,
                })}
          />
        ) : (
          <textarea
            readOnly
            rows={(p.rows as number) ?? 4}
            placeholder={p.placeholder as string}
            style={{
              ...fieldStyle,
              resize: (p.resize as React.CSSProperties['resize']) ?? 'vertical',
            }}
            {...(labelText
              ? {}
              : {
                  'data-node-id': id,
                  draggable: true,
                  onClick,
                  onDragStart,
                  onDragEnd,
                })}
          />
        )

      if (!labelText) return field

      return (
        <label
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="we-labeled-field"
          style={{ ...base, ...selectionStyle }}
        >
          <span className="we-field-label">{labelText}</span>
          {field}
        </label>
      )
    }

    case 'icon':
      return (
        <Icon
          name={p.icon as string}
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{
            color: p.color as string,
            width: p.size as number,
            height: p.size as number,
            ...base,
            ...selectionStyle,
          }}
        />
      )

    case 'instance':
      return (
        <div
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="we-instance"
          style={{ ...base, ...selectionStyle }}
        >
          <div style={{ pointerEvents: 'none' }}>
            <InstanceBody componentId={p.componentId as string} />
          </div>
        </div>
      )

    case 'select':
    case 'checkbox':
    case 'radio': {
      const labelText = p.label as string
      const showLabel = node.type === 'select' && labelText
      return (
        <div
          data-node-id={id}
          draggable
          onClick={onClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={showLabel ? 'we-labeled-field' : undefined}
          style={{ ...base, ...selectionStyle }}
        >
          {showLabel ? <span className="we-field-label">{labelText}</span> : null}
          <FormControl node={node} interactive={false} />
        </div>
      )
    }

    default:
      return null
  }
}
