import type { Opening } from '@/data/openings/openings';
import { getLocalDateKey } from '@/lib/profile/profileHelpers';
import type { OpeningProgressEntry, OpeningsProgressState } from './openingProgressTypes';

export const defaultOpeningProgressEntry: OpeningProgressEntry = {
  viewed: false,
  solvedStepIds: [],
  attempts: 0,
  correctAnswers: 0,
  lastPracticedDate: null,
  playSessions: 0,
  lastPlayedGameDate: null,
};

export const defaultOpeningsProgress: OpeningsProgressState = {
  openings: {},
};

function normalizeStepIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)),
  );
}

export function normalizeOpeningProgressEntry(
  entry: Partial<OpeningProgressEntry> | null | undefined,
): OpeningProgressEntry {
  const merged = {
    ...defaultOpeningProgressEntry,
    ...entry,
  };

  return {
    viewed: Boolean(merged.viewed),
    solvedStepIds: normalizeStepIds(merged.solvedStepIds),
    attempts: Math.max(0, Number.isFinite(merged.attempts) ? merged.attempts : 0),
    correctAnswers: Math.max(0, Number.isFinite(merged.correctAnswers) ? merged.correctAnswers : 0),
    lastPracticedDate: typeof merged.lastPracticedDate === 'string' ? merged.lastPracticedDate : null,
    playSessions: Math.max(0, Number.isFinite(merged.playSessions) ? merged.playSessions : 0),
    lastPlayedGameDate: typeof merged.lastPlayedGameDate === 'string' ? merged.lastPlayedGameDate : null,
  };
}

export function normalizeOpeningsProgress(
  progress: Partial<OpeningsProgressState> | null | undefined,
): OpeningsProgressState {
  const openings = progress?.openings;

  if (!openings || typeof openings !== 'object') {
    return defaultOpeningsProgress;
  }

  return {
    openings: Object.fromEntries(
      Object.entries(openings).map(([slug, entry]) => [slug, normalizeOpeningProgressEntry(entry)]),
    ),
  };
}

export function getOpeningProgressEntry(
  progress: OpeningsProgressState,
  slug: string,
): OpeningProgressEntry {
  return normalizeOpeningProgressEntry(progress.openings[slug]);
}

export function markOpeningViewed(progress: OpeningsProgressState, slug: string): OpeningsProgressState {
  const currentEntry = getOpeningProgressEntry(progress, slug);

  return normalizeOpeningsProgress({
    openings: {
      ...progress.openings,
      [slug]: {
        ...currentEntry,
        viewed: true,
      },
    },
  });
}

export function recordOpeningQuizAnswer(
  progress: OpeningsProgressState,
  slug: string,
  stepId: string,
  isCorrect: boolean,
  now = new Date(),
): OpeningsProgressState {
  const currentEntry = getOpeningProgressEntry(progress, slug);

  return normalizeOpeningsProgress({
    openings: {
      ...progress.openings,
      [slug]: {
        ...currentEntry,
        viewed: true,
        attempts: currentEntry.attempts + 1,
        correctAnswers: currentEntry.correctAnswers + (isCorrect ? 1 : 0),
        solvedStepIds: isCorrect
          ? Array.from(new Set([...currentEntry.solvedStepIds, stepId]))
          : currentEntry.solvedStepIds,
        lastPracticedDate: getLocalDateKey(now),
      },
    },
  });
}

export function recordOpeningPlaySession(
  progress: OpeningsProgressState,
  slug: string,
  now = new Date(),
): OpeningsProgressState {
  const currentEntry = getOpeningProgressEntry(progress, slug);

  return normalizeOpeningsProgress({
    openings: {
      ...progress.openings,
      [slug]: {
        ...currentEntry,
        viewed: true,
        playSessions: currentEntry.playSessions + 1,
        lastPlayedGameDate: getLocalDateKey(now),
      },
    },
  });
}

export function isOpeningCompleted(progress: OpeningsProgressState, opening: Opening): boolean {
  return getOpeningProgressEntry(progress, opening.slug).solvedStepIds.length >= opening.quiz.length;
}

export function getCompletedOpeningsCount(
  progress: OpeningsProgressState,
  openings: Opening[],
): number {
  return openings.filter((opening) => isOpeningCompleted(progress, opening)).length;
}

export function getViewedOpeningsCount(progress: OpeningsProgressState, openings: Opening[]): number {
  return openings.filter((opening) => getOpeningProgressEntry(progress, opening.slug).viewed).length;
}

export function getSolvedOpeningStepsCount(progress: OpeningsProgressState, openings: Opening[]): number {
  return openings.reduce((total, opening) => {
    return total + getOpeningProgressEntry(progress, opening.slug).solvedStepIds.length;
  }, 0);
}

export function getPlayPracticedOpeningsCount(
  progress: OpeningsProgressState,
  openings: Opening[],
): number {
  return openings.filter((opening) => getOpeningProgressEntry(progress, opening.slug).playSessions > 0).length;
}
