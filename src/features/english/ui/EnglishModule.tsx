import { Route, Routes } from 'react-router';
import { EnglishHome } from './EnglishHome';
import { ReviewScreen } from './ReviewScreen';
import { WordsScreen } from './WordsScreen';

/** Module root, mounted at `practice/english/*`. */
export function EnglishModule() {
  return (
    <Routes>
      <Route index element={<EnglishHome />} />
      <Route path="review" element={<ReviewScreen />} />
      <Route path="words" element={<WordsScreen />} />
    </Routes>
  );
}
