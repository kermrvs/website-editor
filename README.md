# web-editor

An embeddable **visual + code** web editor, shipped as a React component you
install from npm.

```bash
npm install web-editor
```

```tsx
import { WebEditor, createEmptyDocument } from 'web-editor'
import 'web-editor/styles.css'
import { useState } from 'react'

export function App() {
  const [doc, setDoc] = useState(createEmptyDocument())
  return <WebEditor value={doc} onChange={setDoc} />
}
```

## How it works

The editor is built around a single **document model** — a tree of nodes
(`src/types.ts`). Both the visual canvas and the code view read from and write
to that same tree, so the two stay in sync.

| Part | File | Role |
| --- | --- | --- |
| Document model | `src/types.ts`, `src/document.ts` | The JSON tree, the source of truth |
| State | `src/store.ts` | Zustand store: select / add / update / remove |
| Canvas | `src/NodeRenderer.tsx` | Renders the tree as real elements |
| Palette | `src/Palette.tsx` | Add blocks |
| Inspector | `src/Inspector.tsx` | Edit the selected block's props |
| Shell | `src/WebEditor.tsx` | The public component |

## Develop

```bash
npm install
npm run dev      # runs the demo app at http://localhost:5173
npm run build    # builds the library into dist/
```

## Roadmap

- [x] Library scaffold + dev demo
- [x] Document model + visual canvas + inspector
- [ ] Drag-and-drop on the canvas (dnd-kit)
- [ ] Real code editor (CodeMirror 6) editing the same tree
- [ ] Publish to npm
```
