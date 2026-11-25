import { Navigate, Route, Routes } from 'react-router';
import { CaroHome } from './CaroHome';
import { CaroPlay } from './CaroPlay';
import { CARO_HOME } from './labels';

/**
 * The Caro module root. Mounted by the app at `practice/caro/*`; the routes below are relative to
 * that mount point.
 */
export function CaroModule() {
  return (
    <Routes>
      <Route index element={<CaroHome />} />
      <Route path="play" element={<CaroPlay />} />
      <Route path="*" element={<Navigate to={CARO_HOME} replace />} />
    </Routes>
  );
}
