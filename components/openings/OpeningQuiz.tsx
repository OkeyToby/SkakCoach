'use client';

import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import PuzzleFeedback from '@/components/tactics/PuzzleFeedback';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { type Opening, formatOpeningLine } from '@/data/openings/openings';
import {
  getOpeningProgressEntry,
  recordOpeningQuizAnswer,
} from '@/lib/openings/openingProgressHelpers';
import { updateOpeningsProgress } from '@/lib/openings/openingProgressStorage';

type Props = {
  opening: Opening;
  solvedStepIds: string[];
  attempts: number;
  hasLoaded: boolean;
};

type FeedbackState = {
  variant: 'neutral' | 'korrekt' | 'forkert';
  title: string;
  description: string;
  detail: string;
};

function getNextStepIndex(opening: Opening, solvedStepIds: string[]): number {
  const nextIndex = opening.quiz.findIndex((step) => !solvedStepIds.includes(step.id));
  return nextIndex === -1 ? 0 : nextIndex;
}

function createNeutralFeedback(
  opening: Opening,
  stepIndex: number,
  isFinished: boolean,
): FeedbackState {
  if (isFinished) {
    return {
      variant: 'neutral',
      title: 'Quizzen er gennemført',
      description: 'Du har allerede løst alle quiztrin i denne åbning. Start igen, hvis du vil genopfriske idéerne.',
      detail: `Starterline: ${formatOpeningLine(opening.starterMoves)}`,
    };
  }

  return {
    variant: 'neutral',
    title: `Spørgsmål ${stepIndex + 1} af ${opening.quiz.length}`,
    description: opening.quiz[stepIndex].prompt,
    detail: 'Spil det næste korrekte træk på brættet. Fokusér på idéen bag trækket, ikke kun udenadslære.',
  };
}

