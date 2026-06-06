import { create } from 'zustand'
import type { EditorDocument, NodeId, NodeType } from './model/types'
import {
  canHaveChildren,
  createEmptyDocument,
  createNode,
  findParentId,
  makeId,
} from './model/document'

export type EditorMode = 'visual' | 'preview' | 'code'

export interface DropTarget {
  parentId: NodeId
  index: number
}

interface EditorState {
  doc: EditorDocument
  selectedId: NodeId | null
  mode: EditorMode

  draggingId: NodeId | null
  draggingType: NodeType | null
  dropTarget: DropTarget | null

  setDoc: (doc: EditorDocument) => void
  setMode: (mode: EditorMode) => void
  select: (id: NodeId | null) => void

  addNode: (type: NodeType, parentId: NodeId, index?: number) => void
  updateProps: (id: NodeId, props: Record<string, unknown>) => void
  removeNode: (id: NodeId) => void
  duplicateNode: (id: NodeId) => void
  moveNode: (id: NodeId, parentId: NodeId, index: number) => void

  startDragExisting: (id: NodeId) => void
  startDragNew: (type: NodeType) => void
  setDropTarget: (target: DropTarget | null) => void
  endDrag: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  doc: createEmptyDocument(),
  selectedId: null,
  mode: 'visual',

  draggingId: null,
  draggingType: null,
  dropTarget: null,

  setDoc: (doc) =>
    set((s) => ({
      doc,
      selectedId: s.selectedId && doc.nodes[s.selectedId] ? s.selectedId : null,
    })),
  setMode: (mode) => set({ mode }),
  select: (id) => set({ selectedId: id }),

  addNode: (type, parentId, index) => {
    const { doc } = get()
    const parent = doc.nodes[parentId]
    if (!parent || !canHaveChildren(parent.type)) return

    const node = createNode(type)
    const children = [...parent.children]
    const at =
      index === undefined
        ? children.length
        : Math.max(0, Math.min(index, children.length))
    children.splice(at, 0, node.id)

    set({
      doc: {
        ...doc,
        nodes: {
          ...doc.nodes,
          [node.id]: node,
          [parentId]: { ...parent, children },
        },
      },
      selectedId: node.id,
    })
  },

  updateProps: (id, props) => {
    const { doc } = get()
    const node = doc.nodes[id]
    if (!node) return
    set({
      doc: {
        ...doc,
        nodes: {
          ...doc.nodes,
          [id]: { ...node, props: { ...node.props, ...props } },
        },
      },
    })
  },

  removeNode: (id) => {
    const { doc, selectedId } = get()
    if (id === doc.root) return

    const toDelete = new Set<string>()
    const stack = [id]
    while (stack.length) {
      const current = stack.pop()!
      toDelete.add(current)
      const node = doc.nodes[current]
      if (node) stack.push(...node.children)
    }

    const parentId = findParentId(doc, id)
    const nodes = { ...doc.nodes }
    for (const del of toDelete) delete nodes[del]
    if (parentId && nodes[parentId]) {
      nodes[parentId] = {
        ...nodes[parentId],
        children: nodes[parentId].children.filter((c) => c !== id),
      }
    }

    set({
      doc: { ...doc, nodes },
      selectedId: selectedId && toDelete.has(selectedId) ? null : selectedId,
    })
  },

  duplicateNode: (id) => {
    const { doc } = get()
    if (id === doc.root) return
    const parentId = findParentId(doc, id)
    if (!parentId) return

    const nodes = { ...doc.nodes }
    const clone = (srcId: string): string => {
      const src = doc.nodes[srcId]
      const copyId = makeId(src.type)
      nodes[copyId] = {
        id: copyId,
        type: src.type,
        props: { ...src.props },
        children: src.children.map(clone),
      }
      return copyId
    }

    const newId = clone(id)
    const parent = nodes[parentId]
    const index = parent.children.indexOf(id)
    const children = [...parent.children]
    children.splice(index + 1, 0, newId)
    nodes[parentId] = { ...parent, children }

    set({ doc: { ...doc, nodes }, selectedId: newId })
  },

  moveNode: (id, parentId, index) => {
    const { doc } = get()
    if (id === doc.root) return

    const banned = new Set<string>()
    const stack = [id]
    while (stack.length) {
      const current = stack.pop()!
      banned.add(current)
      const n = doc.nodes[current]
      if (n) stack.push(...n.children)
    }
    if (banned.has(parentId)) return

    const target = doc.nodes[parentId]
    if (!target || !canHaveChildren(target.type)) return

    const oldParentId = findParentId(doc, id)
    if (!oldParentId) return

    const nodes = { ...doc.nodes }

    if (oldParentId === parentId) {
      const oldIndex = target.children.indexOf(id)
      const children = target.children.filter((c) => c !== id)
      let at = oldIndex < index ? index - 1 : index
      at = Math.max(0, Math.min(at, children.length))
      children.splice(at, 0, id)
      nodes[parentId] = { ...target, children }
    } else {
      const oldParent = nodes[oldParentId]
      nodes[oldParentId] = {
        ...oldParent,
        children: oldParent.children.filter((c) => c !== id),
      }
      const children = [...target.children]
      const at = Math.max(0, Math.min(index, children.length))
      children.splice(at, 0, id)
      nodes[parentId] = { ...target, children }
    }

    set({ doc: { ...doc, nodes }, selectedId: id })
  },

  startDragExisting: (id) => set({ draggingId: id, draggingType: null }),
  startDragNew: (type) => set({ draggingType: type, draggingId: null }),
  setDropTarget: (target) => set({ dropTarget: target }),
  endDrag: () => set({ draggingId: null, draggingType: null, dropTarget: null }),
}))
