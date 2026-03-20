import type { OverCMSModule } from '@overcms/module-kit'

// ─── Global module registry ───────────────────────────────────────────────────

const registry = new Map<string, OverCMSModule>()

export function registerModule(mod: OverCMSModule): void {
  if (registry.has(mod.id)) {
    console.warn(`[modules] Duplicate module id: "${mod.id}" — skipping`)
    return
  }
  registry.set(mod.id, mod)
  console.log(`[modules] Registered: ${mod.name} v${mod.version}`)
}

export function getRegistry(): ReadonlyMap<string, OverCMSModule> {
  return registry
}
