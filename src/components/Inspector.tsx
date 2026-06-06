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
  const pages = useEditorStore((s) => s.project.pages)
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

  const hover = (p.hover as Record<string, unknown>) ?? {}
  const setHover = (patch: Record<string, unknown>) =>
    set({ hover: { ...hover, ...patch } })
  const hoverHas = (key: string) => hover[key] !== undefined

  const cornerKeys = ['radiusTL', 'radiusTR', 'radiusBR', 'radiusBL']
  const radiusExpanded = cornerKeys.some((k) => p[k] !== undefined)
  const toggleCorners = () => {
    if (radiusExpanded) {
      set({
        radius: num(p.radiusTL, 0),
        radiusTL: undefined,
        radiusTR: undefined,
        radiusBR: undefined,
        radiusBL: undefined,
      })
    } else {
      const base = num(p.radius, 0)
      set({ radiusTL: base, radiusTR: base, radiusBR: base, radiusBL: base })
    }
  }

  const isContainer = node.type === 'box'
  const isText =
    node.type === 'heading' ||
    node.type === 'text' ||
    node.type === 'button' ||
    node.type === 'link'

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

      {node.type === 'link' && (
        <Row label="Link to page">
          <select
            value={str(p.linkTo)}
            onChange={(e) => set({ linkTo: e.target.value })}
          >
            <option value="">— none —</option>
            {pages.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.name}
              </option>
            ))}
          </select>
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
        {p.background === undefined ? (
          <button
            className="we-transparent"
            onClick={() => set({ background: '#ffffff' })}
          >
            <span className="we-checker" />
            Transparent — add color
          </button>
        ) : (
          <div className="we-color-row">
            <input
              type="color"
              value={str(p.background, '#ffffff')}
              onChange={(e) => set({ background: e.target.value })}
            />
            <button
              className="we-clear"
              title="Make transparent"
              onClick={() => set({ background: undefined })}
            >
              ×
            </button>
          </div>
        )}
      </Row>

      {isContainer && (
        <>
          <Row label="Background image">
            <input
              placeholder="https://…"
              value={str(p.bgImage)}
              onChange={(e) =>
                set({ bgImage: e.target.value || undefined })
              }
            />
          </Row>
          {p.bgImage ? (
            <>
              <Row label="Image fit">
                <select
                  value={str(p.bgSize, 'cover')}
                  onChange={(e) => set({ bgSize: e.target.value })}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                </select>
              </Row>
              <Row label="Image position">
                <select
                  value={str(p.bgPosition, 'center')}
                  onChange={(e) => set({ bgPosition: e.target.value })}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </Row>
              <Row label="Overlay (0–0.8)">
                <input
                  type="number"
                  min={0}
                  max={0.8}
                  step="0.1"
                  value={num(p.bgOverlay, 0)}
                  onChange={(e) => set({ bgOverlay: Number(e.target.value) })}
                />
              </Row>
            </>
          ) : null}
        </>
      )}

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
      <div className="we-field">
        <span className="we-field-head">
          Radius
          <button className="we-mini" onClick={toggleCorners}>
            {radiusExpanded ? 'Single' : 'Per corner'}
          </button>
        </span>
        {radiusExpanded ? (
          <div className="we-corners">
            <label className="we-corner">
              <span>TL</span>
              <input
                type="number"
                min={0}
                value={num(p.radiusTL, 0)}
                onChange={(e) => set({ radiusTL: Number(e.target.value) })}
              />
            </label>
            <label className="we-corner">
              <span>TR</span>
              <input
                type="number"
                min={0}
                value={num(p.radiusTR, 0)}
                onChange={(e) => set({ radiusTR: Number(e.target.value) })}
              />
            </label>
            <label className="we-corner">
              <span>BL</span>
              <input
                type="number"
                min={0}
                value={num(p.radiusBL, 0)}
                onChange={(e) => set({ radiusBL: Number(e.target.value) })}
              />
            </label>
            <label className="we-corner">
              <span>BR</span>
              <input
                type="number"
                min={0}
                value={num(p.radiusBR, 0)}
                onChange={(e) => set({ radiusBR: Number(e.target.value) })}
              />
            </label>
          </div>
        ) : (
          <input
            type="number"
            min={0}
            value={num(p.radius, 0)}
            onChange={(e) => set({ radius: Number(e.target.value) })}
          />
        )}
      </div>
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

      {node.type !== 'root' && (
        <>
          <div className="we-section">Hover</div>
          <label className="we-check">
            <input
              type="checkbox"
              checked={hoverHas('background')}
              onChange={(e) =>
                setHover({ background: e.target.checked ? '#4f46e5' : undefined })
              }
            />
            <span>Background</span>
          </label>
          {hoverHas('background') && (
            <Row label="Hover background">
              <input
                type="color"
                value={str(hover.background, '#4f46e5')}
                onChange={(e) => setHover({ background: e.target.value })}
              />
            </Row>
          )}
          <label className="we-check">
            <input
              type="checkbox"
              checked={hoverHas('color')}
              onChange={(e) =>
                setHover({ color: e.target.checked ? '#ffffff' : undefined })
              }
            />
            <span>Text color</span>
          </label>
          {hoverHas('color') && (
            <Row label="Hover text color">
              <input
                type="color"
                value={str(hover.color, '#ffffff')}
                onChange={(e) => setHover({ color: e.target.value })}
              />
            </Row>
          )}
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!hover.shadow}
              onChange={(e) =>
                setHover({ shadow: e.target.checked ? true : undefined })
              }
            />
            <span>Shadow</span>
          </label>
          <Row label="Scale">
            <input
              type="number"
              step="0.01"
              placeholder="none"
              value={num(hover.scale, '')}
              onChange={(e) =>
                setHover({
                  scale: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </Row>
        </>
      )}

      <button className="we-secondary" onClick={() => duplicateNode(node.id)}>
        Duplicate
      </button>
      <button className="we-delete" onClick={() => removeNode(node.id)}>
        Delete block
      </button>
    </div>
  )
}
