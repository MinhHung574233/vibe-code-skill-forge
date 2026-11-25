import { Route, Routes } from 'react-router';
import { AlgorithmsScreen } from './AlgorithmsScreen';
import { RubikHome } from './RubikHome';
import { SolveHistory } from './SolveHistory';

/** Module root, mounted at `practice/rubik/*`. */
export function RubikModule() {
  return (
    <Routes>
      <Route index element={<RubikHome />} />
      <Route path="solves" element={<SolveHistory />} />
      <Route path="algorithms" element={<AlgorithmsScreen />} />
    </Routes>
  );
}
