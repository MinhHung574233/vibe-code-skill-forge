import { Card } from '@/components/Card';
import { t } from '@/i18n/core';

/**
 * Tips for beating the Hard level. They follow from how the engine is built (a fixed-depth search
 * with no opening book and no endgame tables); they are advice, not measured results.
 */
export function BeatHardTips() {
  return (
    <Card role="region" aria-labelledby="beat-hard-title" className="mt-4">
      <h2 id="beat-hard-title" className="type-headline">
        {t('How to beat Hard')}
      </h2>
      <p className="mt-1 type-subhead text-muted">
        {t(
          'Hard searches up to 12 half-moves ahead and stops after 1.4 seconds. It sees short tactics well, so beat it with sound play and patience.',
        )}
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 type-body">
        <li>
          {t('Before every move, look for pieces that can be captured for free: yours and its.')}
        </li>
        <li>
          {t(
            'Play a sound opening. Hard has no opening book, so it can drift into poor positions.',
          )}
        </li>
        <li>
          {t('When you are ahead in material, trade pieces. Fewer pieces mean fewer tricks.')}
        </li>
        <li>
          {t(
            'Try to reach endgames, especially ones with a passed pawn. Hard has no endgame tables and may play them loosely.',
          )}
        </li>
        <li>
          {t(
            'Closed positions with locked pawns reward long plans, which a fixed-depth search can miss.',
          )}
        </li>
        <li>
          {t(
            'Turn on Coach mode and practise on Medium first. Move to Hard when most of your moves are Best or Good.',
          )}
        </li>
      </ul>
    </Card>
  );
}
