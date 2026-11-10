import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewEncapsulation, afterNextRender, inject, input, viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
import { LatLng } from '../../core/api/models';
import { TASKS_CONFIG } from './tasks.config';

/** Small Leaflet map with a single pin marking where the task applies. */
@Component({
  selector: 'app-task-map',
  imports: [TranslatePipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .task-map { border-radius: var(--ap-radius); border: 1px solid var(--ap-border); }
    path.task-pin { stroke: var(--ap-danger); fill: var(--ap-danger); fill-opacity: 0.6; stroke-width: 3; }
  `,
  template: `<div #canvas class="task-map" [style.height.px]="height" role="img"
    [attr.aria-label]="'tasks.detail.mapPin' | translate"></div>`,
})
export class TaskMapComponent {
  readonly position = input.required<LatLng>();
  protected readonly height = TASKS_CONFIG.mapHeightPx;
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const { lat, lng } = this.position();
      const map = L.map(this.canvas().nativeElement).setView([lat, lng], TASKS_CONFIG.mapZoom);
      L.tileLayer(environment.map.tileUrl).addTo(map);
      L.circleMarker([lat, lng], { radius: TASKS_CONFIG.mapMarkerRadiusPx, className: 'task-pin' }).addTo(map);
      destroyRef.onDestroy(() => map.remove());
    });
  }
}
