import type { ReactNode } from 'react'
import { useEditorStore } from '../store'
import { propsAt } from '../model/render'
import { useConfig } from '../config'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="we-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

interface Side {
  key: string
  short: string
}

function BoxSides({
  label,
  baseKey,
  sides,
  p,
  set,
}: {
  label: string
  baseKey: string
  sides: Side[]
  p: Record<string, unknown>
  set: (patch: Record<string, unknown>) => void
}) {
  const expanded = sides.some((s) => p[s.key] !== undefined)
  const val = (v: unknown) => (v as number) ?? 0

  const toggle = () => {
    if (expanded) {
      const patch: Record<string, unknown> = { [baseKey]: val(p[sides[0].key]) }
      for (const s of sides) patch[s.key] = undefined
      set(patch)
    } else {
      const base = val(p[baseKey])
      const patch: Record<string, unknown> = {}
      for (const s of sides) patch[s.key] = base
      set(patch)
    }
  }

  return (
    <div className="we-field">
      <span className="we-field-head">
        {label}
        <button className="we-mini" onClick={toggle}>
          {expanded ? 'Single' : 'Per side'}
        </button>
      </span>
      {expanded ? (
        <div className="we-corners">
          {sides.map((s) => (
            <label key={s.key} className="we-corner">
              <span>{s.short}</span>
              <input
                type="number"
                value={val(p[s.key])}
                onChange={(e) => set({ [s.key]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
      ) : (
        <input
          type="number"
          value={val(p[baseKey])}
          onChange={(e) => set({ [baseKey]: Number(e.target.value) })}
        />
      )}
    </div>
  )
}

const PADDING_SIDES: Side[] = [
  { key: 'paddingTop', short: 'T' },
  { key: 'paddingRight', short: 'R' },
  { key: 'paddingBottom', short: 'B' },
  { key: 'paddingLeft', short: 'L' },
]

const MARGIN_SIDES: Side[] = [
  { key: 'marginTop', short: 'T' },
  { key: 'marginRight', short: 'R' },
  { key: 'marginBottom', short: 'B' },
  { key: 'marginLeft', short: 'L' },
]

function ShadowControls({
  p,
  set,
}: {
  p: Record<string, unknown>
  set: (patch: Record<string, unknown>) => void
}) {
  const num = (v: unknown, d: number) => (v as number) ?? d
  const str = (v: unknown, d: string) => (v as string) ?? d

  return (
    <>
      <label className="we-check">
        <input
          type="checkbox"
          checked={!!p.shadow}
          onChange={(e) => set({ shadow: e.target.checked || undefined })}
        />
        <span>Shadow</span>
      </label>
      {p.shadow ? (
        <>
          <div className="we-corners">
            <label className="we-corner">
              <span>X</span>
              <input
                type="number"
                value={num(p.shadowX, 0)}
                onChange={(e) => set({ shadowX: Number(e.target.value) })}
              />
            </label>
            <label className="we-corner">
              <span>Y</span>
              <input
                type="number"
                value={num(p.shadowY, 4)}
                onChange={(e) => set({ shadowY: Number(e.target.value) })}
              />
            </label>
            <label className="we-corner">
              <span>Blur</span>
              <input
                type="number"
                min={0}
                value={num(p.shadowBlur, 16)}
                onChange={(e) => set({ shadowBlur: Number(e.target.value) })}
              />
            </label>
            <label className="we-corner">
              <span>Spread</span>
              <input
                type="number"
                value={num(p.shadowSpread, 0)}
                onChange={(e) => set({ shadowSpread: Number(e.target.value) })}
              />
            </label>
          </div>
          <Row label="Shadow color">
            <input
              type="color"
              value={str(p.shadowColor, '#000000')}
              onChange={(e) => set({ shadowColor: e.target.value })}
            />
          </Row>
          <Row label="Shadow opacity">
            <input
              type="number"
              min={0}
              max={1}
              step="0.05"
              value={num(p.shadowOpacity, 0.1)}
              onChange={(e) => set({ shadowOpacity: Number(e.target.value) })}
            />
          </Row>
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!p.shadowInset}
              onChange={(e) => set({ shadowInset: e.target.checked || undefined })}
            />
            <span>Inset</span>
          </label>
        </>
      ) : null}
    </>
  )
}

export function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedId)
  const node = useEditorStore((s) => (selectedId ? s.doc.nodes[selectedId] : null))
  const pages = useEditorStore((s) => s.project.pages)
  const updateProps = useEditorStore((s) => s.updateProps)
  const removeNode = useEditorStore((s) => s.removeNode)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const breakpoint = useEditorStore((s) => s.breakpoint)
  const config = useConfig()

  if (!node) {
    return (
      <div className="we-inspector">
        <div className="we-panel-title">Inspector</div>
        <div className="we-palette-hint">Select a block to edit it.</div>
      </div>
    )
  }

  const p = propsAt(node.props, breakpoint)
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

  const isContainer = node.type === 'box' || node.type === 'form'
  const isText =
    node.type === 'heading' ||
    node.type === 'text' ||
    node.type === 'button' ||
    node.type === 'link'

  return (
    <div className="we-inspector">
      <div className="we-panel-title">{node.type}</div>
      {breakpoint === 'mobile' && (
        <div className="we-bp-banner">📱 Editing Mobile styles</div>
      )}

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

      {node.type === 'icon' && (
        <>
          <Row label="Icon">
            <select
              value={str(p.icon)}
              onChange={(e) => set({ icon: e.target.value })}
            >
              <option value="">— choose —</option>
              {Object.keys(config.icons ?? {}).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Row>
          {Object.keys(config.icons ?? {}).length === 0 && (
            <div className="we-palette-hint">
              No icons configured. Pass them via config.icons
            </div>
          )}
          <Row label="Size">
            <input
              type="number"
              min={1}
              value={num(p.size, 24)}
              onChange={(e) => set({ size: Number(e.target.value) })}
            />
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

      {node.type === 'button' && (
        <Row label="Button type">
          <select
            value={str(p.buttonType, 'button')}
            onChange={(e) => set({ buttonType: e.target.value })}
          >
            <option value="button">Button</option>
            <option value="submit">Submit</option>
            <option value="reset">Reset</option>
          </select>
        </Row>
      )}

      {node.type === 'form' && (
        <>
          <div className="we-section">Form</div>
          <Row label="Action URL">
            <input
              placeholder="https://formspree.io/f/…"
              value={str(p.action)}
              onChange={(e) => set({ action: e.target.value })}
            />
          </Row>
          <Row label="Method">
            <select
              value={str(p.method, 'post')}
              onChange={(e) => set({ method: e.target.value })}
            >
              <option value="post">POST</option>
              <option value="get">GET</option>
            </select>
          </Row>
        </>
      )}

      {node.type === 'divider' && (
        <>
          <Row label="Line color">
            <input
              type="color"
              value={str(p.lineColor, '#e5e7eb')}
              onChange={(e) => set({ lineColor: e.target.value })}
            />
          </Row>
          <Row label="Thickness">
            <input
              type="number"
              min={1}
              value={num(p.lineThickness, 1)}
              onChange={(e) => set({ lineThickness: Number(e.target.value) })}
            />
          </Row>
        </>
      )}

      {node.type === 'spacer' && (
        <Row label="Height">
          <input
            type="number"
            min={0}
            value={num(p.height, 40)}
            onChange={(e) => set({ height: Number(e.target.value) })}
          />
        </Row>
      )}

      {node.type === 'video' && (
        <Row label="Video URL">
          <input
            placeholder="https://….mp4"
            value={str(p.src)}
            onChange={(e) => set({ src: e.target.value })}
          />
        </Row>
      )}

      {node.type === 'embed' && (
        <>
          <Row label="Embed URL">
            <input
              placeholder="https://… (YouTube, maps)"
              value={str(p.src)}
              onChange={(e) => set({ src: e.target.value })}
            />
          </Row>
          <Row label="Height">
            <input
              type="number"
              min={0}
              value={num(p.height, 400)}
              onChange={(e) => set({ height: Number(e.target.value) })}
            />
          </Row>
        </>
      )}

      {(node.type === 'select' || node.type === 'radio') && (
        <>
          {node.type === 'select' && (
            <Row label="Label">
              <input
                placeholder="(optional)"
                value={str(p.label)}
                onChange={(e) => set({ label: e.target.value || undefined })}
              />
            </Row>
          )}
          <Row label="Name (for forms)">
            <input
              placeholder="e.g. choice"
              value={str(p.name)}
              onChange={(e) => set({ name: e.target.value || undefined })}
            />
          </Row>
          <Row label="Options (one per line)">
            <textarea
              rows={4}
              value={((p.options as string[]) ?? []).join('\n')}
              onChange={(e) => set({ options: e.target.value.split('\n') })}
            />
          </Row>
          {node.type === 'select' && (
            <Row label="Placeholder">
              <input
                value={str(p.placeholder)}
                onChange={(e) => set({ placeholder: e.target.value })}
              />
            </Row>
          )}
        </>
      )}

      {node.type === 'checkbox' && (
        <>
          <Row label="Label">
            <input
              value={str(p.label)}
              onChange={(e) => set({ label: e.target.value })}
            />
          </Row>
          <Row label="Name (for forms)">
            <input
              placeholder="e.g. agree"
              value={str(p.name)}
              onChange={(e) => set({ name: e.target.value || undefined })}
            />
          </Row>
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!p.checked}
              onChange={(e) => set({ checked: e.target.checked || undefined })}
            />
            <span>Checked by default</span>
          </label>
        </>
      )}

      {(node.type === 'select' ||
        node.type === 'checkbox' ||
        node.type === 'radio') && (
        <>
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!p.required}
              onChange={(e) => set({ required: e.target.checked || undefined })}
            />
            <span>Required</span>
          </label>
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!p.disabled}
              onChange={(e) => set({ disabled: e.target.checked || undefined })}
            />
            <span>Disabled</span>
          </label>
        </>
      )}

      {(node.type === 'input' || node.type === 'textarea') && (
        <>
          <Row label="Label">
            <input
              placeholder="(optional)"
              value={str(p.label)}
              onChange={(e) => set({ label: e.target.value || undefined })}
            />
          </Row>
          <Row label="Placeholder">
            <input
              value={str(p.placeholder)}
              onChange={(e) => set({ placeholder: e.target.value })}
            />
          </Row>
          <Row label="Name (for forms)">
            <input
              placeholder="e.g. email"
              value={str(p.name)}
              onChange={(e) => set({ name: e.target.value || undefined })}
            />
          </Row>
        </>
      )}

      {node.type === 'input' && (
        <>
          <Row label="Input type">
            <select
              value={str(p.inputType, 'text')}
              onChange={(e) => set({ inputType: e.target.value })}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="number">Number</option>
              <option value="tel">Phone</option>
              <option value="url">URL</option>
            </select>
          </Row>
          <Row label="Min">
            <input
              type="number"
              placeholder="none"
              value={num(p.min, '')}
              onChange={(e) =>
                set({ min: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </Row>
          <Row label="Max">
            <input
              type="number"
              placeholder="none"
              value={num(p.max, '')}
              onChange={(e) =>
                set({ max: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </Row>
        </>
      )}

      {node.type === 'textarea' && (
        <>
          <Row label="Rows">
            <input
              type="number"
              min={1}
              value={num(p.rows, 4)}
              onChange={(e) => set({ rows: Number(e.target.value) })}
            />
          </Row>
          <Row label="Resize">
            <select
              value={str(p.resize, 'vertical')}
              onChange={(e) => set({ resize: e.target.value })}
            >
              <option value="vertical">Vertical</option>
              <option value="none">None</option>
              <option value="horizontal">Horizontal</option>
              <option value="both">Both</option>
            </select>
          </Row>
        </>
      )}

      {(node.type === 'input' || node.type === 'textarea') && (
        <>
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!p.required}
              onChange={(e) => set({ required: e.target.checked || undefined })}
            />
            <span>Required</span>
          </label>
          <label className="we-check">
            <input
              type="checkbox"
              checked={!!p.disabled}
              onChange={(e) => set({ disabled: e.target.checked || undefined })}
            />
            <span>Disabled</span>
          </label>
        </>
      )}

      {node.type !== 'root' && (
        <>
          <div className="we-section">Link</div>
          <Row label="To page">
            <select
              value={str(p.linkTo)}
              onChange={(e) => set({ linkTo: e.target.value || undefined })}
            >
              <option value="">— none —</option>
              {pages.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name}
                </option>
              ))}
            </select>
          </Row>
          <Row label="External URL">
            <input
              placeholder="https://…"
              value={str(p.href)}
              onChange={(e) => set({ href: e.target.value || undefined })}
            />
          </Row>
        </>
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

      <BoxSides label="Padding" baseKey="padding" sides={PADDING_SIDES} p={p} set={set} />
      <BoxSides label="Margin" baseKey="margin" sides={MARGIN_SIDES} p={p} set={set} />
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

      <ShadowControls p={p} set={set} />
      <label className="we-check">
        <input
          type="checkbox"
          checked={!!p.border}
          onChange={(e) => set({ border: e.target.checked || undefined })}
        />
        <span>Border</span>
      </label>
      {p.border ? (
        <>
          <Row label="Border width">
            <input
              type="number"
              min={0}
              value={num(p.borderWidth, 1)}
              onChange={(e) => set({ borderWidth: Number(e.target.value) })}
            />
          </Row>
          <Row label="Border style">
            <select
              value={str(p.borderStyle, 'solid')}
              onChange={(e) => set({ borderStyle: e.target.value })}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </Row>
          <Row label="Border color">
            <input
              type="color"
              value={str(p.borderColor, '#e5e7eb')}
              onChange={(e) => set({ borderColor: e.target.value })}
            />
          </Row>
        </>
      ) : null}

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
          <ShadowControls p={hover} set={setHover} />
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
