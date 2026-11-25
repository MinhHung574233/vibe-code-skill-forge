import type { IconName } from '@/components/Icon';

/**
 * The seven training modules (PRD §5). Shared screens (Practice hub, later Dashboard
 * recommendations and Progress) iterate this list instead of hard-coding module names.
 * A module only becomes `available` in the milestone that actually builds it.
 */
export type ModuleId = 'rubik' | 'english' | 'java' | 'tools' | 'caro' | 'chess' | 'go';

export interface ModuleDef {
  id: ModuleId;
  title: string;
  subtitle: string;
  icon: IconName;
  /** Identity colour (icon tile only; text keeps full contrast). DESIGN_SYSTEM §2. */
  color: string;
  status: 'planned' | 'available';
  /** Where the module opens (set once it is available). */
  route?: string;
  /** Roadmap milestone that delivers it. */
  milestone: string;
}

/** Order matches the roadmap (ROADMAP Phase 3). */
export const MODULES: readonly ModuleDef[] = [
  {
    id: 'rubik',
    title: 'Rubik’s Cube',
    subtitle: 'Timer, scrambles, Ao5 / Ao12, algorithms',
    icon: 'cube',
    color: '#ef4444',
    status: 'available',
    route: '/practice/rubik',
    milestone: 'M3.1',
  },
  {
    id: 'english',
    title: 'English',
    subtitle: 'IT vocabulary, flashcards, spaced repetition',
    icon: 'book',
    color: '#0ea5e9',
    status: 'available',
    route: '/practice/english',
    milestone: 'M3.2',
  },
  {
    id: 'java',
    title: 'Java & Spring Boot',
    subtitle: 'Core to advanced, architecture, performance',
    icon: 'code',
    color: '#f97316',
    status: 'available',
    route: '/practice/java',
    milestone: 'M3.3',
  },
  {
    id: 'tools',
    title: 'Developer Tools',
    subtitle: 'IntelliJ, Git & GitLab, DevOps tips',
    icon: 'terminal',
    color: '#14b8a6',
    status: 'available',
    route: '/practice/tools',
    milestone: 'M3.4',
  },
  {
    id: 'caro',
    title: 'Caro',
    subtitle: 'Five in a row against a real engine',
    icon: 'grid',
    color: '#8b5cf6',
    status: 'planned',
    milestone: 'M3.5',
  },
  {
    id: 'chess',
    title: 'Chess',
    subtitle: 'Puzzles, openings, rating',
    icon: 'chess',
    color: '#64748b',
    status: 'planned',
    milestone: 'M3.6',
  },
  {
    id: 'go',
    title: 'Go',
    subtitle: '9×9, 13×13, 19×19 and tsumego',
    icon: 'stones',
    color: '#22c55e',
    status: 'planned',
    milestone: 'M3.7',
  },
];
