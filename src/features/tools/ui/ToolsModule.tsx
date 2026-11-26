import { Link, Route } from 'react-router';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { toLocalDate } from '@/core/time/localDate';
import { LearningModule, type LearningConfig } from '@/features/learning/ui/LearningModule';
import { useNow } from '@/hooks/useNow';
import { t } from '@/i18n/core';
import { useState } from 'react';
import { TOOLS_PATHS } from '../domain/content';
import { TIPS, TIP_LABELS, tipForDate, type Tip, type TipCategory } from '../domain/tips';

function TipBody({ tip }: { tip: Tip }) {
  return (
    <>
      <p className="type-headline">{t(tip.title)}</p>
      <p className="mt-1 type-body">{t(tip.text)}</p>
      {tip.example && (
        <pre
          tabIndex={0}
          aria-label={t('Code example')}
          className="mt-2 overflow-x-auto rounded-xl border border-border bg-surface p-3 font-mono text-[13px]"
        >
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
        {t('Daily developer tip · {category}', { category: t(TIP_LABELS[tip.category]) })}
      </p>
      <div className="mt-2">
        <TipBody tip={tip} />
      </div>
      <Link
        to="tips"
        className="mt-3 inline-flex min-h-[44px] items-center type-callout text-accent"
      >
        {t('Browse all {n} tips', { n: TIPS.length })}
      </Link>
    </Card>
  );
}

const CATEGORIES = Object.keys(TIP_LABELS) as TipCategory[];

function TipsScreen() {
  const [category, setCategory] = useState<TipCategory | null>(null);
  const list = category ? TIPS.filter((x) => x.category === category) : TIPS;
  return (
    <Screen title={t('Tips')} back={{ to: '/practice/tools', label: t('Developer Tools') }}>
      <div className="flex flex-wrap gap-2">
        <Chip selected={category === null} onClick={() => setCategory(null)}>
          {t('All')}
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            selected={category === c}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {t(TIP_LABELS[c])}
          </Chip>
        ))}
      </div>
      <Section footer={t('{n} tips', { n: list.length })}>
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
