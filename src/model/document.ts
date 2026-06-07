import type { EditorDocument, EditorNode, NodeType } from './types'

let counter = 0

export function makeId(prefix = 'n'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

const DEFAULT_PROPS: Record<NodeType, Record<string, unknown>> = {
  root: {},
  box: { layout: 'column', gap: 8, padding: 16 },
  text: { text: 'New text' },
  heading: { text: 'Heading', level: 2 },
  button: { text: 'Button' },
  image: { src: 'https://placehold.co/200x120', alt: '' },
  link: { text: 'Link', linkTo: '' },
  divider: { lineColor: '#e5e7eb', lineThickness: 1 },
  spacer: { height: 40 },
  video: { src: '' },
  embed: { src: '', height: 400 },
  input: { placeholder: 'Enter text…', inputType: 'text' },
  textarea: { placeholder: 'Your message…', rows: 4 },
  form: { layout: 'column', gap: 12, action: '', method: 'post' },
  select: { options: ['Option 1', 'Option 2'], placeholder: '' },
  checkbox: { label: 'Check me' },
  radio: { options: ['Option 1', 'Option 2'] },
  icon: { icon: '', size: 24 },
}

export function canHaveChildren(type: NodeType): boolean {
  return type === 'root' || type === 'box' || type === 'form'
}

export function createNode(type: NodeType): EditorNode {
  return {
    id: makeId(type),
    type,
    props: { ...DEFAULT_PROPS[type] },
    children: [],
  }
}

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

export function findParentId(
  doc: EditorDocument,
  childId: string,
): string | null {
  for (const node of Object.values(doc.nodes)) {
    if (node.children.includes(childId)) return node.id
  }
  return null
}
