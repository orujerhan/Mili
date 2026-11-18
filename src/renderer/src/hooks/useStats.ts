import { useEffect, useState } from 'react'
import type { SystemStats } from '@shared/types'

export function useStats(): SystemStats | null {
  const [stats, setStats] = useState<SystemStats | null>(null)

  useEffect(() => window.mili.onStats((next) => setStats(next)), [])

  return stats
}
