import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { RecommendationItemDto } from '../../core/api/models';

@Component({
  selector: 'app-recommendation-product-list',
  imports: [TranslatePipe, TagModule, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .card {
      padding: 1rem; margin-top: 0.75rem; background: var(--ap-surface);
      border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    .card.excluded { background: var(--ap-muted-bg); }
    .head { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: space-between; }
    dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 0.5rem 1rem; margin: 0.75rem 0 0; }
    dt { color: var(--ap-text-sec); font-size: 0.8rem; }
    dd { margin: 0; color: var(--ap-text); }
    .note { color: var(--ap-text-sec); font-size: 0.875rem; margin-top: 0.5rem; }
    .demo { color: var(--ap-warn); }
  `,
  template: `
    @for (item of items(); track item.product.id + item.rank) {
      <article class="card" [class.excluded]="excluded()">
        <div class="head">
          <strong>{{ item.rank }}. {{ item.product.name }}</strong>
          @if (excluded()) {
            <p-tag severity="secondary" [value]="'recommendation.products.excluded' | translate" />
          } @else {
            <p-tag [severity]="item.stock.inStock ? 'success' : 'danger'"
              [value]="(item.stock.inStock ? 'recommendation.products.inStock' : 'recommendation.products.outOfStock') | translate" />
          }
        </div>
        <dl>
          <div><dt>{{ 'recommendation.products.rate' | translate }}</dt>
            <dd>{{ item.rate.value | number: '1.0-3' }} {{ item.rate.unit }}</dd></div>
          <div><dt>{{ 'recommendation.products.timing' | translate }}</dt><dd>{{ item.applicationTiming }}</dd></div>
          <div><dt>{{ 'recommendation.products.bbch' | translate }}</dt><dd>{{ item.bbchFrom }}–{{ item.bbchTo }}</dd></div>
          <div><dt>{{ 'recommendation.products.phi' | translate }}</dt>
            <dd>{{ item.preHarvestIntervalDays }} {{ 'recommendation.products.days' | translate }}</dd></div>
          <div><dt>{{ 'recommendation.products.resistance' | translate }}</dt>
            <dd>{{ item.resistance.system }} {{ item.resistance.group }}
              @if (!item.resistance.rotationOk) {
                <p-tag severity="warn" [value]="'recommendation.products.rotationRisk' | translate" />
              }
            </dd></div>
          @if (item.stock.quantity != null) {
            <div><dt>{{ 'recommendation.products.stock' | translate }}</dt>
              <dd>{{ item.stock.quantity | number: '1.0-2' }} {{ item.stock.unit }}</dd></div>
          }
          @if (item.costPerHaUah != null) {
            <div><dt>{{ 'recommendation.products.cost' | translate }}</dt>
              <dd>{{ item.costPerHaUah | number: '1.0-2' }} {{ 'recommendation.products.uahPerHa' | translate }}</dd></div>
          }
          <div><dt>{{ 'recommendation.products.source' | translate }}</dt>
            <dd>{{ 'recommendation.source.' + item.product.source | translate }}
              @if (item.product.verifiedAt) {
                · {{ item.product.verifiedAt | date: 'mediumDate' }}
              } @else {
                · {{ 'recommendation.products.notVerified' | translate }}
              }
            </dd></div>
        </dl>
        @if (item.resistance.note; as note) { <p class="note">{{ 'recommendation.reason.' + note.code | translate: note.params }}</p> }
        @if (item.excludedReason; as reason) { <p class="note">{{ 'recommendation.reason.' + reason.code | translate: reason.params }}</p> }
        @if (item.product.isDemo) { <p class="note demo">{{ 'recommendation.products.demo' | translate }}</p> }
      </article>
    }
  `,
})
export class ProductListComponent {
  readonly items = input.required<readonly RecommendationItemDto[]>();
  readonly excluded = input(false);
}
