import { routes } from './app.routes';

describe('app routes', () => {
  const shellChildren = routes.find((route) => route.path === '')?.children ?? [];
  const childPaths = shellChildren.map((route) => route.path);

  it('keeps login outside the shell', () => {
    expect(routes.some((route) => route.path === 'login')).toBe(true);
    expect(childPaths).not.toContain('login');
  });

  it('declares a lazy route for every feature inside the shell', () => {
    expect(childPaths).toEqual(
      expect.arrayContaining([
        'home', 'fields', 'scouting', 'diagnosis/:id', 'recommendation/:observationId', 'tasks', 'heatmap', 'expert',
        'settings', 'catalog-admin',
      ]),
    );
  });

  it('guards the role-restricted features', () => {
    const guarded = shellChildren.filter((route) => route.canActivate?.length).map((route) => route.path);
    expect(guarded).toEqual(['heatmap', 'expert', 'catalog-admin']);
  });
});
