import type { CSSProperties } from 'react'
import type { EditorNode } from '../model/types'
import { inputBaseStyle, optionList, styleFromProps } from '../model/render'

interface Props {
  node: EditorNode
  interactive: boolean
}

export function FormControl({ node, interactive }: Props) {
  const p = node.props
  const lock: CSSProperties = interactive ? {} : { pointerEvents: 'none' }
  const name = p.name as string | undefined
  const required = !!p.required
  const disabled = !!p.disabled

  if (node.type === 'select') {
    return (
      <select
        name={name}
        required={required}
        disabled={disabled}
        defaultValue=""
        style={{ ...inputBaseStyle, ...styleFromProps(p), ...lock }}
      >
        {p.placeholder ? (
          <option value="" disabled>
            {p.placeholder as string}
          </option>
        ) : null}
        {optionList(p).map((opt, i) => (
          <option key={i}>{opt}</option>
        ))}
      </select>
    )
  }

  if (node.type === 'checkbox') {
    return (
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 8, ...styleFromProps(p), ...lock }}
      >
        <input
          type="checkbox"
          name={name}
          required={required}
          disabled={disabled}
          defaultChecked={!!p.checked}
        />
        {p.label as string}
      </label>
    )
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 6, ...styleFromProps(p), ...lock }}
    >
      {optionList(p).map((opt, i) => (
        <label key={i}>
          <input type="radio" name={name} value={opt} disabled={disabled} /> {opt}
        </label>
      ))}
    </div>
  )
}
