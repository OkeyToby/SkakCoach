export type PlayerProfile = {
  level: number;
  xp: number;
  streak: number;
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  lastPlayedDate: string | null;
};

export type ProfileMutation = (profile: PlayerProfile) => PlayerProfile;
