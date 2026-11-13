import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { confirmLeaveScouting, SCOUTING_ROUTES } from './scouting.routes';
import { ScoutingComponent } from './scouting.component';

describe('scouting routes', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  it('guards the wizard page against leaving with unsaved work', () => {
    expect(SCOUTING_ROUTES[0].canDeactivate).toEqual([confirmLeaveScouting]);
  });

  it('defers the leave decision to the wizard page', () => {
    const page = { canLeave: vi.fn().mockReturnValue(false) } as unknown as ScoutingComponent;
    expect(confirmLeaveScouting(page, route, state, state)).toBe(false);
    expect(page.canLeave).toHaveBeenCalled();
  });
});
