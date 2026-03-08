'use client';

import type { Route } from 'next';
import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import OpeningCard from '@/components/openings/OpeningCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionTitle from '@/components/ui/SectionTitle';
import StatCard from '@/components/ui/StatCard';
import { openingLibrary, type OpeningSide, formatOpeningLine } from '@/data/openings/openings';
import {
  getCompletedOpeningsCount,
  getOpeningProgressEntry,
  getPlayPracticedOpeningsCount,
  getSolvedOpeningStepsCount,
  isOpeningCompleted,
} from '@/lib/openings/openingProgressHelpers';
import { useOpeningsProgress } from '@/lib/openings/useOpeningsProgress';

type OpeningFilter = 'alle' | OpeningSide;

const sideFilters: Array<{ label: string; value: OpeningFilter }> = [
  { label: 'Alle', value: 'alle' },
  { label: 'Hvid', value: 'hvid' },
  { label: 'Sort', value: 'sort' },
];

const totalQuizSteps = openingLibrary.reduce((total, opening) => total + opening.quiz.length, 0);

export default function OpeningsPage() {
  const { progress, hasLoaded } = useOpeningsProgress();
  const [activeFilter, setActiveFilter] = useState<OpeningFilter>('alle');

  const filteredOpenings =
    activeFilter === 'alle'
      ? openingLibrary
      : openingLibrary.filter((opening) => opening.side === activeFilter);

  const completedCount = getCompletedOpeningsCount(progress, openingLibrary);
  const solvedSteps = getSolvedOpeningStepsCount(progress, openingLibrary);
  const practicedCount = getPlayPracticedOpeningsCount(progress, openingLibrary);
  const nextOpening = openingLibrary.find((opening) => !isOpeningCompleted(progress, opening)) ?? openingLibrary[0];
  const nextOpeningHref = `/openings/${nextOpening.slug}` as Route;

  return (
    <main className="shellContainer pageMain">
      <PageHeader
        eyebrow="Åbningstræning"
        title="Lær åbninger med planer og små quizzer"
        description="SkakCoach gør åbninger enkle: du får starterlinje, kerneidéer, typiske fejl og korte quiztrin på dansk."
        actions={
          <>
            <Button href={nextOpeningHref} variant="secondary">
              Start næste åbning
            </Button>
            <Button href="/play" variant="ghost">
              Gå til spillet
            </Button>
          </>
        }
      />

      <div className="openingTopGrid">
        <StatCard accent="gold" label="Åbninger klar" value={openingLibrary.length} hint="Både for hvid og sort." />
        <StatCard
          accent="blue"
          label="Quiztrin løst"
          value={`${solvedSteps}/${totalQuizSteps}`}
          hint="Gemmes lokalt og fortsætter næste gang."
        />
        <StatCard
          accent="green"
          label="Øvet i spil"
          value={hasLoaded ? practicedCount : 'Indlæser'}
          hint="Åbninger du allerede har prøvet mod computeren."
        />
        <StatCard label="Åbninger færdige" value={completedCount} hint="Alle quiztrin løst i åbningen." />
      </div>

      <div className="homeSplitGrid openingOverviewSplit">
        <Card
          badge="Anbefalet næste"
          className="openingNextCard"
          description={nextOpening.shortDescription}
          eyebrow={`Spil som ${nextOpening.side}`}
          title={nextOpening.name}
        >
          <p className="openingLinePreview">{formatOpeningLine(nextOpening.starterMoves)}</p>
          <div className="summaryEmptyActions">
            <Button href={nextOpeningHref} variant="secondary">
              Åbn denne opening
            </Button>
          </div>
        </Card>

        <Card
          badge={completedCount > 0 ? `${completedCount} gennemførte` : 'Klar til første quiz'}
          description="Brug åbningerne som korte læringsmoduler: læs idéerne, se fejlene, og test dig selv på næste træk."
          eyebrow="Sådan bruger du modulet"
          title="Kort, praktisk åbningstræning"
        >
          <ul className="placeholderList">
            <li>Vælg først 1-2 åbninger for hvid og 1-2 for sort.</li>
            <li>Fokuser på idé og brikplacering før du prøver at huske alt.</li>
            <li>Tag åbningen med videre til spil mod computeren bagefter.</li>
          </ul>
        </Card>
      </div>

      <section>
        <SectionTitle
          eyebrow="Åbningsbibliotek"
          title="Vælg et område at lære nu"
          description="Filtrér efter farve, og gå direkte ind i en åbning med plan, fælder at undgå og et lille quizforløb."
        />

        <div className="filterBar" role="group" aria-label="Filtrer åbninger efter side">
          {sideFilters.map((option) => (
            <button
              key={option.value}
              className={`filterChip${activeFilter === option.value ? ' filterChipActive' : ''}`}
              onClick={() => setActiveFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="featureGrid openingGrid">
          {filteredOpenings.map((opening) => {
            const entry = getOpeningProgressEntry(progress, opening.slug);

            return (
              <OpeningCard
                key={opening.slug}
                isCompleted={isOpeningCompleted(progress, opening)}
                lastActivityDate={
                  entry.lastPlayedGameDate && entry.lastPracticedDate
                    ? (entry.lastPlayedGameDate > entry.lastPracticedDate
                        ? entry.lastPlayedGameDate
                        : entry.lastPracticedDate)
                    : entry.lastPlayedGameDate ?? entry.lastPracticedDate
                }
                opening={opening}
                playSessions={entry.playSessions}
                quizSolved={entry.solvedStepIds.length}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
