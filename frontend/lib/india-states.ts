/** Normalized centroids for India map dots (lon/lat → 0–100 × 0–110). */

export type MomentumSignal = 'rising' | 'stable' | 'falling'

export interface StateHeatCell {
  code: string
  nameHi: string
  intensity: number
  signal: MomentumSignal
}

/** Simplified India silhouette (viewBox 0 0 100 110). */
export const INDIA_OUTLINE =
  'M 24,14 L 38,10 L 52,12 L 64,18 L 72,28 L 76,40 L 78,52 L 76,64 L 70,76 L 62,86 L 54,96 L 46,104 L 38,106 L 30,98 L 24,84 L 20,68 L 18,52 L 20,36 L 22,24 Z'

const CENTROIDS: Record<string, { lat: number; lon: number }> = {
  AN: { lat: 11.67, lon: 92.74 },
  AP: { lat: 15.91, lon: 79.74 },
  AR: { lat: 28.22, lon: 94.73 },
  AS: { lat: 26.14, lon: 91.79 },
  BR: { lat: 25.09, lon: 85.31 },
  CH: { lat: 30.73, lon: 76.78 },
  CG: { lat: 21.28, lon: 81.87 },
  DL: { lat: 28.61, lon: 77.21 },
  GA: { lat: 15.3, lon: 74.12 },
  GJ: { lat: 22.26, lon: 71.19 },
  HR: { lat: 29.06, lon: 76.08 },
  HP: { lat: 31.1, lon: 77.17 },
  JH: { lat: 23.61, lon: 85.28 },
  JK: { lat: 33.78, lon: 76.58 },
  KA: { lat: 15.32, lon: 75.71 },
  KL: { lat: 10.85, lon: 76.27 },
  LA: { lat: 34.15, lon: 77.58 },
  LD: { lat: 10.57, lon: 72.64 },
  MP: { lat: 22.97, lon: 78.66 },
  MH: { lat: 19.75, lon: 75.71 },
  MN: { lat: 24.66, lon: 93.91 },
  ML: { lat: 25.47, lon: 91.88 },
  MZ: { lat: 23.16, lon: 92.94 },
  NL: { lat: 26.16, lon: 94.56 },
  OD: { lat: 20.95, lon: 85.1 },
  PB: { lat: 31.15, lon: 75.34 },
  PY: { lat: 11.94, lon: 79.81 },
  RJ: { lat: 27.02, lon: 74.22 },
  SK: { lat: 27.53, lon: 88.51 },
  TN: { lat: 11.13, lon: 78.66 },
  TS: { lat: 18.11, lon: 79.41 },
  TR: { lat: 23.94, lon: 91.99 },
  UP: { lat: 26.85, lon: 80.95 },
  UK: { lat: 30.07, lon: 79.02 },
  WB: { lat: 22.99, lon: 87.86 },
}

export function projectState(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - 68) / (97.5 - 68)) * 100
  const y = ((36 - lat) / (36 - 6)) * 110
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(6, Math.min(104, y)) }
}

export function centroidForCode(code: string): { x: number; y: number } | null {
  const c = CENTROIDS[code.toUpperCase()]
  if (!c) return null
  return projectState(c.lat, c.lon)
}

export const SIGNAL_COLORS: Record<MomentumSignal, string> = {
  rising: '#22c55e',
  stable: '#eab308',
  falling: '#ef4444',
}

export function cellFill(signal: MomentumSignal, intensity: number): string {
  const base = SIGNAL_COLORS[signal] ?? SIGNAL_COLORS.stable
  const alpha = 0.25 + Math.min(1, Math.max(0, intensity)) * 0.75
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`
}

export function dominantGradientStops(
  momentum: MomentumSignal,
): { inner: string; outer: string } {
  const c = SIGNAL_COLORS[momentum]
  return { inner: `${c}66`, outer: `${c}08` }
}
