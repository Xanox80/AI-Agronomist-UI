import { TestBed } from '@angular/core/testing';
import { AuthSession } from '../../core/auth/auth-session.service';
import { ShellNavService } from './shell-nav.service';

const tokenFor = (role: string) => `h.${btoa(JSON.stringify({ role }))}.s`;

function pathsFor(role: string): string[] {
  localStorage.clear();
  TestBed.resetTestingModule();
  TestBed.inject(AuthSession).start({ accessToken: tokenFor(role) });
  return TestBed.inject(ShellNavService).items().map((item) => item.path);
}

describe('ShellNavService', () => {
  it('hides expert and catalogue admin entries from a scout', () => {
    const paths = pathsFor('scout');
    expect(paths).toContain('/scouting');
    expect(paths).not.toContain('/expert');
    expect(paths).not.toContain('/catalog-admin');
  });

  it('hides the chief-only infestation map from roles the route guard would bounce', () => {
    for (const role of ['scout', 'mechanic', 'expert']) {
      expect(pathsFor(role)).not.toContain('/heatmap');
    }
    expect(pathsFor('chief_agronomist')).toContain('/heatmap');
  });

  it('shows every entry to the chief agronomist', () => {
    const paths = pathsFor('chief_agronomist');
    expect(paths).toContain('/expert');
    expect(paths).toContain('/catalog-admin');
  });

  it('hides scouting from an expert but shows the expert queue', () => {
    const paths = pathsFor('expert');
    expect(paths).not.toContain('/scouting');
    expect(paths).toContain('/expert');
  });
});
