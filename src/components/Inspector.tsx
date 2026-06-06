import type { ReactNode } from 'react'
import { useEditorStore } from '../store'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="we-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedId)
  const node = useEditorStore((s) => (selectedId ? s.doc.nodes[selectedId] : null))
  const updateProps = useEditorStore((s) => s.updateProps)
  const removeNode = useEditorStore((s) => s.removeNode)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)

  if (!node) {
    return (
      <div className="we-inspector">
        <div className="we-panel-title">Inspector</div>
        <div className="we-palette-hint">Select a block to edit it.</div>
      </div>
    )
  }

  const p = node.props
  const set = (patch: Record<string, unknown>) => updateProps(node.id, patch)
  const num = (v: unknown, d: number | '' = 0) => (v as number) ?? d
  const str = (v: unknown, d = '') => (v as string) ?? d

  const isContainer = node.type === 'box'
  const isText =
    node.type === 'heading' || node.type === 'text' || node.type === 'button'

  return (
    <div className="we-inspector">
      <div className="we-panel-title">{node.type}</div>

      {'text' in p && (
        <Row label="Text">
          <input
            value={str(p.text)}
            onChange={(e) => set({ text: e.target.value })}
          />
        </Row>
      )}

      {node.type === 'heading' && (
        <Row label="Level">
          <select
            value={num(p.level, 2)}
            onChange={(e) => set({ level: Number(e.target.value) })}
          >
            {[1, 2, 3, 4].map((l) => (
              <option key={l} value={l}>
                H{l}
              </option>
            ))}
          </select>
        </Row>
      )}

      {node.type === 'image' && (
        <Row label="Source URL">
          <input value={str(p.src)} onChange={(e) => set({ src: e.target.value })} />
        </Row>
      )}

      {isContainer && (
        <>
          <div className="we-section">Layout</div>
          <Row label="Direction">
            <select
              value={str(p.layout, 'column')}
              onChange={(e) => set({ layout: e.target.value })}
            >
              <option value="column">Column</option>
              <option value="row">Row</option>
              <option value="grid">Grid</option>
            </select>
          </Row>
          {p.layout === 'grid' && (
            <Row label="Columns">
              <input
                type="number"
                min={1}
                value={num(p.columns, 2)}
                onChange={(e) => set({ columns: Number(e.target.value) })}
              />
            </Row>
          )}
          <Row label="Gap">
            <input
              type="number"
              min={0}
              value={num(p.gap, 0)}
              onChange={(e) => set({ gap: Number(e.target.value) })}
            />
          </Row>
          <Row label="Align">
            <select
              value={str(p.align, 'stretch')}
              onChange={(e) => set({ align: e.target.value })}
            >
              <option value="stretch">Stretch</option>
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
            </select>
          </Row>
          <Row label="Justify">
            <select
              value={str(p.justify, 'start')}
              onChange={(e) => set({ justify: e.target.value })}
            >
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
              <option value="between">Space between</option>
            </select>
          </Row>
        </>
      )}

      <div className="we-section">Style</div>

      {isText && (
        <>
          <Row label="Font size">
            <input
              type="number"
              placeholder="auto"
              value={num(p.fontSize, '')}
              onChange={(e) =>
                set({
                  fontSize: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </Row>
          <Row label="Font weight">
            <select
              value={str(p.fontWeight)}
              onChange={(e) =>
                set({ fontWeight: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            >
              <option value="">Default</option>
              <option value="400">Regular</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </Row>
          <Row label="Text align">
            <select
              value={str(p.textAlign, 'left')}
              onChange={(e) => set({ textAlign: e.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Row>
          <Row label="Color">
            <input
              type="color"
              value={str(p.color, '#111827')}
              onChange={(e) => set({ color: e.target.value })}
            />
          </Row>
        </>
      )}

      <Row label="Background">
        <input
          type="color"
          value={str(p.background, '#ffffff')}
          onChange={(e) => set({ background: e.target.value })}
        />
      </Row>
      <Row label="Padding">
        <input
          type="number"
          min={0}
          value={num(p.padding, 0)}
          onChange={(e) => set({ padding: Number(e.target.value) })}
        />
      </Row>
      <Row label="Margin">
        <input
          type="number"
          value={num(p.margin, 0)}
          onChange={(e) => set({ margin: Number(e.target.value) })}
        />
      </Row>
      <Row label="Radius">
        <input
          type="number"
          min={0}
          value={num(p.radius, 0)}
          onChange={(e) => set({ radius: Number(e.target.value) })}
        />
      </Row>
      <Row label="Max width">
        <input
          type="number"
          min={0}
          placeholder="auto"
          value={num(p.maxWidth, '')}
          onChange={(e) =>
            set({ maxWidth: e.target.value === '' ? undefined : Number(e.target.value) })
          }
        />
      </Row>

      <label className="we-check">
        <input
          type="checkbox"
          checked={!!p.shadow}
          onChange={(e) => set({ shadow: e.target.checked })}
        />
        <span>Shadow</span>
      </label>
      <label className="we-check">
        <input
          type="checkbox"
          checked={!!p.border}
          onChange={(e) => set({ border: e.target.checked })}
        />
        <span>Border</span>
      </label>

      <button className="we-secondary" onClick={() => duplicateNode(node.id)}>
        Duplicate
      </button>
      <button className="we-delete" onClick={() => removeNode(node.id)}>
        Delete block
      </button>
    </div>
  )
}
