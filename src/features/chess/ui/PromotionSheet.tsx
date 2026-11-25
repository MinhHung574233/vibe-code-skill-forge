import type { Color } from 'chess.js';
import { Sheet } from '@/components/Sheet';
import type { PromotionPiece } from '../domain/rules';
import { PieceGlyph } from './pieces';

const CHOICES: { piece: PromotionPiece; label: string }[] = [
  { piece: 'q', label: 'Queen' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
  { piece: 'n', label: 'Knight' },
];

interface PromotionSheetProps {
  open: boolean;
  color: Color;
  onChoose: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

/** Bottom-sheet piece picker shown when a pawn reaches the last rank. */
export function PromotionSheet({ open, color, onChoose, onCancel }: PromotionSheetProps) {
  return (
    <Sheet open={open} onClose={onCancel} title="Promote pawn to">
      <div className="grid grid-cols-4 gap-2 pb-2">
        {CHOICES.map(({ piece, label }) => (
          <button
            key={piece}
            type="button"
            aria-label={label}
            onClick={() => onChoose(piece)}
            className="flex min-h-[72px] flex-col items-center justify-center rounded-xl border border-border bg-accent-soft active:opacity-70"
          >
            <PieceGlyph
              type={piece}
              color={color}
              className="size-12 rounded-md"
            />
            <span className="type-footnote text-muted">{label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
