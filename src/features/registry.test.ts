import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from '@/components/Icon';
import { MODULES } from './registry';

describe('module registry', () => {
  it('lists the seven modules in roadmap order with unique ids', () => {
    expect(MODULES.map((m) => m.id)).toEqual([
      'rubik',
      'english',
      'java',
      'tools',
      'caro',
      'chess',
      'go',
    ]);
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(7);
  });

  it('gives every module a real icon, a hex identity colour and a milestone', () => {
    for (const m of MODULES) {
      expect(ICON_NAMES, `${m.id} icon`).toContain(m.icon);
      expect(m.color, `${m.id} colour`).toMatch(/^#[0-9a-f]{6}$/);
      expect(m.milestone, `${m.id} milestone`).toMatch(/^M3\.\d$/);
      expect(m.title.length).toBeGreaterThan(0);
    }
  });

  it('marks a module available only once it is built (none are yet)', () => {
    expect(MODULES.filter((m) => m.status === 'available')).toEqual([]);
  });
});
