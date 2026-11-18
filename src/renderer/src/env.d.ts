/// <reference types="vite/client" />

import type { MiliBridge } from '@shared/types'

declare global {
  interface Window {
    mili: MiliBridge
  }
}

export {}
