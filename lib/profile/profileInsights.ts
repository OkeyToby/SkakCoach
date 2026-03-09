import { openingLibrary } from '@/data/openings/openings';
import {
  getCompletedOpeningsCount,
  getOpeningProgressEntry,
  getPlayPracticedOpeningsCount,
  getSolvedOpeningStepsCount,
  getViewedOpeningsCount,
  isOpeningCompleted,
} from '@/lib/openings/openingProgressHelpers';
import type { OpeningsProgressState } from '@/lib/openings/openingProgressTypes';
import {
  getXpIntoCurrentLevel,
  getXpToNextLevel,
  hasRealProgress,
} from './profileHelpers';
import type { PlayerProfile } from './profileTypes';

export type ProfileInsightTone = 'positive' | 'focus' | 'neutral';

export type ProfileInsightCard = {
  badge: string;
  description: string;
  title: string;
  tone: ProfileInsightTone;
};

export type ProfileBadgeCard = {
  badgeText: string;
  description: string;
  id: string;
  progressLabel: string;
  progressPercent: number;
  title: string;
  unlocked: boolean;
};

export type ProfileRecommendationCard = {
  badge: string;
  cta: string;
  description: string;
  href: string;
  id: string;
  title: string;
};

export type ProfileInsightsResult = {
  badges: ProfileBadgeCard[];
  completedOpeningsCount: number;
  favoriteOpeningName: string | null;
  favoriteOpeningSummary: string;
  hasProgress: boolean;
  lastTrainingLabel: string;
  losses: number;
  openingAccuracyLabel: string;
  openingPlaySessions: number;
  practicedOpeningsCount: number;
  progressPercentage: number;
  recommendations: ProfileRecommendationCard[];
  solvedOpeningSteps: number;
  strengths: ProfileInsightCard[];
  totalOpenings: number;
  trainingDescription: string;
  trainingHeadline: string;
  viewedOpeningsCount: number;
  weaknesses: ProfileInsightCard[];
  winRateLabel: string;
  winRateValue: number | null;
  xpInLevel: number;
  xpRemaining: number;
  xpToNextLevel: number;
};

