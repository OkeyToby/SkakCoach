export type OpeningProgressEntry = {
  viewed: boolean;
  solvedStepIds: string[];
  attempts: number;
  correctAnswers: number;
  lastPracticedDate: string | null;
  playSessions: number;
  lastPlayedGameDate: string | null;
};

export type OpeningsProgressState = {
  openings: Record<string, OpeningProgressEntry>;
};

export type OpeningsProgressMutation = (state: OpeningsProgressState) => OpeningsProgressState;
