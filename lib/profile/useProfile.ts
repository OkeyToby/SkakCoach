'use client';

import { useEffect, useState } from 'react';
import { defaultPlayerProfile } from './profileHelpers';
import { readProfile, subscribeToProfile } from './profileStorage';
import type { PlayerProfile } from './profileTypes';

type UseProfileResult = {
  profile: PlayerProfile;
  hasLoaded: boolean;
};

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<PlayerProfile>(defaultPlayerProfile);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const syncProfile = () => {
      setProfile(readProfile());
      setHasLoaded(true);
    };

    syncProfile();
    return subscribeToProfile((nextProfile) => {
      setProfile(nextProfile);
      setHasLoaded(true);
    });
  }, []);

  return {
    profile,
    hasLoaded,
  };
}
