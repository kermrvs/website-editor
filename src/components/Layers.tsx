import { useState } from 'react'
import type { DragEvent } from 'react'
import type { EditorNode, NodeId } from '../model/types'
import { canHaveChildren, findParentId } from '../model/document'
import { useEditorStore } from '../store'

type DropPos = 'before' | 'after' | 'inside'

interface Indicator {
  id: NodeId
  pos: DropPos
}

function nodeLabel(node: EditorNode): string {
  if (node.type === 'root') return 'Page'
  const text = node.props.text
  if (typeof text === 'string' && text.trim()) {
    return `${node.type} · ${text.slice(0, 16)}`
  }
  return node.type
}

interface RowProps {
  id: NodeId
  depth: number
  collapsed: Set<NodeId>
  toggle: (id: NodeId) => void
  expand: (id: NodeId) => void
  indicator: Indicator | null
  setIndicator: (i: Indicator | null) => void
}

function LayerRow({
  id,
  depth,
  collapsed,
  toggle,
  expand,
  indicator,
  setIndicator,
}: RowProps) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const selectedId = useEditorStore((s) => s.selectedId)
  const select = useEditorStore((s) => s.select)
  const startDragExisting = useEditorStore((s) => s.startDragExisting)
  const moveNode = useEditorStore((s) => s.moveNode)
  const addNode = useEditorStore((s) => s.addNode)
  const endDrag = useEditorStore((s) => s.endDrag)

  if (!node) return null

  const isRoot = node.type === 'root'
  const isContainer = canHaveChildren(node.type)
  const hasChildren = node.children.length > 0
  const isOpen = !collapsed.has(id)
  const isSelected = selectedId === id

  const onDragOver = (e: DragEvent) => {
    const { draggingId, draggingType } = useEditorStore.getState()
    if (draggingId === null && draggingType === null) return
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const offset = (e.clientY - rect.top) / rect.height

    let pos: DropPos
    if (isRoot) pos = 'inside'
    else if (isContainer && offset > 0.3 && offset < 0.7) pos = 'inside'
    else pos = offset < 0.5 ? 'before' : 'after'

    setIndicator({ id, pos })
  }

  const onDrop = (e: DragEvent) => {
    const { draggingId, draggingType } = useEditorStore.getState()
    if (draggingId === null && draggingType === null) return
    e.preventDefault()
    e.stopPropagation()

    const doc = useEditorStore.getState().doc
    const ind = indicator && indicator.id === id ? indicator.pos : 'after'

    let parentId: NodeId
    let index: number
    if (ind === 'inside') {
      parentId = id
      index = node.children.length
      expand(id)
    } else {
      const pid = findParentId(doc, id)
      if (!pid) {
        setIndicator(null)
        endDrag()
        return
      }
      parentId = pid
      const at = doc.nodes[pid].children.indexOf(id)
      index = ind === 'after' ? at + 1 : at
    }

    if (draggingType) addNode(draggingType, parentId, index)
    else if (draggingId) moveNode(draggingId, parentId, index)

    setIndicator(null)
    endDrag()
  }

  const dropClass =
    indicator && indicator.id === id ? ` drop-${indicator.pos}` : ''

  return (
    <>
      <div
        className={`we-layer${isSelected ? ' selected' : ''}${dropClass}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        draggable={!isRoot}
        onClick={() => select(id)}
        onDragStart={(e) => {
          e.stopPropagation()
          startDragExisting(id)
        }}
        onDragEnd={() => {
          setIndicator(null)
          endDrag()
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <span
          className="we-caret"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) toggle(id)
          }}
        >
          {hasChildren ? (isOpen ? '▾' : '▸') : ''}
        </span>
        <span className="we-layer-label">{nodeLabel(node)}</span>
      </div>
      {isOpen &&
        node.children.map((childId) => (
          <LayerRow
            key={childId}
            id={childId}
            depth={depth + 1}
            collapsed={collapsed}
            toggle={toggle}
            expand={expand}
            indicator={indicator}
            setIndicator={setIndicator}
          />
        ))}
    </>
  )
}

export function Layers() {
  const rootId = useEditorStore((s) => s.doc.root)
  const [collapsed, setCollapsed] = useState<Set<NodeId>>(new Set())
  const [indicator, setIndicator] = useState<Indicator | null>(null)

  const toggle = (id: NodeId) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const expand = (id: NodeId) =>
    setCollapsed((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })

  return (
    <div className="we-layers">
      <div className="we-panel-title">Layers</div>
      <LayerRow
        id={rootId}
        depth={0}
        collapsed={collapsed}
        toggle={toggle}
        expand={expand}
        indicator={indicator}
        setIndicator={setIndicator}
      />
    </div>
  )
}
