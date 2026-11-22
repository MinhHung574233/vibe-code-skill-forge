import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, useThemeStore } from './themeStore';

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useThemeStore.setState({ preference: 'system' });
  });

  it('applies and persists an explicit dark preference', () => {
    useThemeStore.getState().setPreference('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('sf-theme')).toBe('dark');
    expect(useThemeStore.getState().preference).toBe('dark');
  });

  it('switching back to system removes the override and the stored value', () => {
    useThemeStore.getState().setPreference('light');
    useThemeStore.getState().setPreference('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('sf-theme')).toBeNull();
  });

  it('applyTheme only touches the data-theme attribute', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    applyTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
