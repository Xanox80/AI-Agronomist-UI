import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { EXPERT_CONFIG } from './expert.config';
import { NormalizedPoint, toNormalizedPoint, toSvgPoints } from './polygon-geometry';

/** Photo with an SVG overlay (viewBox 0..1) where the expert taps to outline the affected area. */
@Component({
  selector: 'app-polygon-canvas',
  imports: [TranslatePipe, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .frame { position: relative; line-height: 0; border: 1px solid var(--ap-border); border-radius: var(--ap-radius); overflow: hidden; background: var(--ap-muted-bg); }
    img { width: 100%; height: auto; display: block; user-select: none; -webkit-user-drag: none; }
    svg { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: manipulation; cursor: crosshair; }
    .shape { fill: var(--ap-accent); stroke: var(--ap-accent); }
    .vertex { stroke: var(--ap-warn); stroke-linecap: round; fill: none; }
    .actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  `,
  template: `
    <div class="frame">
      <img [src]="src()" [alt]="'expert.viewer.photoAlt' | translate" draggable="false" />
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" (click)="addPoint($event)"
        role="img" [attr.aria-label]="'expert.viewer.canvasHint' | translate">
        @if (points().length > 1) {
          <polygon class="shape" [attr.points]="svgPoints()" [attr.fill-opacity]="fillOpacity"
            [attr.stroke-width]="strokePx" vector-effect="non-scaling-stroke" />
        }
        @for (p of points(); track $index) {
          <line class="vertex" [attr.x1]="p.x" [attr.y1]="p.y" [attr.x2]="p.x" [attr.y2]="p.y"
            [attr.stroke-width]="dotPx" vector-effect="non-scaling-stroke" />
        }
      </svg>
    </div>
    @if (editable()) {
      <div class="actions">
        <p-button icon="pi pi-undo" severity="secondary" [label]="'expert.viewer.undo' | translate"
          [disabled]="points().length === 0" (onClick)="undo()" />
        <p-button icon="pi pi-trash" severity="secondary" [label]="'expert.viewer.clear' | translate"
          [disabled]="points().length === 0" (onClick)="points.set([])" />
      </div>
    }
  `,
})
export class PolygonCanvasComponent {
  readonly src = input.required<string>();
  readonly editable = input(true);
  readonly points = model<NormalizedPoint[]>([]);

  protected readonly fillOpacity = EXPERT_CONFIG.fillOpacity;
  protected readonly strokePx = EXPERT_CONFIG.strokePx;
  protected readonly dotPx = EXPERT_CONFIG.vertexDotPx;
  protected readonly svgPoints = computed(() => toSvgPoints(this.points()));

  protected addPoint(event: MouseEvent): void {
    if (!this.editable() || this.points().length >= EXPERT_CONFIG.maxPolygonVertices) return;
    const box = (event.currentTarget as SVGElement).getBoundingClientRect();
    const point = toNormalizedPoint(event.clientX, event.clientY, box);
    if (point) this.points.update((list) => [...list, point]);
  }

  protected undo(): void {
    this.points.update((list) => list.slice(0, -1));
  }
}
