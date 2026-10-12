import { useEffect, useState } from 'preact/hooks';
import Quiz, { type QuizQuestion, type TermLite } from './Quiz';
import { dueReviews, load } from '../lib/progress';

interface Props {
  quizzes: Record<string, QuizQuestion[]>;
  terms: Record<string, TermLite>;
  lessonBase: string;
}

export default function Review({ quizzes, terms, lessonBase }: Props) {
  const [due, setDue] = useState<string[] | null>(null);
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    setDue(dueReviews());
    setWaiting(Object.keys(load().review).length);
  }, []);

  if (due === null) return <p class="muted">Nalagam …</p>;
  if (due.length === 0)
    return (
      <div class="panel">
        <p><strong>Danes ni ničesar za ponoviti.</strong></p>
        <p class="muted">
          {waiting > 0
            ? `${waiting} vprašanj čaka na kasnejšo ponovitev.`
            : 'Napačno odgovorjena vprašanja se tukaj pojavijo po 1, 3 in 7 dneh.'}
        </p>
      </div>
    );

  const byQuiz = new Map<string, QuizQuestion[]>();
  for (const key of due) {
    const [quizId, qid] = key.split(':');
    const q = quizzes[quizId]?.find((x) => x.id === qid);
    if (q) byQuiz.set(quizId, [...(byQuiz.get(quizId) ?? []), q]);
  }

  return (
    <div>
      <p>Za ponovitev danes: <strong>{due.length}</strong></p>
      {[...byQuiz].map(([quizId, questions]) => (
        <Quiz key={quizId} quizId={quizId} questions={questions} terms={terms} lessonBase={lessonBase} mode="review" />
      ))}
    </div>
  );
}
