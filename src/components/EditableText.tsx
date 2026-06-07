import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { NodeId } from '../model/types'
import { useEditorStore } from '../store'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function placeCaretEnd(el: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

interface Props {
  id: NodeId
  tag: string
  style: CSSProperties
  isLink?: boolean
}

export function EditableText({ id, tag, style, isLink }: Props) {
  const node = useEditorStore((s) => s.doc.nodes[id])
  const editingId = useEditorStore((s) => s.editingId)
  const select = useEditorStore((s) => s.select)
  const setEditing = useEditorStore((s) => s.setEditing)
  const updateProps = useEditorStore((s) => s.updateProps)
  const startDragExisting = useEditorStore((s) => s.startDragExisting)
  const endDrag = useEditorStore((s) => s.endDrag)

  const ref = useRef<HTMLElement>(null)
  const [frozen, setFrozen] = useState<string | null>(null)

  const editing = editingId === id

  const initialHtml = () =>
    (node?.props.html as string) ??
    escapeHtml(String(node?.props.text ?? ''))

  useEffect(() => {
    if (editing) {
      setFrozen(initialHtml())
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.focus()
          placeCaretEnd(ref.current)
        }
      })
    } else {
      setFrozen(null)
    }
  }, [editing])

  if (!node) return null

  const content = frozen ?? initialHtml()

  const commit = () => {
    const el = ref.current
    if (el) updateProps(id, { html: el.innerHTML, text: el.textContent ?? '' })
    setEditing(null)
  }

  const Tag: any = tag

  return (
    <Tag
      ref={ref}
      data-node-id={id}
      draggable={!editing}
      contentEditable={editing}
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        ...style,
        ...(editing ? { cursor: 'text', outline: '2px solid #4f46e5' } : {}),
      }}
      onClick={(e: React.MouseEvent) => {
        if (isLink) e.preventDefault()
        e.stopPropagation()
        if (!editing) select(id)
      }}
      onDoubleClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        setEditing(id)
      }}
      onDragStart={(e: React.DragEvent) => {
        if (editing) {
          e.preventDefault()
          return
        }
        e.stopPropagation()
        startDragExisting(id)
      }}
      onDragEnd={() => endDrag()}
      onBlur={
        editing
          ? (e: React.FocusEvent) => {
              const next = e.relatedTarget as HTMLElement | null
              if (next && next.closest && next.closest('.we-formatbar')) return
              commit()
            }
          : undefined
      }
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
      }}
    />
  )
}