export default function OpeningQuiz({ opening, solvedStepIds, attempts, hasLoaded }: Props) {
  const completed = solvedStepIds.length >= opening.quiz.length;
  const initialIndex = getNextStepIndex(opening, solvedStepIds);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [boardFen, setBoardFen] = useState(opening.quiz[initialIndex].fen);
  const [feedback, setFeedback] = useState<FeedbackState>(
    createNeutralFeedback(opening, initialIndex, completed),
  );
  const [isLocked, setIsLocked] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [attemptsThisStep, setAttemptsThisStep] = useState(0);
  const syncedSlugRef = useRef(opening.slug);
  const hasSyncedLoadedStateRef = useRef(false);

  useEffect(() => {
    if (syncedSlugRef.current !== opening.slug) {
      syncedSlugRef.current = opening.slug;
      hasSyncedLoadedStateRef.current = false;
    }

    if (!hasLoaded || hasSyncedLoadedStateRef.current) {
      return;
    }

    const nextIndex = getNextStepIndex(opening, solvedStepIds);
    setCurrentIndex(nextIndex);
    setBoardFen(opening.quiz[nextIndex].fen);
    setFeedback(createNeutralFeedback(opening, nextIndex, solvedStepIds.length >= opening.quiz.length));
    setIsLocked(false);
    setIsReviewMode(false);
    setAttemptsThisStep(0);
    setSessionCorrect(0);
    hasSyncedLoadedStateRef.current = true;
  }, [hasLoaded, opening, solvedStepIds]);

  const currentStep = opening.quiz[currentIndex];
  const quizFinished = completed && !isReviewMode;

  function loadStep(index: number, reviewMode = isReviewMode) {
    setCurrentIndex(index);
    setBoardFen(opening.quiz[index].fen);
    setFeedback(createNeutralFeedback(opening, index, completed && !reviewMode));
    setIsLocked(false);
    setAttemptsThisStep(0);
  }

  function handleNextStep() {
    if (isReviewMode) {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= opening.quiz.length) {
        setIsReviewMode(false);
        setFeedback({
          variant: 'korrekt',
          title: 'Genopfriskningen er færdig',
          description: 'Du har spillet hele quizzen igennem igen. Det er en god måde at få mønstrene til at sidde bedre fast.',
          detail: `Du gik igennem alle ${opening.quiz.length} quiztrin i denne omgang.`,
        });
        setIsLocked(true);
        return;
      }

      loadStep(nextIndex, true);
      return;
    }

    const solvedSet = new Set(solvedStepIds);
    if (isLocked) {
      solvedSet.add(currentStep.id);
    }

    const nextIndex = opening.quiz.findIndex((step) => !solvedSet.has(step.id));
    if (nextIndex === -1) {
      setFeedback({
        variant: 'korrekt',
        title: 'Åbningen sidder bedre nu',
        description: 'Du har været hele vejen gennem quizzen. Brug gerne åbningen igen en anden dag, så mønstrene sætter sig.',
        detail: `Du har løst ${solvedSet.size}/${opening.quiz.length} quiztrin i denne opening.`,
      });
      setIsLocked(true);
      return;
    }

    loadStep(nextIndex);
  }

  function handleRestartQuiz() {
    setIsReviewMode(true);
    loadStep(0, true);
  }

  function handleMove(from: string, to: string) {
    if (quizFinished || isLocked) {
      return false;
    }

    const chess = new Chess(currentStep.fen);
    let appliedMove = null;

    try {
      appliedMove = chess.move({ from, to, promotion: 'q' });
    } catch {
      appliedMove = null;
    }

    if (!appliedMove) {
      return false;
    }

    const moveUci = `${from}${to}`;
    const isCorrectMove =
      moveUci === currentStep.answerUci || `${moveUci}q` === currentStep.answerUci;

    setAttemptsThisStep((current) => current + 1);

    if (isCorrectMove) {
      setBoardFen(chess.fen());
      setIsLocked(true);
      setSessionCorrect((current) => current + 1);

      const nextProgress = updateOpeningsProgress((progress) =>
        recordOpeningQuizAnswer(progress, opening.slug, currentStep.id, true),
      );
      const updatedEntry = getOpeningProgressEntry(nextProgress, opening.slug);
      const hasCompletedOpening = updatedEntry.solvedStepIds.length >= opening.quiz.length;

      setFeedback({
        variant: 'korrekt',
        title: hasCompletedOpening ? 'Hele åbningen er gennemført' : 'Korrekt!',
        description: currentStep.explanation,
        detail: hasCompletedOpening
          ? 'Alle quiztrin for denne åbning er nu gemt lokalt som løst.'
          : 'Quiztrinnet er gemt lokalt. Gå videre til næste position, mens idéen stadig er frisk.',
      });
      return true;
    }

    updateOpeningsProgress((progress) =>
      recordOpeningQuizAnswer(progress, opening.slug, currentStep.id, false),
    );
    setBoardFen(currentStep.fen);
    setFeedback({
      variant: 'forkert',
      title: 'Forkert',
      description: `Det rigtige træk var ${currentStep.answerSan}. ${currentStep.explanation}`,
      detail: 'Se på plan og feltvalg én gang mere, og prøv så igen på samme stilling.',
    });
    return false;
  }

  return (
    <section className="openingQuizSection">
      <div className="openingQuizHeader">
        <div>
          <span className="sectionEyebrow">Quizmode</span>
          <h2>Træn næste træk i åbningen</h2>
          <p className="sectionDescription">
            Hver stilling spørger om det næste naturlige træk i åbningen. Fokus er på enkel planforståelse, ikke
            tung teori.
          </p>
        </div>
      </div>

      <div className="openingQuizStats">
        <StatCard
          accent="gold"
          label="Løste quiztrin"
          value={`${solvedStepIds.length}/${opening.quiz.length}`}
          hint="Gemmes lokalt for denne åbning."
        />
        <StatCard
          accent="blue"
          label="Forsøg i alt"
          value={attempts}
          hint="Alle forsøg på tværs af dine sessioner."
        />
        <StatCard
          accent="green"
          label="Korrekte nu"
          value={sessionCorrect}
          hint="Kun i den aktuelle session."
        />
      </div>

      <div className="openingQuizLayout">
        <div className="surfaceCard puzzleBoardCard openingQuizBoard">
          <div className="puzzleBoardHeader">
            <div>
              <span className="cardEyebrow">Åbningsposition</span>
              <h3 className="cardTitle">
                {quizFinished ? 'Quiz færdig' : `Spørgsmål ${currentIndex + 1} af ${opening.quiz.length}`}
              </h3>
            </div>
            <span className="cardBadge">
              {opening.side === 'hvid' ? 'Hvid-perspektiv' : 'Sort-perspektiv'}
            </span>
          </div>

          <p className="cardDescription">
            {quizFinished ? 'Start quizzen igen, hvis du vil genopfriske mønstrene.' : currentStep.prompt}
          </p>

          <ChessBoard
            boardOrientation={opening.side === 'sort' ? 'black' : 'white'}
            disabled={quizFinished || isLocked}
            onMove={handleMove}
            position={boardFen}
          />
        </div>

        <div className="tacticsSide">
          <Card
            badge={quizFinished ? 'Gennemført' : `Forsøg i dette trin: ${attemptsThisStep}`}
            description={
              currentStep.beforeMoves.length > 0
                ? `Ind i positionen via: ${formatOpeningLine(currentStep.beforeMoves)}`
                : 'Startstillingen er udgangspunktet for dette spørgsmål.'
            }
            title="Kontekst før trækket"
          />

          <PuzzleFeedback
            description={feedback.description}
            detail={feedback.detail}
            title={feedback.title}
            variant={feedback.variant}
          >
            {feedback.variant === 'forkert' && !quizFinished ? (
              <Button onClick={() => loadStep(currentIndex, isReviewMode)} type="button" variant="secondary">
                Prøv igen
              </Button>
            ) : null}
            {quizFinished ? (
              <Button onClick={handleRestartQuiz} type="button" variant="secondary">
                Træn igen fra start
              </Button>
            ) : null}
            {isLocked && !quizFinished ? (
              <Button onClick={handleNextStep} type="button" variant="primary">
                Næste spørgsmål
              </Button>
            ) : null}
          </PuzzleFeedback>

          <Card badge="Husk dette" title="Sådan får du mere ud af åbningstræningen">
            <ul className="placeholderList">
              <li>Sig planen højt for dig selv, før du trækker.</li>
              <li>Brug åbningen til at forstå felter og idéer, ikke kun rækkefølge.</li>
              <li>Gå tilbage til spillet bagefter og prøv stillingen mod computeren.</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}
