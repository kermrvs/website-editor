// The document model — the single source of truth for the whole editor.
// Both the visual canvas and (later) the code view read from and write to
// this same tree. A document is a tree of nodes.

export type NodeId = string

/** The kinds of blocks the editor understands out of the box. */
export type NodeType =
  | 'root'
  | 'box'
  | 'text'
  | 'heading'
  | 'button'
  | 'image'

export interface EditorNode {
  id: NodeId
  type: NodeType
  /** Free-form props (text content, styles, src, etc.) per node type. */
  props: Record<string, unknown>
  /** Child node ids, in render order. Leaf nodes have an empty array. */
  children: NodeId[]
}

/**
 * The whole document is stored as a flat map of nodes keyed by id, plus the
 * id of the root. A flat map (instead of a nested tree) makes lookups,
 * updates, moves and deletes simple and cheap.
 */
export interface EditorDocument {
  root: NodeId
  nodes: Record<NodeId, EditorNode>
}
