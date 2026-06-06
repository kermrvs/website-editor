import { create } from 'zustand'
import type { EditorDocument, NodeId, NodeType } from './model/types'
import {
  canHaveChildren,
  createEmptyDocument,
  createNode,
  findParentId,
} from './model/document'

export type EditorMode = 'visual' | 'code'

interface EditorState {
  doc: EditorDocument
  selectedId: NodeId | null
  mode: EditorMode

  setDoc: (doc: EditorDocument) => void
  setMode: (mode: EditorMode) => void
  select: (id: NodeId | null) => void

  addNode: (type: NodeType, parentId: NodeId) => void
  updateProps: (id: NodeId, props: Record<string, unknown>) => void
  removeNode: (id: NodeId) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  doc: createEmptyDocument(),
  selectedId: null,
  mode: 'visual',

  setDoc: (doc) => set({ doc, selectedId: null }),
  setMode: (mode) => set({ mode }),
  select: (id) => set({ selectedId: id }),

  addNode: (type, parentId) => {
    const { doc } = get()
    const parent = doc.nodes[parentId]
    if (!parent || !canHaveChildren(parent.type)) return

    const node = createNode(type)
    set({
      doc: {
        ...doc,
        nodes: {
          ...doc.nodes,
          [node.id]: node,
          [parentId]: { ...parent, children: [...parent.children, node.id] },
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
}))
