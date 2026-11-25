import type { Color, PieceSymbol } from 'chess.js';

/**
 * Pieces are drawn as the filled Unicode chess glyphs, coloured by SVG fill and outline, so both
 * sides use the same shapes and nothing is downloaded. U+FE0E asks for text (not emoji) style,
 * which matters for the pawn on iOS.
 */
const GLYPH: Record<PieceSymbol, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const PIECE_FILL = { w: '#fdfdfd', b: '#16181d' } as const;
const PIECE_OUTLINE = { w: '#16181d', b: '#f2f2f2' } as const;
const FONT = "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols 2','DejaVu Sans',serif";

export function PieceGlyph({
  type,
  color,
  className,
}: {
  type: PieceSymbol;
  color: Color;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 45 45" aria-hidden="true" className={className}>
      <text
        x="22.5"
        y="35"
        textAnchor="middle"
        fontSize="40"
        fill={PIECE_FILL[color]}
        stroke={PIECE_OUTLINE[color]}
        strokeWidth="1.4"
        paintOrder="stroke"
        style={{ fontFamily: FONT }}
      >
        {GLYPH[type] + '︎'}
      </text>
    </svg>
  );
}
