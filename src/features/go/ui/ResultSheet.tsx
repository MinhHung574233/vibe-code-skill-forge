import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { BLACK, type Color } from '../domain/board';
import type { GameResult } from '../domain/game';

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
      ? 'Draw'
      : result.winner === humanColor
        ? 'You won'
        : 'You lost';
  const score = result?.score;
  const winnerName =
    result && result.winner !== 'draw' ? (result.winner === BLACK ? 'Black' : 'White') : '';

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {result && (
        <div className="space-y-4">
          <p className="type-headline">
            {result.by === 'resign'
              ? `${winnerName} wins by resignation (${result.text})`
              : result.winner === 'draw'
                ? 'The game is a draw.'
                : `${winnerName} wins by ${result.margin} points (${result.text})`}
          </p>
          {score && (
            <table className="w-full type-subhead tabular-nums">
              <thead>
                <tr className="text-left text-muted">
                  <th className="font-medium">Area scoring</th>
                  <th className="text-right font-medium">Stones</th>
                  <th className="text-right font-medium">Territory</th>
                  <th className="text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="text-left font-medium">
                    Black
                  </th>
                  <td className="text-right">{score.blackStones}</td>
                  <td className="text-right">{score.blackTerritory}</td>
                  <td className="text-right">{score.black}</td>
                </tr>
                <tr>
                  <th scope="row" className="text-left font-medium">
                    White + {score.komi} komi
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
              This game was too short to be recorded (it needs at least five of your moves).
            </p>
          )}
          <Button fullWidth onClick={onClose}>
            Continue
          </Button>
        </div>
      )}
    </Sheet>
  );
}
