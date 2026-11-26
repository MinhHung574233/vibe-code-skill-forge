import { NavLink, Outlet } from 'react-router';
import { Icon } from '@/components/Icon';
import { t } from '@/i18n/core';
import { cn } from '@/utils/cn';
import { StatusBanners } from './StatusBanners';
import { TABS } from './tabs';

/**
 * Persistent app shell: fixed to the viewport, content scrolls in an inner container so
 * the page itself never rubber-bands in standalone mode. Safe areas are handled with env().
 */
export function TabLayout() {
  return (
    <div className="fixed inset-0 flex flex-col bg-bg text-text">
      <StatusBanners />
      <main
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <Outlet />
      </main>
      <nav
        aria-label={t('Primary')}
        className="border-t border-border bg-surface/90 backdrop-blur"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <ul className="mx-auto flex max-w-xl">
          {TABS.map((tab) => (
            <li key={tab.path} className="flex-1">
              <NavLink
                to={tab.path}
                end={tab.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[49px] flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px] font-medium transition-colors active:opacity-60',
                    isActive ? 'text-accent' : 'text-muted',
                  )
                }
              >
                <Icon name={tab.icon} size={26} />
                <span>{t(tab.label)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
