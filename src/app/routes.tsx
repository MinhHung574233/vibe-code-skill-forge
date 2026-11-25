import type { RouteObject } from 'react-router';
import { ShellScreen } from '@/components/ShellScreen';
import { DashboardScreen } from '@/features/dashboard/ui/DashboardScreen';
import { PracticeScreen } from '@/features/practice/ui/PracticeScreen';
import { ProgressScreen } from '@/features/progress/ui/ProgressScreen';
import { SettingsScreen } from '@/features/settings/ui/SettingsScreen';
import { SkillDetailScreen } from '@/features/skills/ui/SkillDetailScreen';
import { SkillsScreen } from '@/features/skills/ui/SkillsScreen';
import { SessionScreen } from '@/features/training/ui/SessionScreen';
import { TabLayout } from './TabLayout';

/**
 * Route table. Module routes will be added as lazy chunks (all precached by the service
 * worker, so lazy never means online-only).
 */
export const routes: RouteObject[] = [
  {
    element: <TabLayout />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: 'skills', element: <SkillsScreen /> },
      { path: 'skills/:id', element: <SkillDetailScreen /> },
      { path: 'practice', element: <PracticeScreen /> },
      { path: 'practice/session', element: <SessionScreen /> },
      { path: 'progress', element: <ProgressScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      {
        // Developer-only design-system gallery; not linked from the UI.
        path: 'dev/components',
        lazy: async () => {
          const { ComponentGallery } = await import('./dev/ComponentGallery');
          return { Component: ComponentGallery };
        },
      },
      { path: '*', element: <ShellScreen title="Not found" milestone="n/a" /> },
    ],
  },
];
