import { create } from 'zustand'
import type { EditorDocument, NodeId, NodeType } from './model/types'
import type { Project } from './model/project'
import { createEmptyProject, createPage, currentDoc } from './model/project'
import {
  canHaveChildren,
  createNode,
  findParentId,
  makeId,
} from './model/document'
import type { Breakpoint } from './model/render'
import { RESPONSIVE_KEYS } from './model/render'

export type EditorMode = 'visual' | 'preview' | 'code'

export interface DropTarget {
  parentId: NodeId
  index: number
}

interface EditorState {
  project: Project
  doc: EditorDocument
  selectedId: NodeId | null
  mode: EditorMode

  past: Project[]
  future: Project[]
  lastTag: string | null

  editingId: NodeId | null
  breakpoint: Breakpoint

  draggingId: NodeId | null
  draggingType: NodeType | null
  dropTarget: DropTarget | null

  setProject: (project: Project) => void
  undo: () => void
  redo: () => void
  setEditing: (id: NodeId | null) => void
  setBreakpoint: (breakpoint: Breakpoint) => void
  addPage: () => void
  removePage: (id: string) => void
  renamePage: (id: string, name: string) => void
  selectPage: (id: string) => void

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

const HISTORY_LIMIT = 100

export const useEditorStore = create<EditorState>((set, get) => {
  const initialProject = createEmptyProject()

  const commit = (
    doc: EditorDocument,
    extra: Partial<EditorState> = {},
    tag?: string,
  ) =>
    set((state) => {
      const project = {
        ...state.project,
        pages: state.project.pages.map((p) =>
          p.id === state.project.currentPageId ? { ...p, doc } : p,
        ),
      }
      const coalesce = tag !== undefined && tag === state.lastTag
      return {
        doc,
        project,
        past: coalesce
          ? state.past
          : [...state.past, state.project].slice(-HISTORY_LIMIT),
        future: [],
        lastTag: tag ?? null,
        ...extra,
      }
    })

  const pushHistory = (state: EditorState) => ({
    past: [...state.past, state.project].slice(-HISTORY_LIMIT),
    future: [] as Project[],
    lastTag: null,
  })

  return {
    project: initialProject,
    doc: currentDoc(initialProject),
    selectedId: null,
    mode: 'visual',

    past: [],
    future: [],
    lastTag: null,

    editingId: null,
    breakpoint: 'base',

    draggingId: null,
    draggingType: null,
    dropTarget: null,

    setProject: (project) =>
      set((state) => {
        const doc = currentDoc(project)
        const selectedId =
          state.selectedId && doc.nodes[state.selectedId]
            ? state.selectedId
            : null
        return { project, doc, selectedId, past: [], future: [], lastTag: null }
      }),

    undo: () =>
      set((state) => {
        if (!state.past.length) return state
        const previous = state.past[state.past.length - 1]
        return {
          project: previous,
          doc: currentDoc(previous),
          past: state.past.slice(0, -1),
          future: [state.project, ...state.future].slice(0, HISTORY_LIMIT),
          selectedId: null,
          lastTag: null,
        }
      }),

    redo: () =>
      set((state) => {
        if (!state.future.length) return state
        const next = state.future[0]
        return {
          project: next,
          doc: currentDoc(next),
          past: [...state.past, state.project].slice(-HISTORY_LIMIT),
          future: state.future.slice(1),
          selectedId: null,
          lastTag: null,
        }
      }),

    addPage: () =>
      set((state) => {
        const page = createPage(`Page ${state.project.pages.length + 1}`)
        return {
          ...pushHistory(state),
          project: {
            pages: [...state.project.pages, page],
            currentPageId: page.id,
          },
          doc: page.doc,
          selectedId: null,
        }
      }),

    removePage: (id) =>
      set((state) => {
        if (state.project.pages.length <= 1) return state
        const pages = state.project.pages.filter((p) => p.id !== id)
        const currentPageId =
          state.project.currentPageId === id
            ? pages[0].id
            : state.project.currentPageId
        const project = { pages, currentPageId }
        return {
          ...pushHistory(state),
          project,
          doc: currentDoc(project),
          selectedId: null,
        }
      }),

    renamePage: (id, name) =>
      set((state) => ({
        ...pushHistory(state),
        project: {
          ...state.project,
          pages: state.project.pages.map((p) =>
            p.id === id ? { ...p, name } : p,
          ),
        },
      })),

    selectPage: (id) =>
      set((state) => {
        const page = state.project.pages.find((p) => p.id === id)
        if (!page) return state
        return {
          project: { ...state.project, currentPageId: id },
          doc: page.doc,
          selectedId: null,
          lastTag: null,
        }
      }),

    setMode: (mode) => set({ mode }),
    select: (id) => set({ selectedId: id, lastTag: null, editingId: null }),
    setEditing: (id) => set({ editingId: id }),
    setBreakpoint: (breakpoint) => set({ breakpoint }),

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

      commit(
        {
          ...doc,
          nodes: {
            ...doc.nodes,
            [node.id]: node,
            [parentId]: { ...parent, children },
          },
        },
        { selectedId: node.id },
      )
    },

    updateProps: (id, props) => {
      const { doc, breakpoint } = get()
      const node = doc.nodes[id]
      if (!node) return

      let nextProps: Record<string, unknown>
      if (breakpoint === 'base') {
        nextProps = { ...node.props, ...props }
      } else {
        const basePatch: Record<string, unknown> = {}
        const bucketPatch: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(props)) {
          if (RESPONSIVE_KEYS.has(key)) bucketPatch[key] = value
          else basePatch[key] = value
        }
        const bucket = (node.props[breakpoint] as Record<string, unknown>) ?? {}
        nextProps = {
          ...node.props,
          ...basePatch,
          [breakpoint]: { ...bucket, ...bucketPatch },
        }
      }

      commit(
        {
          ...doc,
          nodes: { ...doc.nodes, [id]: { ...node, props: nextProps } },
        },
        {},
        `props:${id}:${breakpoint}:${Object.keys(props).join(',')}`,
      )
    },

    removeNode: (id) => {
      const { doc, selectedId } = get()
      if (id === doc.root) return

      const toDelete = new Set<string>()
      const stack = [id]
      while (stack.length) {
        const current = stack.pop()!
        toDelete.add(current)
        const n = doc.nodes[current]
        if (n) stack.push(...n.children)
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

      commit(
        { ...doc, nodes },
        { selectedId: selectedId && toDelete.has(selectedId) ? null : selectedId },
      )
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

      commit({ ...doc, nodes }, { selectedId: newId })
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

      commit({ ...doc, nodes }, { selectedId: id })
    },

    startDragExisting: (id) => set({ draggingId: id, draggingType: null }),
    startDragNew: (type) => set({ draggingType: type, draggingId: null }),
    setDropTarget: (target) => set({ dropTarget: target }),
    endDrag: () => set({ draggingId: null, draggingType: null, dropTarget: null }),
  }
})
