import { canHaveChildren, findParentId } from '../model/document'
import { useEditorStore } from '../store'

export function Components() {
  const components = useEditorStore((s) => s.project.components)
  const editingComponentId = useEditorStore((s) => s.editingComponentId)
  const editComponent = useEditorStore((s) => s.editComponent)
  const insertInstance = useEditorStore((s) => s.insertInstance)
  const doc = useEditorStore((s) => s.doc)
  const selectedId = useEditorStore((s) => s.selectedId)

  const list = Object.values(components)

  const resolveTarget = (): string => {
    if (!selectedId) return doc.root
    const selected = doc.nodes[selectedId]
    if (selected && canHaveChildren(selected.type)) return selectedId
    const parentId = findParentId(doc, selectedId)
    if (parentId && canHaveChildren(doc.nodes[parentId].type)) return parentId
    return doc.root
  }

  return (
    <div className="we-components">
      <div className="we-panel-title">Components</div>
      {list.length === 0 && (
        <div className="we-palette-hint">
          Select a block and click “Make component” to create one.
        </div>
      )}
      {list.map((comp) => (
        <div
          key={comp.id}
          className={
            comp.id === editingComponentId ? 'we-component editing' : 'we-component'
          }
        >
          <span
            className="we-component-name"
            onClick={() => editComponent(comp.id)}
            title="Edit component"
          >
            ↻ {comp.name}
          </span>
          <button
            className="we-component-add"
            title="Insert instance"
            onClick={() => insertInstance(comp.id, resolveTarget())}
          >
            ＋
          </button>
        </div>
      ))}
    </div>
  )
}
