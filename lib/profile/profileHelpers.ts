import type { PlayerProfile } from './profileTypes';

export const XP_PER_PUZZLE = 20;
export const XP_PER_GAME = 15;
export const XP_PER_WIN_BONUS = 35;

export const defaultPlayerProfile: PlayerProfile = {
  level: 1,
  xp: 0,
  streak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  puzzlesSolved: 0,
  lastPlayedDate: null,
};

export function getLevelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayDifference(fromDateKey: string, toDateKey: string): number {
  const from = new Date(`${fromDateKey}T00:00:00`);
  const to = new Date(`${toDateKey}T00:00:00`);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / 86_400_000);
}

export function normalizeProfile(profile: Partial<PlayerProfile> | null | undefined): PlayerProfile {
  const merged = {
    ...defaultPlayerProfile,
    ...profile,
  };

  return {
    ...merged,
    xp: Math.max(0, Number.isFinite(merged.xp) ? merged.xp : 0),
    streak: Math.max(0, Number.isFinite(merged.streak) ? merged.streak : 0),
    gamesPlayed: Math.max(0, Number.isFinite(merged.gamesPlayed) ? merged.gamesPlayed : 0),
    gamesWon: Math.max(0, Number.isFinite(merged.gamesWon) ? merged.gamesWon : 0),
    puzzlesSolved: Math.max(0, Number.isFinite(merged.puzzlesSolved) ? merged.puzzlesSolved : 0),
    lastPlayedDate: typeof merged.lastPlayedDate === 'string' ? merged.lastPlayedDate : null,
    level: getLevelFromXp(Number.isFinite(merged.xp) ? merged.xp : 0),
  };
}

export function touchTrainingDay(profile: PlayerProfile, now = new Date()): PlayerProfile {
  const today = getLocalDateKey(now);
  const normalized = normalizeProfile(profile);

  if (!normalized.lastPlayedDate) {
    return normalizeProfile({
      ...normalized,
      streak: 1,
      lastPlayedDate: today,
    });
  }

  if (normalized.lastPlayedDate === today) {
    return normalizeProfile({
      ...normalized,
      lastPlayedDate: today,
    });
  }

  const dayDifference = getDayDifference(normalized.lastPlayedDate, today);
  const nextStreak = dayDifference === 1 ? normalized.streak + 1 : 1;

  return normalizeProfile({
    ...normalized,
    streak: nextStreak,
    lastPlayedDate: today,
  });
}

export function awardXp(profile: PlayerProfile, xpToAdd: number): PlayerProfile {
  const normalized = normalizeProfile(profile);
  return normalizeProfile({
    ...normalized,
    xp: normalized.xp + Math.max(0, xpToAdd),
  });
}

export function recordSolvedPuzzle(profile: PlayerProfile): PlayerProfile {
  const trained = touchTrainingDay(profile);
  const updated = normalizeProfile({
    ...trained,
    puzzlesSolved: trained.puzzlesSolved + 1,
  });

  return awardXp(updated, XP_PER_PUZZLE);
}

export function recordCompletedGame(profile: PlayerProfile, didWin: boolean): PlayerProfile {
  const trained = touchTrainingDay(profile);
  const updated = normalizeProfile({
    ...trained,
    gamesPlayed: trained.gamesPlayed + 1,
    gamesWon: trained.gamesWon + (didWin ? 1 : 0),
  });

  return awardXp(updated, XP_PER_GAME + (didWin ? XP_PER_WIN_BONUS : 0));
}

export function getXpIntoCurrentLevel(profile: PlayerProfile): number {
  const level = getLevelFromXp(profile.xp);
  const currentLevelStart = (level - 1) * 100;
  return profile.xp - currentLevelStart;
}

export function getXpToNextLevel(): number {
  return 100;
}

export function hasRealProgress(profile: PlayerProfile): boolean {
  return profile.xp > 0 || profile.gamesPlayed > 0 || profile.puzzlesSolved > 0 || profile.streak > 0;
}
