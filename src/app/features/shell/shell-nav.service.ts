import { computed, inject, Injectable } from '@angular/core';
import { AuthSession } from '../../core/auth/auth-session.service';
import { NAV_ITEMS } from './nav-items';

/** Navigation entries the signed-in role may open. */
@Injectable({ providedIn: 'root' })
export class ShellNavService {
  private readonly session = inject(AuthSession);

  readonly items = computed(() => {
    const role = this.session.role();
    return NAV_ITEMS.filter((item) => !item.roles || (role !== null && item.roles.includes(role)));
  });
}
