import { Link, Route } from 'react-router';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { toLocalDate } from '@/core/time/localDate';
import { LearningModule, type LearningConfig } from '@/features/learning/ui/LearningModule';
import { useNow } from '@/hooks/useNow';
import { useState } from 'react';
import { TOOLS_PATHS } from '../domain/content';
import { TIPS, TIP_LABELS, tipForDate, type Tip, type TipCategory } from '../domain/tips';

function TipBody({ tip }: { tip: Tip }) {
  return (
    <>
      <p className="type-headline">{tip.title}</p>
      <p className="mt-1 type-body">{tip.text}</p>
      {tip.example && (
        <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-surface p-3 font-mono text-[13px]">
          <code>{tip.example}</code>
        </pre>
      )}
    </>
  );
}

/** The Daily Developer Tip: one bundled tip per calendar day. */
export function DailyTipCard() {
  const tip = tipForDate(toLocalDate(useNow()));
  return (
    <Card role="region" aria-labelledby="daily-tip-heading">
      <p
        id="daily-tip-heading"
        className="type-footnote font-medium uppercase tracking-wide text-muted"
      >
        Daily developer tip · {TIP_LABELS[tip.category]}
      </p>
      <div className="mt-2">
        <TipBody tip={tip} />
      </div>
      <Link
        to="tips"
        className="mt-3 inline-flex min-h-[44px] items-center type-callout text-accent"
      >
        Browse all {TIPS.length} tips
      </Link>
    </Card>
  );
}

const CATEGORIES = Object.keys(TIP_LABELS) as TipCategory[];

function TipsScreen() {
  const [category, setCategory] = useState<TipCategory | null>(null);
  const list = category ? TIPS.filter((t) => t.category === category) : TIPS;
  return (
    <Screen title="Tips" back={{ to: '/practice/tools', label: 'Developer Tools' }}>
      <div className="flex flex-wrap gap-2">
        <Chip selected={category === null} onClick={() => setCategory(null)}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            selected={category === c}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {TIP_LABELS[c]}
          </Chip>
        ))}
      </div>
      <Section footer={`${list.length} tips`}>
        {list.map((tip) => (
          <div key={tip.id} className="px-4 py-3">
            <TipBody tip={tip} />
          </div>
        ))}
      </Section>
    </Screen>
  );
}

const CONFIG: LearningConfig = {
  moduleId: 'tools',
  activityType: 'tools_lesson',
  title: 'Developer Tools',
  basePath: '/practice/tools',
  paths: TOOLS_PATHS,
  intro: <DailyTipCard />,
  extraRoutes: <Route path="tips" element={<TipsScreen />} />,
};

/** Module root, mounted at `practice/tools/*`. */
export function ToolsModule() {
  return <LearningModule config={CONFIG} />;
}
