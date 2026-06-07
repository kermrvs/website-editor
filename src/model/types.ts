export type NodeId = string

export type NodeType =
  | 'root'
  | 'box'
  | 'text'
  | 'heading'
  | 'button'
  | 'image'
  | 'link'
  | 'divider'
  | 'spacer'
  | 'video'
  | 'embed'

export interface EditorNode {
  id: NodeId
  type: NodeType
  props: Record<string, unknown>
  children: NodeId[]
}

export interface EditorDocument {
  root: NodeId
  nodes: Record<NodeId, EditorNode>
}
