import { Role } from '../../core/api/models';

export const OPEN_TASKS_LIMIT = 5;

/** The one-tap action at the top of the home screen. */
export interface HomePrimaryAction {
  path: string;
  icon: string;
  labelKey: string;
}

const NEW_SCOUTING: HomePrimaryAction = { path: '/scouting', icon: 'pi pi-camera', labelKey: 'home.newScouting' };

/** Experts do not scout, so their main job (the review queue) takes the primary slot. */
export const HOME_PRIMARY_ACTIONS: Readonly<Record<Role, HomePrimaryAction>> = {
  scout: NEW_SCOUTING,
  chief_agronomist: NEW_SCOUTING,
  mechanic: NEW_SCOUTING,
  expert: { path: '/expert', icon: 'pi pi-search', labelKey: 'home.openExpertQueue' },
};
