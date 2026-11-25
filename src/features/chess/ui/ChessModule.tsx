import { Navigate, Route, Routes } from 'react-router';
import { ChessHome } from './ChessHome';
import { OpeningDrillRoute, OpeningsList } from './OpeningsScreen';
import { PlayScreen } from './PlayScreen';
import { PuzzlesScreen } from './PuzzlesScreen';
import { CHESS_BASE } from './useChess';

/**
 * The Chess module. Mounted by the app router at `practice/chess/*`; every path below is
 * relative to that mount point.
 */
export function ChessModule() {
  return (
    <Routes>
      <Route index element={<ChessHome />} />
      <Route path="puzzles" element={<PuzzlesScreen />} />
      <Route path="play" element={<PlayScreen />} />
      <Route path="openings" element={<OpeningsList />} />
      <Route path="openings/:openingId" element={<OpeningDrillRoute />} />
      <Route path="*" element={<Navigate to={CHESS_BASE} replace />} />
    </Routes>
  );
}
