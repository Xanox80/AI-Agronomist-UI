import {
  ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation, ElementRef, afterNextRender, effect, inject, input, output,
  signal, viewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import type { Polygon } from 'geojson';
import { environment } from '../../../environments/environment';
import { MapFeature, contourAreaHa } from './contour-geometry';
import { ContourSketch } from './contour-sketch';
import { FIELDS_CONFIG } from './fields.config';

/** Leaflet map showing field contours, optionally capturing a drawn polygon by clicks. */
@Component({
  selector: 'app-field-map',
  imports: [ButtonModule, TranslatePipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    app-field-map { display: block; }
    .field-map__canvas { border-radius: var(--ap-radius); border: 1px solid var(--ap-border); }
    .field-map__tools { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
    .field-map__hint { color: var(--ap-text-sec); font-size: 0.875rem; }
    path.field-contour { stroke: var(--ap-accent); fill: var(--ap-accent); fill-opacity: 0.2; stroke-width: 2; }
    path.field-sketch { stroke: var(--ap-info); fill: var(--ap-info); fill-opacity: 0.15; stroke-width: 3; }
    path.field-vertex { stroke: var(--ap-info); fill: var(--ap-surface); fill-opacity: 1; stroke-width: 3; }
  `,
  template: `
    <div #canvas class="field-map__canvas" role="application" [style.height.px]="heightPx" [attr.aria-label]="'fields.map.label' | translate"></div>
    @if (drawing()) {
      <div class="field-map__tools">
        <span class="field-map__hint">{{ 'fields.map.drawHint' | translate }}</span>
        <p-button severity="secondary" icon="pi pi-undo" [label]="'fields.map.undo' | translate"
          [disabled]="sketch().points.length === 0" (onClick)="undo()" />
        <p-button severity="secondary" icon="pi pi-trash" [label]="'fields.map.clear' | translate"
          [disabled]="sketch().points.length === 0" (onClick)="clear()" />
        <p-button icon="pi pi-check" [label]="'fields.map.finish' | translate"
          [disabled]="!sketch().toPolygon()" (onClick)="finish()" />
      </div>
    }
  `,
})
export class FieldMapComponent {
  protected readonly heightPx = FIELDS_CONFIG.mapHeightPx;
  readonly features = input<readonly MapFeature[]>([]);
  readonly drawing = input(false);
  readonly featureSelected = output<string>();
  readonly contourDrawn = output<{ contour: Polygon; areaHa: number }>();

  protected readonly sketch = signal(new ContourSketch());
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly map = signal<L.Map | null>(null);
  private readonly contourLayer = L.featureGroup();
  private readonly sketchLayer = L.featureGroup();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const { defaultCenter, defaultZoom, tileUrl } = environment.map;
      const map = L.map(this.canvas().nativeElement).setView([defaultCenter.lat, defaultCenter.lng], defaultZoom);
      L.tileLayer(tileUrl, { attribution: FIELDS_CONFIG.tileAttribution }).addTo(map);
      this.contourLayer.addTo(map);
      this.sketchLayer.addTo(map);
      map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e.latlng));
      this.map.set(map);
      destroyRef.onDestroy(() => map.remove());
    });
    effect(() => this.renderFeatures(this.map(), this.features()));
    effect(() => this.renderSketch(this.sketch()));
  }

  protected undo(): void {
    this.sketch.update((s) => s.undo());
  }

  protected clear(): void {
    this.sketch.update((s) => s.clear());
  }

  protected finish(): void {
    const contour = this.sketch().toPolygon();
    if (!contour) return;
    this.contourDrawn.emit({ contour, areaHa: contourAreaHa(contour) });
    this.clear();
  }

  private onMapClick(latlng: L.LatLng): void {
    if (this.drawing()) this.sketch.update((s) => s.add({ lat: latlng.lat, lng: latlng.lng }));
  }

  private renderFeatures(map: L.Map | null, features: readonly MapFeature[]): void {
    this.contourLayer.clearLayers();
    if (!map) return;
    for (const feature of features) {
      L.geoJSON(feature.contour, { style: { className: 'field-contour' } })
        .bindTooltip(feature.name)
        .on('click', () => this.featureSelected.emit(feature.id))
        .addTo(this.contourLayer);
    }
    const bounds = this.contourLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: FIELDS_CONFIG.mapFitPadding, maxZoom: FIELDS_CONFIG.mapSingleFieldMaxZoom });
    }
  }

  private renderSketch(sketch: ContourSketch): void {
    this.sketchLayer.clearLayers();
    const latLngs = sketch.points.map((p) => L.latLng(p.lat, p.lng));
    if (latLngs.length >= FIELDS_CONFIG.minContourVertices) {
      L.polygon(latLngs, { className: 'field-sketch' }).addTo(this.sketchLayer);
    } else if (latLngs.length > 1) {
      L.polyline(latLngs, { className: 'field-sketch' }).addTo(this.sketchLayer);
    }
    for (const latLng of latLngs) {
      L.circleMarker(latLng, { radius: FIELDS_CONFIG.vertexRadiusPx, className: 'field-vertex' }).addTo(this.sketchLayer);
    }
  }
}
