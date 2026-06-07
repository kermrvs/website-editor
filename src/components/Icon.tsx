import type { HTMLAttributes } from 'react'
import { useConfig } from '../config'

type Props = { name: string } & HTMLAttributes<HTMLSpanElement> & {
  'data-node-id'?: string
}

export function Icon({ name, ...rest }: Props) {
  const config = useConfig()
  const Component = config.icons?.[name]

  return (
    <span className="we-icon" {...rest}>
      {Component ? <Component /> : <span className="we-icon-empty">?</span>}
    </span>
  )
}
