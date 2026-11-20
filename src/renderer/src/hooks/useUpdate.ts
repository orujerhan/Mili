import { useEffect, useState } from 'react'
import type { UpdateState } from '@shared/types'

const EMPTY: UpdateState = { status: 'idle', version: '', percent: 0, reason: '', error: '' }
const RELEASES_URL = 'https://github.com/orujerhan/Mili/releases/latest'

export function useUpdate() {
  const [state, setState] = useState<UpdateState>(EMPTY)

  useEffect(() => {
    let alive = true
    void window.mili.getUpdateState().then((next) => {
      if (alive) setState(next)
    })
    const off = window.mili.onUpdate((next) => setState(next))
    return () => {
      alive = false
      off()
    }
  }, [])

  return {
    update: state,
    check: () => void window.mili.checkForUpdates(),
    install: () => void window.mili.installUpdate(),
    openReleases: () => void window.mili.openExternal(RELEASES_URL)
  }
}
