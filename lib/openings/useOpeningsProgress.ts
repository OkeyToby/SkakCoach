'use client';

import { useEffect, useState } from 'react';
import { defaultOpeningsProgress } from './openingProgressHelpers';
import { readOpeningsProgress, subscribeToOpeningsProgress } from './openingProgressStorage';
import type { OpeningsProgressState } from './openingProgressTypes';

type UseOpeningsProgressResult = {
  progress: OpeningsProgressState;
  hasLoaded: boolean;
};

export function useOpeningsProgress(): UseOpeningsProgressResult {
  const [progress, setProgress] = useState<OpeningsProgressState>(defaultOpeningsProgress);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const syncProgress = () => {
      setProgress(readOpeningsProgress());
      setHasLoaded(true);
    };

    syncProgress();
    return subscribeToOpeningsProgress((nextProgress) => {
      setProgress(nextProgress);
      setHasLoaded(true);
    });
  }, []);

  return {
    progress,
    hasLoaded,
  };
}
