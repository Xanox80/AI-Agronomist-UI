import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SETTINGS_CONFIG } from '../settings.config';
import { StockListService } from './stock-list.service';

@Component({
  selector: 'app-stock-list',
  imports: [TranslatePipe, DatePipe, TableModule, InputTextModule],
  template: `
    <section class="scout-page">
      <h1>{{ 'settings.stock.title' | translate }}</h1>
      <input
        pInputText
        type="search"
        class="search"
        [placeholder]="'settings.stock.search' | translate"
        (input)="search(query.value)"
        #query
      />
      <p-table
        [value]="service.items()"
        [scrollable]="true"
        [lazy]="true"
        [paginator]="service.total() > service.pageSize"
        [rows]="service.pageSize"
        [first]="(service.page() - 1) * service.pageSize"
        [totalRecords]="service.total()"
        (onLazyLoad)="loadPage($event)"
      >
        <ng-template #header>
          <tr>
            <th>{{ 'settings.stock.product' | translate }}</th>
            <th>{{ 'settings.stock.quantity' | translate }}</th>
            <th>{{ 'settings.stock.warehouse' | translate }}</th>
            <th>{{ 'settings.stock.expires' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template #body let-item>
          <tr>
            <td>{{ item.productName }}</td>
            <td>{{ item.quantity }} {{ item.unit }}</td>
            <td>{{ item.warehouse }}</td>
            <td>{{ item.expiresAt | date: 'mediumDate' }}</td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td [attr.colspan]="columnCount">{{ 'settings.stock.empty' | translate }}</td></tr>
        </ng-template>
      </p-table>
    </section>
  `,
  styles: `.search { width: 100%; min-height: var(--ap-touch-min); margin-bottom: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListComponent implements OnInit {
  protected readonly service = inject(StockListService);
  protected readonly columnCount = SETTINGS_CONFIG.stockColumnCount;
  private readonly typed = new Subject<string>();

  constructor() {
    this.typed
      .pipe(debounceTime(SETTINGS_CONFIG.stockSearchDebounceMs), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((q) => void this.service.search(q));
  }

  ngOnInit(): void {
    void this.service.search('');
  }

  protected search(q: string): void {
    this.typed.next(q);
  }

  protected loadPage(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / this.service.pageSize) + 1;
    if (page !== this.service.page()) void this.service.goToPage(page);
  }
}
