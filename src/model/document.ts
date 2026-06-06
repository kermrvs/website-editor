import type { EditorDocument, EditorNode, NodeType } from './types'

let counter = 0
/** Simple unique id generator for new nodes. */
export function makeId(prefix = 'n'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

/** Sensible default props for each block type when it is first created. */
const DEFAULT_PROPS: Record<NodeType, Record<string, unknown>> = {
  root: {},
  box: { padding: 16, background: '#ffffff' },
  text: { text: 'New text' },
  heading: { text: 'Heading', level: 2 },
  button: { text: 'Button' },
  image: { src: 'https://placehold.co/200x120', alt: '' },
}

/** Whether a node type is allowed to contain children. */
export function canHaveChildren(type: NodeType): boolean {
  return type === 'root' || type === 'box'
}

export function createNode(type: NodeType): EditorNode {
  return {
    id: makeId(type),
    type,
    props: { ...DEFAULT_PROPS[type] },
    children: [],
  }
}

/** An empty starter document containing just a root with one box inside. */
export function createEmptyDocument(): EditorDocument {
  const root = createNode('root')
  const box = createNode('box')
  const heading = createNode('heading')
  heading.props = { text: 'Welcome to your editor', level: 1 }
  const text = createNode('text')
  text.props = { text: 'Drag blocks from the left, or edit me.' }

  box.children = [heading.id, text.id]
  root.children = [box.id]

  return {
    root: root.id,
    nodes: {
      [root.id]: root,
      [box.id]: box,
      [heading.id]: heading,
      [text.id]: text,
    },
  }
}

/** Find the id of the parent that contains `childId`, or null for the root. */
export function findParentId(
  doc: EditorDocument,
  childId: string,
): string | null {
  for (const node of Object.values(doc.nodes)) {
    if (node.children.includes(childId)) return node.id
  }
  return null
}
