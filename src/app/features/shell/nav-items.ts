import { Role } from '../../core/api/models';

export interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
  /** Roles allowed to see the item; undefined means every role. */
  roles?: readonly Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/home', icon: 'pi-home', labelKey: 'shell.nav.home' },
  { path: '/scouting', icon: 'pi-camera', labelKey: 'shell.nav.scouting', roles: ['scout', 'chief_agronomist', 'mechanic'] },
  { path: '/fields', icon: 'pi-map', labelKey: 'shell.nav.fields' },
  { path: '/tasks', icon: 'pi-check-square', labelKey: 'shell.nav.tasks' },
  { path: '/heatmap', icon: 'pi-chart-bar', labelKey: 'shell.nav.heatmap', roles: ['chief_agronomist'] },
  { path: '/expert', icon: 'pi-search', labelKey: 'shell.nav.expert', roles: ['expert', 'chief_agronomist'] },
  { path: '/catalog-admin', icon: 'pi-book', labelKey: 'shell.nav.catalogAdmin', roles: ['chief_agronomist'] },
  { path: '/settings', icon: 'pi-cog', labelKey: 'shell.nav.settings' },
];
