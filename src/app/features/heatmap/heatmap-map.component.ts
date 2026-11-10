import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewEncapsulation, afterNextRender, effect, inject, input,
  signal, viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import 'leaflet.heat';
import { environment } from '../../../environments/environment';
import { HeatmapDto } from '../../core/api/models';
import { heatGradient } from './heat-gradient';
import { HEATMAP_CONFIG } from './heatmap.config';

/** Leaflet map drawing field contours and a leaflet.heat layer; heat colors come from --ap-* tokens. */
@Component({
  selector: 'app-heatmap-map',
  imports: [TranslatePipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    app-heatmap-map { display: block; }
    .heatmap-map__canvas { height: 60vh; min-height: 320px; border-radius: var(--ap-radius); border: 1px solid var(--ap-border); }
    path.heatmap-contour { stroke: var(--ap-accent); fill: var(--ap-accent); fill-opacity: 0.08; stroke-width: 2; }
  `,
  template: `<div #canvas class="heatmap-map__canvas" role="application" [attr.aria-label]="'heatmap.map.label' | translate"></div>`,
})
export class HeatmapMapComponent {
  readonly data = input<HeatmapDto | null>(null);

  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly map = signal<L.Map | null>(null);
  private readonly contourLayer = L.featureGroup();
  private heatLayer: L.HeatLayer | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const { defaultCenter, defaultZoom, tileUrl } = environment.map;
      const map = L.map(this.canvas().nativeElement).setView([defaultCenter.lat, defaultCenter.lng], defaultZoom);
      L.tileLayer(tileUrl, { attribution: HEATMAP_CONFIG.tileAttribution }).addTo(map);
      this.contourLayer.addTo(map);
      this.map.set(map);
      destroyRef.onDestroy(() => map.remove());
    });
    effect(() => this.render(this.map(), this.data()));
  }

  private render(map: L.Map | null, data: HeatmapDto | null): void {
    if (!map) return;
    this.contourLayer.clearLayers();
    for (const field of data?.fields ?? []) {
      if (field.contour) L.geoJSON(field.contour, { style: { className: 'heatmap-contour' } }).bindTooltip(`${field.name} (${field.count})`).addTo(this.contourLayer);
    }
    this.heatLayer?.remove();
    const points = (data?.points ?? []).map((p): L.HeatLatLngTuple => [p.lat, p.lng, p.weight]);
    this.heatLayer = L.heatLayer(points, this.heatOptions()).addTo(map);
    this.fit(map, points);
  }

  private fit(map: L.Map, points: L.HeatLatLngTuple[]): void {
    const bounds = this.contourLayer.getBounds();
    points.forEach(([lat, lng]) => bounds.extend([lat, lng]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: HEATMAP_CONFIG.mapFitPadding, maxZoom: HEATMAP_CONFIG.mapMaxFitZoom });
  }

  private heatOptions(): L.HeatMapOptions {
    const gradient = heatGradient(getComputedStyle(this.canvas().nativeElement));
    return {
      radius: HEATMAP_CONFIG.heatRadiusPx,
      blur: HEATMAP_CONFIG.heatBlurPx,
      minOpacity: HEATMAP_CONFIG.heatMinOpacity,
      maxZoom: HEATMAP_CONFIG.heatMaxZoom,
      max: HEATMAP_CONFIG.heatMaxWeight,
      ...(Object.keys(gradient).length ? { gradient } : {}),
    };
  }
}
