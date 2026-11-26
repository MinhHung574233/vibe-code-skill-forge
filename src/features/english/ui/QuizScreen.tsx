import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { cn } from '@/utils/cn';
import { buildQuiz, type QuizQuestion } from '../domain/quiz';
import { WORDS } from '../domain/vocabulary';

const BACK = { to: '/practice/english', label: 'English' };
const QUIZ_LENGTH = 10;

/** A 10-question recognition quiz: practice only, no XP and no change to your review schedule. */
export function QuizScreen() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => buildQuiz(WORDS, QUIZ_LENGTH));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const question = questions[index];
  const finished = index >= questions.length;

  const choose = (option: number) => {
    if (picked !== null || !question) return;
    setPicked(option);
    if (option === question.correct) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  const again = () => {
    setQuestions(buildQuiz(WORDS, QUIZ_LENGTH));
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (finished) {
    return (
      <Screen title="Quiz" back={BACK}>
        <Card>
          <h2 className="type-title-2" role="status">
            {score} of {questions.length} correct
          </h2>
          <p className="mt-1 type-body text-muted">
            Practice only: quizzes do not change your review schedule or earn XP.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={again}>New quiz</Button>
            <Button variant="secondary" onClick={() => void navigate('/practice/english')}>
              Back to English
            </Button>
          </div>
        </Card>
      </Screen>
    );
  }

  if (!question) return <Screen title="Quiz" back={BACK} />;

  return (
    <Screen title="Quiz" back={BACK}>
      <ProgressBar value={index / questions.length} label="Quiz progress" />
      <p className="mt-2 px-1 type-footnote text-muted">
        Question {index + 1} of {questions.length}
      </p>
      <Card className="mt-3">
        <p className="type-subhead text-muted">Which term matches this definition?</p>
        <h2 className="mt-1 type-headline">{question.prompt}</h2>
        <div className="mt-3 space-y-2" role="group" aria-label="Answers">
          {question.options.map((option, i) => {
            const isRight = i === question.correct;
            const isPicked = picked === i;
            return (
              <button
                key={option}
                type="button"
                disabled={picked !== null}
                onClick={() => choose(i)}
                className={cn(
                  'flex min-h-[44px] w-full items-center rounded-xl border px-3 py-2 text-left type-body',
                  picked !== null && isRight
                    ? 'border-success bg-surface'
                    : isPicked
                      ? 'border-danger bg-surface'
                      : 'border-border bg-surface',
                )}
              >
                <span className="min-w-0 flex-1 break-words">{option}</span>
                {picked !== null && isRight && (
                  <span className="ml-2 type-footnote font-medium text-success">Correct</span>
                )}
                {isPicked && !isRight && (
                  <span className="ml-2 type-footnote font-medium text-danger">Not this one</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>
      {picked !== null && (
        <div className="mt-4">
          <Button fullWidth onClick={next}>
            {index + 1 === questions.length ? 'See result' : 'Next question'}
          </Button>
        </div>
      )}
    </Screen>
  );
}
