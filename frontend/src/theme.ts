export type UISettings = {
  fontScale: number
  buttonHeight: number
  buttonRadius: number
  cardRadius: number
  inputRadius: number
  chipRadius: number
  cardGap: number
  sidebarWidth: number
  bottomBarHeight: number
  animationMs: number
}

export const DEFAULT_UI: UISettings = {
  fontScale: 1,
  buttonHeight: 64,
  buttonRadius: 16,
  cardRadius: 16,
  inputRadius: 12,
  chipRadius: 20,
  cardGap: 12,
  sidebarWidth: 72,
  bottomBarHeight: 80,
  animationMs: 160,
}

const STORAGE_KEY = 'brewpos_ui'

export function readUISettings(): UISettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<UISettings>
    return { ...DEFAULT_UI, ...Object.fromEntries(Object.entries(stored).filter(([, value]) => typeof value === 'number')) }
  } catch {
    return DEFAULT_UI
  }
}

export function saveUISettings(settings: UISettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  applyUISettings(settings)
}

export function applyUISettings(settings = readUISettings()) {
  const root = document.documentElement
  root.style.setProperty('--ui-font-scale', String(settings.fontScale))
  root.style.setProperty('--ui-button-height', `${settings.buttonHeight}px`)
  root.style.setProperty('--ui-button-radius', `${settings.buttonRadius}px`)
  root.style.setProperty('--ui-card-radius', `${settings.cardRadius}px`)
  root.style.setProperty('--ui-input-radius', `${settings.inputRadius}px`)
  root.style.setProperty('--ui-chip-radius', `${settings.chipRadius}px`)
  root.style.setProperty('--ui-card-gap', `${settings.cardGap}px`)
  root.style.setProperty('--ui-sidebar-width', `${settings.sidebarWidth}px`)
  root.style.setProperty('--ui-bottombar-height', `${settings.bottomBarHeight}px`)
  root.style.setProperty('--ui-topbar-height', `${settings.bottomBarHeight}px`)
  root.style.setProperty('--ui-animation', `${settings.animationMs}ms`)
}
