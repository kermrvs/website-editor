import type { CSSProperties } from 'react'
import type { EditorDocument, EditorNode } from './types'
import type { Project } from './project'

export interface RenderContext {
  resolveLink?: (pageId: string) => string
}

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

export const linkBaseStyle: CSSProperties = {
  color: '#4f46e5',
  textDecoration: 'none',
  cursor: 'pointer',
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function sideShorthand(
  p: Record<string, unknown>,
  base: string,
  top: string,
  right: string,
  bottom: string,
  left: string,
): string | number | undefined {
  const sides = [p[top], p[right], p[bottom], p[left]]
  if (sides.some((v) => v != null)) {
    const b = (p[base] as number) ?? 0
    const v = (x: unknown) => (x as number) ?? b
    return `${v(p[top])}px ${v(p[right])}px ${v(p[bottom])}px ${v(p[left])}px`
  }
  if (p[base] != null) return p[base] as number
  return undefined
}

export function styleFromProps(p: Record<string, unknown>): CSSProperties {
  const s: CSSProperties = {}
  if (p.background != null) s.background = p.background as string
  if (p.color != null) s.color = p.color as string
  const pad = sideShorthand(
    p,
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
  )
  if (pad !== undefined) s.padding = pad
  const mar = sideShorthand(
    p,
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
  )
  if (mar !== undefined) s.margin = mar
  const corners = [p.radiusTL, p.radiusTR, p.radiusBR, p.radiusBL]
  if (corners.some((c) => c != null)) {
    const base = (p.radius as number) ?? 0
    const v = (c: unknown) => (c as number) ?? base
    s.borderRadius = `${v(p.radiusTL)}px ${v(p.radiusTR)}px ${v(p.radiusBR)}px ${v(p.radiusBL)}px`
  } else if (p.radius != null) {
    s.borderRadius = p.radius as number
  }
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
  if (p.shadow) {
    const x = (p.shadowX as number) ?? 0
    const y = (p.shadowY as number) ?? 4
    const blur = (p.shadowBlur as number) ?? 16
    const spread = (p.shadowSpread as number) ?? 0
    const color = hexToRgba(
      (p.shadowColor as string) ?? '#000000',
      (p.shadowOpacity as number) ?? 0.1,
    )
    const inset = p.shadowInset ? 'inset ' : ''
    s.boxShadow = `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`
  }
  if (p.border) {
    const w = (p.borderWidth as number) ?? 1
    const style = (p.borderStyle as string) ?? 'solid'
    const color = (p.borderColor as string) ?? '#e5e7eb'
    s.border = `${w}px ${style} ${color}`
  }
  if (p.scale != null) s.transform = `scale(${p.scale as number})`
  if (p.bgImage) {
    const url = `url("${p.bgImage as string}")`
    const overlay = p.bgOverlay as number
    s.backgroundImage =
      overlay > 0
        ? `linear-gradient(rgba(0, 0, 0, ${overlay}), rgba(0, 0, 0, ${overlay})), ${url}`
        : url
    s.backgroundSize = (p.bgSize as string) ?? 'cover'
    s.backgroundPosition = (p.bgPosition as string) ?? 'center'
    s.backgroundRepeat = 'no-repeat'
  }
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
  html?: string
  selfClosing?: boolean
  attrs?: Record<string, string>
  hoverStyle?: CSSProperties
}

export function nodeHref(node: EditorNode, ctx?: RenderContext): string | null {
  const linkTo = node.props.linkTo as string
  const href = node.props.href as string
  if (linkTo) return ctx?.resolveLink ? ctx.resolveLink(linkTo) : '#'
  if (href) return href
  return null
}

export function describeNode(node: EditorNode, ctx?: RenderContext): NodeView {
  const view = viewForType(node, ctx)
  const hover = node.props.hover
  if (hover) {
    const hoverStyle = styleFromProps(hover as Record<string, unknown>)
    if (Object.keys(hoverStyle).length) view.hoverStyle = hoverStyle
  }
  return view
}

function viewForType(node: EditorNode, ctx?: RenderContext): NodeView {
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
        html: p.html as string | undefined,
      }
    case 'text':
      return {
        tag: 'p',
        style: { margin: 0, ...styleFromProps(p) },
        text: (p.text as string) ?? '',
        html: p.html as string | undefined,
      }
    case 'button':
      return {
        tag: 'button',
        style: { ...buttonBaseStyle, ...styleFromProps(p) },
        text: (p.text as string) ?? '',
        html: p.html as string | undefined,
      }
    case 'image':
      return {
        tag: 'img',
        selfClosing: true,
        attrs: { src: (p.src as string) ?? '', alt: (p.alt as string) ?? '' },
        style: { ...imageBaseStyle, ...styleFromProps(p) },
      }
    case 'link':
      return {
        tag: 'a',
        style: { ...linkBaseStyle, ...styleFromProps(p) },
        text: (p.text as string) ?? '',
        html: p.html as string | undefined,
        attrs: { href: nodeHref(node, ctx) ?? '#' },
      }
    case 'divider':
      return {
        tag: 'hr',
        selfClosing: true,
        style: {
          border: 'none',
          borderTop: `${(p.lineThickness as number) ?? 1}px solid ${
            (p.lineColor as string) ?? '#e5e7eb'
          }`,
          ...styleFromProps(p),
        },
      }
    case 'spacer':
      return {
        tag: 'div',
        style: { height: (p.height as number) ?? 40, ...styleFromProps(p) },
      }
    case 'video':
      return {
        tag: 'video',
        style: { maxWidth: '100%', display: 'block', ...styleFromProps(p) },
        attrs: { src: (p.src as string) ?? '', controls: 'controls' },
      }
    case 'embed':
      return {
        tag: 'iframe',
        style: {
          width: '100%',
          height: (p.height as number) ?? 400,
          border: 'none',
          ...styleFromProps(p),
        },
        attrs: { src: (p.src as string) ?? '' },
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

function attrString(attrs?: Record<string, string>): string {
  return Object.entries(attrs ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('')
}

interface StyleEntry {
  name: string
  css: string
  hoverCss: string
}

class StyleSheet {
  private entries = new Map<string, StyleEntry>()

  classFor(style: CSSProperties, hover?: CSSProperties): string | null {
    const css = cssString(style)
    const hoverCss = hover ? cssString(hover) : ''
    if (!css && !hoverCss) return null

    const key = `${css}||${hoverCss}`
    let entry = this.entries.get(key)
    if (!entry) {
      entry = { name: `c${this.entries.size + 1}`, css, hoverCss }
      this.entries.set(key, entry)
    }
    return entry.name
  }

  toCss(indent: string): string {
    const lines: string[] = []
    for (const entry of this.entries.values()) {
      const base = entry.hoverCss
        ? entry.css
          ? `${entry.css}; transition: all 0.2s ease`
          : 'transition: all 0.2s ease'
        : entry.css
      if (base) lines.push(`${indent}.${entry.name} { ${base} }`)
      if (entry.hoverCss) {
        lines.push(`${indent}.${entry.name}:hover { ${entry.hoverCss} }`)
      }
    }
    return lines.join('\n')
  }
}

function serializeNode(
  doc: EditorDocument,
  id: string,
  indent: number,
  sheet: StyleSheet,
  ctx?: RenderContext,
): string {
  const node = doc.nodes[id]
  if (!node) return ''

  const href = node.type !== 'link' ? nodeHref(node, ctx) : null
  if (href) {
    const pad = '  '.repeat(indent)
    const inner = serializeElement(doc, node, indent + 1, sheet, ctx)
    return `${pad}<a href="${escapeAttr(href)}" style="display: contents; color: inherit; text-decoration: none">\n${inner}\n${pad}</a>`
  }

  return serializeElement(doc, node, indent, sheet, ctx)
}

function serializeElement(
  doc: EditorDocument,
  node: EditorDocument['nodes'][string],
  indent: number,
  sheet: StyleSheet,
  ctx?: RenderContext,
): string {
  const view = describeNode(node, ctx)
  const pad = '  '.repeat(indent)
  const className = sheet.classFor(view.style, view.hoverStyle)
  const classAttr = className ? ` class="${className}"` : ''
  const attrs = attrString(view.attrs)

  if (view.selfClosing) {
    return `${pad}<${view.tag}${attrs}${classAttr} />`
  }

  if (node.children.length === 0 && view.text !== undefined) {
    const inner = view.html != null ? view.html : escapeHtml(view.text)
    return `${pad}<${view.tag}${attrs}${classAttr}>${inner}</${view.tag}>`
  }

  const inner = node.children
    .map((childId) => serializeNode(doc, childId, indent + 1, sheet, ctx))
    .join('\n')
  const body = inner ? `\n${inner}\n${pad}` : ''
  return `${pad}<${view.tag}${attrs}${classAttr}>${body}</${view.tag}>`
}

function renderDoc(
  doc: EditorDocument,
  indent: number,
  ctx?: RenderContext,
): { body: string; sheet: StyleSheet } {
  const sheet = new StyleSheet()
  const body = serializeNode(doc, doc.root, indent, sheet, ctx)
  return { body, sheet }
}

export function toHtml(doc: EditorDocument, ctx?: RenderContext): string {
  const { body, sheet } = renderDoc(doc, 0, ctx)
  const css = sheet.toCss('')
  return css ? `<style>\n${css}\n</style>\n${body}` : body
}

export function toHtmlDocument(doc: EditorDocument, ctx?: RenderContext): string {
  const { body, sheet } = renderDoc(doc, 0, ctx)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Exported page</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
${sheet.toCss('  ')}
</style>
</head>
<body>
${body}
</body>
</html>
`
}

function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'page'
  )
}

export function buildSite(project: Project): { name: string; content: string }[] {
  const used = new Set<string>()
  const fileFor = new Map<string, string>()

  for (const page of project.pages) {
    const base = slug(page.name)
    let file = `${base}.html`
    let i = 2
    while (used.has(file)) {
      file = `${base}-${i}.html`
      i += 1
    }
    used.add(file)
    fileFor.set(page.id, file)
  }

  const ctx: RenderContext = {
    resolveLink: (id) => fileFor.get(id) ?? '#',
  }

  return project.pages.map((page) => ({
    name: fileFor.get(page.id)!,
    content: toHtmlDocument(page.doc, ctx),
  }))
}
