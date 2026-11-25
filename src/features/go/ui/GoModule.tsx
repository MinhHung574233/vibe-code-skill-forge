import { useMemo } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { createAiEngine, type AiEngine } from './aiEngine';
import { GoHome } from './GoHome';
import { GoRouteContext, type GoContext } from './hooks';
import { PlayScreen } from './PlayScreen';
import { TsumegoListScreen } from './TsumegoListScreen';
import { TsumegoScreen } from './TsumegoScreen';

interface GoModuleProps {
  /** Replaces the real AI (tests inject a scripted opponent). */
  createEngine?: () => AiEngine;
}

function NotFound({ home }: { home: string }) {
  return (
    <Screen title="Go" back={{ to: home, label: 'Go' }}>
      <EmptyState
        icon="alert"
        title="Page not found"
        description="That Go page does not exist."
        action={
          <Link to={home} className="type-headline text-accent">
            Back to Go
          </Link>
        }
      />
    </Screen>
  );
}

/**
 * The Go module, mounted by the app at `practice/go/*`. Everything below uses relative route paths
 * and builds links from where it is mounted, so the mount point can change.
 */
export function GoModule({ createEngine = createAiEngine }: GoModuleProps) {
  // Where this module is mounted: the current path minus what the splat route matched below it.
  const { pathname } = useLocation();
  const splat = useParams()['*'] ?? '';
  const mounted = splat && pathname.endsWith(splat) ? pathname.slice(0, -splat.length) : pathname;
  const base = mounted.replace(/\/$/, '');
  const context = useMemo<GoContext>(
    () => ({ base, practice: base.replace(/\/[^/]+$/, '') || '/', createEngine }),
    [base, createEngine],
  );
  return (
    <GoRouteContext value={context}>
      <Routes>
        <Route index element={<GoHome />} />
        <Route path="play" element={<PlayScreen />} />
        <Route path="tsumego" element={<TsumegoListScreen />} />
        <Route path="tsumego/:problemId" element={<TsumegoScreen />} />
        <Route path="*" element={<NotFound home={base} />} />
      </Routes>
    </GoRouteContext>
  );
}
