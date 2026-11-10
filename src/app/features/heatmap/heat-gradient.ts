import { HEATMAP_CONFIG } from './heatmap.config';

/** Maps the configured gradient stops to the colors of their --ap-* tokens, skipping undefined tokens. */
export function heatGradient(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): Record<number, string> {
  const gradient: Record<number, string> = {};
  for (const { stop, token } of HEATMAP_CONFIG.heatGradientStops) {
    const color = style.getPropertyValue(token).trim();
    if (color) gradient[stop] = color;
  }
  return gradient;
}