type OpeningActivity = {
  correctAnswers: number;
  name: string;
  playSessions: number;
  score: number;
  solvedSteps: number;
  viewed: boolean;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatProgress(current: number, target: number): string {
  return `${Math.min(current, target)}/${target}`;
}

export function formatProfileDateLabel(dateKey: string | null): string {
  if (!dateKey) {
    return 'Ingen træning endnu';
  }

  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}.${year}`;
}

function getOpeningActivities(progress: OpeningsProgressState): OpeningActivity[] {
  return openingLibrary.map((opening) => {
    const entry = getOpeningProgressEntry(progress, opening.slug);
    const score =
      entry.playSessions * 4 +
      entry.solvedStepIds.length * 3 +
      entry.correctAnswers * 2 +
      entry.attempts +
      (entry.viewed ? 1 : 0);

    return {
      name: opening.name,
      correctAnswers: entry.correctAnswers,
      playSessions: entry.playSessions,
      score,
      solvedSteps: entry.solvedStepIds.length,
      viewed: entry.viewed,
    };
  });
}

function getFavoriteOpening(progress: OpeningsProgressState): OpeningActivity | null {
  const activities = getOpeningActivities(progress)
    .filter((activity) => activity.score > 0)
    .sort((left, right) => right.score - left.score);

  return activities[0] ?? null;
}

function buildTrainingHeadline(
  profile: PlayerProfile,
  hasProgress: boolean,
  practicedOpeningsCount: number,
  favoriteOpening: OpeningActivity | null,
): { title: string; description: string } {
  if (!hasProgress) {
    return {
      title: 'Din profil er klar til første træningspas',
      description:
        'Så snart du spiller et parti, løser en opgave eller åbner en opening, begynder SkakCoach at tegne et billede af din træning.',
    };
  }

  if (profile.streak >= 3) {
    return {
      title: 'Du træner stabilt',
      description: `En streak på ${profile.streak} dage giver momentum. Det er ofte den hurtigste vej til synlig fremgang.`,
    };
  }

  if (practicedOpeningsCount >= 2) {
    return {
      title: 'Du spiller mange åbningspartier',
      description:
        favoriteOpening && favoriteOpening.playSessions > 0
          ? `${favoriteOpening.name} ser ud til at være din mest brugte ramme lige nu.`
          : 'Du tager åbningerne med over i rigtige partier, og det gør træningen mere konkret.',
    };
  }

  if (profile.puzzlesSolved >= Math.max(4, profile.gamesPlayed + 1)) {
    return {
      title: 'Taktik fylder meget i din træning',
      description:
        'Det er en god måde at bygge skarphed på. Næste skridt er at tage noget af den skarphed med ind i dine partier.',
    };
  }

  if (profile.gamesPlayed >= Math.max(3, profile.puzzlesSolved + 1)) {
    return {
      title: 'Du bygger dig gennem rigtige partier',
      description:
        'Du får praktisk erfaring på brættet. Et lille taktisk supplement kan gøre partierne endnu mere læringsrige.',
    };
  }

  return {
    title: 'Du bygger en bred base',
    description:
      'Du fordeler træningen på flere områder. Det giver en god platform at bygge videre på, når du vælger et tydeligere fokus.',
  };
}

function buildStrengths(
  profile: PlayerProfile,
  hasProgress: boolean,
  practicedOpeningsCount: number,
  favoriteOpening: OpeningActivity | null,
  winRateValue: number | null,
): ProfileInsightCard[] {
  const strengths: ProfileInsightCard[] = [];

  const addStrength = (card: ProfileInsightCard) => {
    if (strengths.length < 3 && !strengths.some((entry) => entry.title === card.title)) {
      strengths.push(card);
    }
  };

  if (!hasProgress) {
    addStrength({
      badge: 'Klar',
      description:
        'Profilen er sat op og klar til at begynde at samle dine mønstre, så snart du træner første gang.',
      title: 'Du er klar til at komme i gang',
      tone: 'neutral',
    });
    return strengths;
  }

  if (profile.streak >= 3) {
    addStrength({
      badge: `${profile.streak} dage`,
      description:
        'Du vender tilbage ofte nok til, at træningen begynder at hænge sammen fra session til session.',
      title: 'Du træner stabilt',
      tone: 'positive',
    });
  }

  if (winRateValue !== null && profile.gamesPlayed >= 3 && winRateValue >= 50) {
    addStrength({
      badge: `${winRateValue}%`,
      description:
        'Du omsætter allerede noget af træningen til resultater i partierne, hvilket er et sundt tegn.',
      title: 'Du får point ud af partierne',
      tone: 'positive',
    });
  }

  if (profile.puzzlesSolved >= 5) {
    addStrength({
      badge: `${profile.puzzlesSolved} løst`,
      description:
        'Du holder den taktiske skarphed i gang, og det giver ofte hurtige gevinster i rigtige partier.',
      title: 'Du holder taktikken varm',
      tone: 'positive',
    });
  }

  if (practicedOpeningsCount >= 1) {
    addStrength({
      badge: `${practicedOpeningsCount} openings`,
      description:
        favoriteOpening
          ? `Du har allerede taget ${favoriteOpening.name} med over i praksis. Det gør åbningstræningen langt mere værdifuld.`
          : 'Du tager åbningsidéerne med ind i partier, ikke kun i læsedelen.',
      title: 'Du gør åbningerne praktiske',
      tone: 'positive',
    });
  }

  if (favoriteOpening && favoriteOpening.solvedSteps >= 1) {
    addStrength({
      badge: favoriteOpening.name,
      description:
        'Du er begyndt at bygge en tydelig referenceåbning, som kan gøre dine første træk mere sikre.',
      title: 'Du har en klar åbningstråd',
      tone: 'positive',
    });
  }

  if (strengths.length === 0) {
    addStrength({
      badge: `${profile.xp} XP`,
      description:
        'Du har allerede sat de første spor i profilen. Det vigtigste nu er at fortsætte, så mønstrene bliver tydeligere.',
      title: 'Du er godt i gang',
      tone: 'neutral',
    });
  }

  return strengths;
}

function buildWeaknesses(
  profile: PlayerProfile,
  hasProgress: boolean,
  viewedOpeningsCount: number,
  practicedOpeningsCount: number,
  completedOpeningsCount: number,
  solvedOpeningSteps: number,
  winRateValue: number | null,
): ProfileInsightCard[] {
  const weaknesses: ProfileInsightCard[] = [];

  const addWeakness = (card: ProfileInsightCard) => {
    if (weaknesses.length < 3 && !weaknesses.some((entry) => entry.title === card.title)) {
      weaknesses.push(card);
    }
  };

  if (!hasProgress) {
    addWeakness({
      badge: 'Første skridt',
      description:
        'Spil ét parti eller løs nogle få opgaver. Først dér bliver profilen skarp nok til at pege på et reelt fokusområde.',
      title: 'Du mangler endnu det første datapunkt',
      tone: 'focus',
    });
    return weaknesses;
  }

  if (profile.gamesPlayed >= 2 && profile.puzzlesSolved < 3) {
    addWeakness({
      badge: 'Taktik',
      description:
        'Du har spillet partier nok til at få gavn af lidt ekstra taktisk træning mellem dem.',
      title: 'Taktik er et godt næste fokus',
      tone: 'focus',
    });
  }

  if (winRateValue !== null && profile.gamesPlayed >= 4 && winRateValue < 45) {
    addWeakness({
      badge: `${winRateValue}%`,
      description:
        'Partierne bliver hårde lige nu. Enklere planer efter åbningen og bedre taktisk kontrol vil sandsynligvis give mest igen.',
      title: 'Partierne kan gøres mere stabile',
      tone: 'focus',
    });
  }

  if (viewedOpeningsCount > 0 && practicedOpeningsCount === 0) {
    addWeakness({
      badge: 'Åbninger',
      description:
        'Du har kigget på åbningerne, men endnu ikke taget dem med ind i et rigtigt parti mod computeren.',
      title: 'Åbningsidéerne mangler praktik',
      tone: 'focus',
    });
  }

  if (practicedOpeningsCount > 0 && completedOpeningsCount === 0 && solvedOpeningSteps > 0) {
    addWeakness({
      badge: 'Quiz',
      description:
        'Du er begyndt på åbningerne, men har endnu ikke lukket én helt. En gennemført opening giver mere ro i de første træk.',
      title: 'Gør mindst én opening helt færdig',
      tone: 'focus',
    });
  }

  if (profile.streak > 0 && profile.streak < 3) {
    addWeakness({
      badge: `${profile.streak} dag${profile.streak === 1 ? '' : 'e'}`,
      description:
        'Du er i gang, men lidt mere regelmæssighed vil gøre det lettere at mærke fremgang fra uge til uge.',
      title: 'Mere rytme vil løfte dig',
      tone: 'focus',
    });
  }

  if (weaknesses.length === 0) {
    addWeakness({
      badge: 'Balance',
      description:
        'Der er ikke ét stort rødt flag lige nu. Det næste niveau kommer mest fra at holde balancen mellem partier, taktik og openings.',
      title: 'Ingen tydelig svaghed skiller sig ud',
      tone: 'neutral',
    });
  }

  return weaknesses;
}

function buildBadgeCards(
  profile: PlayerProfile,
  viewedOpeningsCount: number,
  practicedOpeningsCount: number,
  completedOpeningsCount: number,
): ProfileBadgeCard[] {
  const definitions = [
    {
      id: 'first-win',
      title: 'Første sejr',
      description: 'Vind dit første parti mod computeren.',
      current: profile.gamesWon,
      target: 1,
    },
    {
      id: 'five-games',
      title: '5 partier spillet',
      description: 'Afslut fem partier for at få et mere retvisende billede af dit spil.',
      current: profile.gamesPlayed,
      target: 5,
    },
    {
      id: 'ten-puzzles',
      title: '10 opgaver løst',
      description: 'Byg taktisk skarphed med ti korrekte opgaver.',
      current: profile.puzzlesSolved,
      target: 10,
    },
    {
      id: 'opening-curious',
      title: 'Åbningsnysgerrig',
      description: 'Åbn eller brug to forskellige åbninger i træningen.',
      current: Math.max(viewedOpeningsCount, practicedOpeningsCount),
      target: 2,
    },
    {
      id: 'streak-3',
      title: '3 dages streak',
      description: 'Træn tre dage i træk og mærk rytmen bygge sig op.',
      current: profile.streak,
      target: 3,
    },
    {
      id: 'first-opening-finished',
      title: 'Første opening færdig',
      description: 'Gennemfør en opening ved at løse alle dens quiztrin.',
      current: completedOpeningsCount,
      target: 1,
    },
  ];

  return definitions.map((definition) => {
    const unlocked = definition.current >= definition.target;
    return {
      badgeText: unlocked ? 'Låst op' : 'På vej',
      description: definition.description,
      id: definition.id,
      progressLabel: unlocked ? 'Færdig' : formatProgress(definition.current, definition.target),
      progressPercent: clampPercent((definition.current / definition.target) * 100),
      title: definition.title,
      unlocked,
    };
  });
}

export function buildProfileInsights(
  profile: PlayerProfile,
  openingsProgress: OpeningsProgressState,
): ProfileInsightsResult {
  const hasProgress = hasRealProgress(profile);
  const xpInLevel = getXpIntoCurrentLevel(profile);
  const xpToNextLevel = getXpToNextLevel();
  const xpRemaining = Math.max(0, xpToNextLevel - xpInLevel);
  const progressPercentage = clampPercent((xpInLevel / xpToNextLevel) * 100);
  const losses = Math.max(0, profile.gamesPlayed - profile.gamesWon);
  const winRateValue =
    profile.gamesPlayed > 0 ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : null;
  const winRateLabel = winRateValue === null ? 'Ingen data endnu' : `${winRateValue}%`;
  const lastTrainingLabel = formatProfileDateLabel(profile.lastPlayedDate);

  const viewedOpeningsCount = getViewedOpeningsCount(openingsProgress, openingLibrary);
  const practicedOpeningsCount = getPlayPracticedOpeningsCount(openingsProgress, openingLibrary);
  const completedOpeningsCount = getCompletedOpeningsCount(openingsProgress, openingLibrary);
  const solvedOpeningSteps = getSolvedOpeningStepsCount(openingsProgress, openingLibrary);
  const openingPlaySessions = openingLibrary.reduce((total, opening) => {
    return total + getOpeningProgressEntry(openingsProgress, opening.slug).playSessions;
  }, 0);
  const openingAttempts = openingLibrary.reduce((total, opening) => {
    return total + getOpeningProgressEntry(openingsProgress, opening.slug).attempts;
  }, 0);
  const openingCorrectAnswers = openingLibrary.reduce((total, opening) => {
    return total + getOpeningProgressEntry(openingsProgress, opening.slug).correctAnswers;
  }, 0);
  const openingAccuracyLabel =
    openingAttempts > 0
      ? `${Math.round((openingCorrectAnswers / openingAttempts) * 100)}% rigtige`
      : 'Ingen quizdata endnu';

  const favoriteOpening = getFavoriteOpening(openingsProgress);
  const favoriteOpeningName = favoriteOpening?.name ?? null;
  const favoriteOpeningSummary = favoriteOpening
    ? `${favoriteOpening.name} er dit tydeligste spor lige nu.`
    : 'Ingen opening skiller sig ud endnu.';

  const trainingHeadline = buildTrainingHeadline(
    profile,
    hasProgress,
    practicedOpeningsCount,
    favoriteOpening,
  );

  return {
    badges: buildBadgeCards(
      profile,
      viewedOpeningsCount,
      practicedOpeningsCount,
      completedOpeningsCount,
    ),
    completedOpeningsCount,
    favoriteOpeningName,
    favoriteOpeningSummary,
    hasProgress,
    lastTrainingLabel,
    losses,
    openingAccuracyLabel,
    openingPlaySessions,
    practicedOpeningsCount,
    progressPercentage,
    recommendations: buildProfileRecommendations(
      profile,
      hasProgress,
      openingsProgress,
      viewedOpeningsCount,
      practicedOpeningsCount,
      completedOpeningsCount,
    ),
    solvedOpeningSteps,
    strengths: buildStrengths(
      profile,
      hasProgress,
      practicedOpeningsCount,
      favoriteOpening,
      winRateValue,
    ),
    totalOpenings: openingLibrary.length,
    trainingDescription: trainingHeadline.description,
    trainingHeadline: trainingHeadline.title,
    viewedOpeningsCount,
    weaknesses: buildWeaknesses(
      profile,
      hasProgress,
      viewedOpeningsCount,
      practicedOpeningsCount,
      completedOpeningsCount,
      solvedOpeningSteps,
      winRateValue,
    ),
    winRateLabel,
    winRateValue,
    xpInLevel,
    xpRemaining,
    xpToNextLevel,
  };
}

function buildProfileRecommendations(
  profile: PlayerProfile,
  hasProgress: boolean,
  openingsProgress: OpeningsProgressState,
  viewedOpeningsCount: number,
  practicedOpeningsCount: number,
  completedOpeningsCount: number,
): ProfileRecommendationCard[] {
  const recommendations: ProfileRecommendationCard[] = [];
  const unseenOpening =
    openingLibrary.find((opening) => !getOpeningProgressEntry(openingsProgress, opening.slug).viewed) ??
    openingLibrary[0];
  const nextIncompleteOpening =
    openingLibrary.find((opening) => !isOpeningCompleted(openingsProgress, opening)) ??
    openingLibrary[0];

  const addRecommendation = (card: ProfileRecommendationCard) => {
    if (!recommendations.some((entry) => entry.id === card.id) && recommendations.length < 3) {
      recommendations.push(card);
    }
  };

  if (!hasProgress || profile.gamesPlayed < 3) {
    addRecommendation({
      badge: 'Parti',
      cta: 'Spil et parti',
      description:
        profile.gamesPlayed === 0
          ? 'Et rigtigt parti giver dig straks mere brugbar profil-data end næsten alt andet.'
          : 'Et ekstra parti vil gøre dit overblik over sejr, form og coach-review mere retvisende.',
      href: '/play',
      id: 'play-game',
      title: 'Spil 1 parti mod computeren',
    });
  }

  if (profile.puzzlesSolved < Math.max(3, Math.ceil(profile.gamesPlayed / 2))) {
    addRecommendation({
      badge: 'Taktik',
      cta: 'Løs opgaver',
      description:
        'Et lille taktisk pas er den hurtigste måde at give dine næste partier mere skarphed.',
      href: '/tactics',
      id: 'solve-puzzles',
      title: 'Løs 3 taktiske opgaver',
    });
  }

  if (viewedOpeningsCount === 0 || practicedOpeningsCount === 0) {
    addRecommendation({
      badge: 'Åbning',
      cta: 'Åbn modulet',
      description:
        viewedOpeningsCount === 0
          ? 'Vælg en opening og få en enkel plan til de første træk.'
          : 'Du har kigget på openings. Nu er næste skridt at prøve én i et rigtigt parti.',
      href: `/openings/${unseenOpening.slug}`,
      id: 'open-first-opening',
      title:
        viewedOpeningsCount === 0
          ? 'Øv en opening du ikke har brugt endnu'
          : 'Tag en opening med ind i spillet',
    });
  } else if (completedOpeningsCount < 1) {
    addRecommendation({
      badge: 'Åbning',
      cta: 'Fortsæt opening',
      description:
        'Du er allerede i gang. Gør én opening helt færdig, så den sidder bedre under pres.',
      href: `/openings/${nextIncompleteOpening.slug}`,
      id: 'finish-opening',
      title: 'Gør én opening helt færdig',
    });
  }

  if (profile.streak < 3 && hasProgress) {
    addRecommendation({
      badge: 'Streak',
      cta: 'Hold rytmen',
      description:
        'En kort session i dag eller i morgen er nok til at gøre din træning mere sammenhængende.',
      href: profile.puzzlesSolved <= profile.gamesPlayed ? '/tactics' : '/play',
      id: 'keep-streak',
      title: 'Hold din træningsrytme i live',
    });
  }

  addRecommendation({
    badge: 'Balance',
    cta: 'Vælg fokus',
    description:
      'Når du ikke ved, hvad du skal vælge, så tag næste modul der balancerer din nuværende træning bedst.',
    href:
      profile.puzzlesSolved < profile.gamesPlayed
        ? '/tactics'
        : practicedOpeningsCount < 2
          ? `/openings/${nextIncompleteOpening.slug}`
          : '/play',
    id: 'balanced-focus',
    title: 'Vælg det modul der balancerer din profil',
  });

  return recommendations;
}
