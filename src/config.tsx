import { createContext, useContext } from 'react'
import type { ComponentType } from 'react'

export interface WebEditorConfig {
  icons?: Record<string, ComponentType>
}

const ConfigContext = createContext<WebEditorConfig>({})

export const ConfigProvider = ConfigContext.Provider

export function useConfig(): WebEditorConfig {
  return useContext(ConfigContext)
}
