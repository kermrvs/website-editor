import { useEditorStore } from '../store'

/**
 * Right sidebar. Shows editable properties for the selected node.
 * For now it edits the common text/number props; this grows per node type.
 */
export function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedId)
  const node = useEditorStore((s) => (selectedId ? s.doc.nodes[selectedId] : null))
  const updateProps = useEditorStore((s) => s.updateProps)
  const removeNode = useEditorStore((s) => s.removeNode)

  if (!node) {
    return (
      <div className="we-inspector">
        <div className="we-panel-title">Inspector</div>
        <div className="we-palette-hint">Select a block to edit it.</div>
      </div>
    )
  }

  const p = node.props

  return (
    <div className="we-inspector">
      <div className="we-panel-title">{node.type}</div>

      {'text' in p && (
        <label className="we-field">
          <span>Text</span>
          <input
            value={(p.text as string) ?? ''}
            onChange={(e) => updateProps(node.id, { text: e.target.value })}
          />
        </label>
      )}

      {node.type === 'heading' && (
        <label className="we-field">
          <span>Level</span>
          <select
            value={(p.level as number) ?? 2}
            onChange={(e) => updateProps(node.id, { level: Number(e.target.value) })}
          >
            {[1, 2, 3, 4].map((l) => (
              <option key={l} value={l}>
                H{l}
              </option>
            ))}
          </select>
        </label>
      )}

      {node.type === 'box' && (
        <>
          <label className="we-field">
            <span>Padding</span>
            <input
              type="number"
              value={(p.padding as number) ?? 0}
              onChange={(e) => updateProps(node.id, { padding: Number(e.target.value) })}
            />
          </label>
          <label className="we-field">
            <span>Background</span>
            <input
              type="color"
              value={(p.background as string) ?? '#ffffff'}
              onChange={(e) => updateProps(node.id, { background: e.target.value })}
            />
          </label>
        </>
      )}

      {node.type === 'image' && (
        <label className="we-field">
          <span>Source URL</span>
          <input
            value={(p.src as string) ?? ''}
            onChange={(e) => updateProps(node.id, { src: e.target.value })}
          />
        </label>
      )}

      <button className="we-delete" onClick={() => removeNode(node.id)}>
        Delete block
      </button>
    </div>
  )
}
