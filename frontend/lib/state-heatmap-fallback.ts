import type { MomentumSignal, StateHeatCell } from './india-states'

const CODES =
  'AP,AR,AS,BR,CG,DL,GA,GJ,HR,HP,JH,JK,KA,KL,LA,MP,MH,MN,ML,MZ,NL,OD,PB,PY,RJ,SK,TN,TS,TR,UP,UK,WB'.split(
    ',',
  )

/** Minimal map data when API has not yet returned state_heatmap. */
export function buildFallbackStateHeatmap(
  heatScore: number,
  momentum: MomentumSignal,
): StateHeatCell[] {
  const heat = heatScore / 100
  return CODES.map((code, i) => ({
    code,
    nameHi: code,
    intensity: 0.15 + ((i * 17) % 100) / 100 * 0.4 * heat,
    signal: i % 5 === 0 ? momentum : ('stable' as MomentumSignal),
  }))
}
