import { heatGradient } from './heat-gradient';

describe('heatGradient', () => {
  it('maps each stop to its token color', () => {
    const tokens: Record<string, string> = { '--ap-ok': ' #0a0 ', '--ap-warn': '#fa0', '--ap-danger': '#f00' };
    expect(heatGradient({ getPropertyValue: (t) => tokens[t] ?? '' })).toEqual({ 0.3: '#0a0', 0.65: '#fa0', 1: '#f00' });
  });

  it('skips tokens that are not defined', () => {
    expect(heatGradient({ getPropertyValue: () => '' })).toEqual({});
  });
});
