import type { IconName } from '@/components/Icon';

export interface TabDef {
  path: string;
  label: string;
  icon: IconName;
}

/** The five root tabs (PRD §4). */
export const TABS: readonly TabDef[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/skills', label: 'Skills', icon: 'star' },
  { path: '/practice', label: 'Practice', icon: 'activity' },
  { path: '/progress', label: 'Progress', icon: 'chart' },
  { path: '/settings', label: 'Settings', icon: 'sliders' },
];
