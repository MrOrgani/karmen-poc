import { decisionAlignment } from './decision-alignment';

describe('decisionAlignment', () => {
  it('approve on a low-risk case is aligned', () => {
    expect(decisionAlignment('approve', 'low')).toBe('aligned');
  });

  it('reject on a low-risk case is divergent', () => {
    expect(decisionAlignment('reject', 'low')).toBe('divergent');
  });

  it('reject on a high-risk case is aligned', () => {
    expect(decisionAlignment('reject', 'high')).toBe('aligned');
  });

  it('approve on a high-risk case is divergent', () => {
    expect(decisionAlignment('approve', 'high')).toBe('divergent');
  });

  it('medium risk is a judgment zone for both directions', () => {
    expect(decisionAlignment('approve', 'medium')).toBe('judgment-zone');
    expect(decisionAlignment('reject', 'medium')).toBe('judgment-zone');
  });
});
