import { useMemo } from 'react';
import { createHashRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

export function App() {
  // Hash routing: works on any static host and sub-path with no rewrite rules.
  const router = useMemo(() => createHashRouter(routes), []);
  return <RouterProvider router={router} />;
}
