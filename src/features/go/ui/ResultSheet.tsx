import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { t } from '@/i18n/core';
import type { Color } from '../domain/board';
import type { GameResult } from '../domain/game';
import { colorName } from './labels';

interface ResultSheetProps {
  open: boolean;
  result: GameResult | null;
  humanColor: Color;
  /** False when the game was too short to be recorded. */
  recorded: boolean;
  onClose: () => void;
}

/** The final result of a match: who won, by how much, and how the area was counted. */
export function ResultSheet({ open, result, humanColor, recorded, onClose }: ResultSheetProps) {
  const title =
    !result || result.winner === 'draw'
      ? t('Draw')
      : result.winner === humanColor
        ? t('You won')
        : t('You lost');
  const score = result?.score;
  const winnerName = result && result.winner !== 'draw' ? colorName(result.winner) : '';

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {result && (
        <div className="space-y-4">
          <p className="type-headline">
            {result.by === 'resign'
              ? t('{winner} wins by resignation ({text})', {
                  winner: winnerName,
                  text: result.text,
                })
              : result.winner === 'draw'
                ? t('The game is a draw.')
                : t('{winner} wins by {margin} points ({text})', {
                    winner: winnerName,
                    margin: result.margin,
                    text: result.text,
                  })}
          </p>
          {score && (
            <table className="w-full type-subhead tabular-nums">
              <thead>
                <tr className="text-left text-muted">
                  <th className="font-medium">{t('Area scoring')}</th>
                  <th className="text-right font-medium">{t('Stones')}</th>
                  <th className="text-right font-medium">{t('Territory')}</th>
                  <th className="text-right font-medium">{t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="text-left font-medium">
                    {t('Black')}
                  </th>
                  <td className="text-right">{score.blackStones}</td>
                  <td className="text-right">{score.blackTerritory}</td>
                  <td className="text-right">{score.black}</td>
                </tr>
                <tr>
                  <th scope="row" className="text-left font-medium">
                    {t('White + {komi} komi', { komi: score.komi })}
                  </th>
                  <td className="text-right">{score.whiteStones}</td>
                  <td className="text-right">{score.whiteTerritory}</td>
                  <td className="text-right">{score.white + score.komi}</td>
                </tr>
              </tbody>
            </table>
          )}
          {!recorded && (
            <p className="type-footnote text-muted">
              {t('This game was too short to be recorded (it needs at least five of your moves).')}
            </p>
          )}
          <Button fullWidth onClick={onClose}>
            {t('Continue')}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
