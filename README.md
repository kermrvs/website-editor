# web-editor

An embeddable **visual + code** website builder, shipped as a React component
you install from npm. Build multi-page sites by dragging blocks, style them,
preview, and export clean static HTML.

```bash
npm install web-editor
```

## Quick start

```tsx
import { WebEditor, createEmptyProject } from 'web-editor'
import 'web-editor/styles.css'
import { useState } from 'react'

export function App() {
  const [project, setProject] = useState(createEmptyProject())
  return <WebEditor value={project} onChange={setProject} />
}
```

## Configuring icons

The library ships with **no icons** by design — you bring your own icon library
and register the ones you need. Works with any React icon set (lucide-react,
react-icons, heroicons) or your own SVG components.

```tsx
import { WebEditor, createEmptyProject } from 'web-editor'
import 'web-editor/styles.css'
import { useState } from 'react'
import { Star, Heart, Menu, Mail } from 'lucide-react'

const icons = {
  star: Star,
  heart: Heart,
  menu: Menu,
  mail: Mail,
}

export function App() {
  const [project, setProject] = useState(createEmptyProject())
  return (
    <WebEditor value={project} onChange={setProject} config={{ icons }} />
  )
}
```

- The **key** (`star`) is the icon's name shown in the picker and saved in the document.
- The **value** is the icon component.
- Only the icons you import end up in your bundle (tree-shaking).
- Adding an icon is one line in the `icons` object.

Custom SVG components work too:

```tsx
const Logo = () => <svg viewBox="0 0 24 24">{/* ... */}</svg>
const icons = { logo: Logo }
```

## Exporting

Export is available from the toolbar (**Export HTML** for the current page,
**Export site** for the whole project as a `.zip`), or programmatically:

```ts
import { toHtmlDocument, buildSite } from 'web-editor'

const html = toHtmlDocument(project.pages[0].doc)   // one page
const files = buildSite(project)                     // [{ name, content }]
```

Icons are rendered to inline `<svg>` in the exported HTML, so the output is
fully self-contained.

## Blocks

| Group | Blocks |
| --- | --- |
| Layout | Box, Form, Divider, Spacer |
| Text | Heading, Text, Button, Link |
| Media | Image, Icon, Video, Embed |
| Forms | Input, Textarea, Select, Checkbox, Radio |

## Features

- Drag-and-drop on the canvas and in the layers tree
- Multi-page projects with linking between pages
- Inline rich-text editing (bold / italic / underline / color)
- Per-corner radius, per-side padding/margin, full border & shadow controls
- Hover states, background images with overlay
- Preview mode and clean class-based HTML export
- Undo / redo (Ctrl+Z / Ctrl+Y)

## Develop

```bash
npm install
npm run dev      # demo app at http://localhost:5173
npm run build    # builds the library into dist/
```

The demo (`src/demo/main.tsx`) wires up a few lucide-react icons and acts as a
sample host app.

## Architecture

| Part | File | Role |
| --- | --- | --- |
| Document model | `src/model/types.ts`, `document.ts`, `project.ts` | The JSON tree, source of truth |
| Rendering | `src/model/render.ts` | Node → tag/style, shared by canvas, preview, export |
| State | `src/store.ts` | Zustand store: edits, drag, history |
| Config | `src/config.tsx` | Consumer config (icons), via React context |
| Components | `src/components/` | Canvas, palette, inspector, layers, preview |
