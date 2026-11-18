import { cpus, freemem, totalmem } from 'node:os'
import type { SystemStats } from '@shared/types'

interface CpuSample {
  idle: number
  total: number
}

function sampleCpu(): CpuSample {
  let idle = 0
  let total = 0
  for (const cpu of cpus()) {
    for (const value of Object.values(cpu.times)) total += value
    idle += cpu.times.idle
  }
  return { idle, total }
}

function round(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)))
}

/** Lightweight CPU / RAM sampler built on node:os — no native modules. */
export class StatsMonitor {
  private timer: NodeJS.Timeout | null = null
  private previous = sampleCpu()

  constructor(private readonly emit: (stats: SystemStats) => void) {}

  start(intervalMs = 2000): void {
    if (this.timer) return
    this.previous = sampleCpu()
    this.timer = setInterval(() => this.tick(), intervalMs)
    this.tick()
  }

  private tick(): void {
    const current = sampleCpu()
    const idleDelta = current.idle - this.previous.idle
    const totalDelta = current.total - this.previous.total
    this.previous = current

    const cpu = totalDelta > 0 ? round(100 - (idleDelta / totalDelta) * 100) : 0
    const totalGb = totalmem() / 1024 ** 3
    const freeGb = freemem() / 1024 ** 3
    const usedGb = Math.max(0, totalGb - freeGb)

    this.emit({
      cpu,
      ram: round((usedGb / totalGb) * 100),
      ramUsedGb: Math.round(usedGb * 10) / 10,
      ramTotalGb: Math.round(totalGb * 10) / 10,
      friendly: `${usedGb.toFixed(1)} / ${totalGb.toFixed(1)} GB`
    })
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
