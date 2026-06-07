import type { EditorDocument } from './types'
import { createEmptyDocument } from './document'

export interface Page {
  id: string
  name: string
  doc: EditorDocument
}

export interface ComponentDef {
  id: string
  name: string
  doc: EditorDocument
}

export interface Project {
  pages: Page[]
  currentPageId: string
  components: Record<string, ComponentDef>
}

let pageCounter = 0

export function makePageId(): string {
  pageCounter += 1
  return `page_${Date.now().toString(36)}_${pageCounter}`
}

export function makeComponentId(): string {
  pageCounter += 1
  return `cmp_${Date.now().toString(36)}_${pageCounter}`
}

export function createPage(name: string): Page {
  return { id: makePageId(), name, doc: createEmptyDocument() }
}

export function createEmptyProject(): Project {
  const page = createPage('Home')
  return { pages: [page], currentPageId: page.id, components: {} }
}

export function currentDoc(project: Project): EditorDocument {
  const page = project.pages.find((p) => p.id === project.currentPageId)
  return page ? page.doc : project.pages[0].doc
}
