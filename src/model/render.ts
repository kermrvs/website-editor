import type { CSSProperties } from 'react'
import type { EditorDocument, EditorNode } from './types'

const ALIGN_MAP: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  between: 'space-between',
}

export const buttonBaseStyle: CSSProperties = {
  padding: '8px 16px',
  background: '#4f46e5',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

export const imageBaseStyle: CSSProperties = {
  maxWidth: '100%',
  display: 'block',
}

export function styleFromProps(p: Record<string, unknown>): CSSProperties {
  const s: CSSProperties = {}
  if (p.background != null) s.background = p.background as string
  if (p.color != null) s.color = p.color as string
  if (p.padding != null) s.padding = p.padding as number
  if (p.margin != null) s.margin = p.margin as number
  if (p.radius != null) s.borderRadius = p.radius as number
  if (p.width != null) s.width = p.width as number | string
  if (p.maxWidth != null) {
    s.maxWidth = p.maxWidth as number
    if (p.width == null) s.width = '100%'
    s.marginLeft = 'auto'
    s.marginRight = 'auto'
  }
  if (p.fontSize != null) s.fontSize = p.fontSize as number
  if (p.fontWeight != null) s.fontWeight = p.fontWeight as number
  if (p.textAlign != null) s.textAlign = p.textAlign as CSSProperties['textAlign']
  if (p.shadow) s.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)'
  if (p.border) s.border = '1px solid #e5e7eb'
  return s
}

export function layoutStyle(p: Record<string, unknown>): CSSProperties {
  const layout = (p.layout as string) ?? 'column'
  const gap = (p.gap as number) ?? 0
  const align = p.align ? ALIGN_MAP[p.align as string] : undefined

  if (layout === 'grid') {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${(p.columns as number) ?? 2}, 1fr)`,
      gap,
      alignItems: align,
    }
  }

  return {
    display: 'flex',
    flexDirection: layout === 'row' ? 'row' : 'column',
    flexWrap: layout === 'row' ? 'wrap' : undefined,
    gap,
    alignItems: align,
    justifyContent: p.justify ? ALIGN_MAP[p.justify as string] : undefined,
  }
}

export interface NodeView {
  tag: string
  style: CSSProperties
  text?: string
  selfClosing?: boolean
  attrs?: Record<string, string>
}

export function describeNode(node: EditorNode): NodeView {
  const p = node.props
  switch (node.type) {
    case 'root':
      return { tag: 'div', style: { display: 'flex', flexDirection: 'column' } }
    case 'box':
      return { tag: 'div', style: { ...layoutStyle(p), ...styleFromProps(p) } }
    case 'heading':
      return {
        tag: `h${(p.level as number) ?? 2}`,
        style: { margin: 0, ...styleFromProps(p) },
        text: (p.text as string) ?? '',
      }
    case 'text':
      return {
        tag: 'p',
        style: { margin: 0, ...styleFromProps(p) },
        text: (p.text as string) ?? '',
      }
    case 'button':
      return {
        tag: 'button',
        style: { ...buttonBaseStyle, ...styleFromProps(p) },
        text: (p.text as string) ?? '',
      }
    case 'image':
      return {
        tag: 'img',
        selfClosing: true,
        attrs: { src: (p.src as string) ?? '', alt: (p.alt as string) ?? '' },
        style: { ...imageBaseStyle, ...styleFromProps(p) },
      }
    default:
      return { tag: 'div', style: {} }
  }
}

const UNITLESS = new Set([
  'fontWeight',
  'lineHeight',
  'opacity',
  'zIndex',
  'flexGrow',
  'flexShrink',
  'order',
])

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

function cssString(style: CSSProperties): string {
  return Object.entries(style)
    .filter(([, v]) => v != null)
    .map(([k, v]) => {
      const value =
        typeof v === 'number' && !UNITLESS.has(k) ? `${v}px` : String(v)
      return `${kebab(k)}: ${value}`
    })
    .join('; ')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function serializeNode(doc: EditorDocument, id: string, indent: number): string {
  const node = doc.nodes[id]
  if (!node) return ''

  const view = describeNode(node)
  const pad = '  '.repeat(indent)
  const css = cssString(view.style)
  const styleAttr = css ? ` style="${css}"` : ''

  if (view.selfClosing) {
    const attrs = Object.entries(view.attrs ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
      .join('')
    return `${pad}<${view.tag}${attrs}${styleAttr} />`
  }

  if (node.children.length === 0 && view.text !== undefined) {
    return `${pad}<${view.tag}${styleAttr}>${escapeHtml(view.text)}</${view.tag}>`
  }

  const inner = node.children
    .map((childId) => serializeNode(doc, childId, indent + 1))
    .join('\n')
  const body = inner ? `\n${inner}\n${pad}` : ''
  return `${pad}<${view.tag}${styleAttr}>${body}</${view.tag}>`
}

export function toHtml(doc: EditorDocument): string {
  return serializeNode(doc, doc.root, 0)
}

export function toHtmlDocument(doc: EditorDocument): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Exported page</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
</style>
</head>
<body>
${toHtml(doc)}
</body>
</html>
`
}
