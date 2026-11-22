import type { RouteObject } from 'react-router';
import { ShellScreen } from '@/components/ShellScreen';
import { SettingsScreen } from '@/features/settings/ui/SettingsScreen';
import { TabLayout } from './TabLayout';

/**
 * Route table. Module routes will be added as lazy chunks (all precached by the service
 * worker, so lazy never means online-only).
 */
export const routes: RouteObject[] = [
  {
    element: <TabLayout />,
    children: [
      { index: true, element: <ShellScreen title="Home" milestone="M1.5 (dashboard skeleton)" /> },
      { path: 'skills', element: <ShellScreen title="Skills" milestone="M2.4" /> },
      { path: 'practice', element: <ShellScreen title="Practice" milestone="M3.1+ (modules)" /> },
      { path: 'progress', element: <ShellScreen title="Progress" milestone="M2.5" /> },
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
