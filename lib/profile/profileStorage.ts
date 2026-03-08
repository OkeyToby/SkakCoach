import { defaultPlayerProfile, normalizeProfile } from './profileHelpers';
import type { PlayerProfile, ProfileMutation } from './profileTypes';

export const PROFILE_STORAGE_KEY = 'skakcoach-profile';
const PROFILE_UPDATED_EVENT = 'skakcoach-profile-updated';

function isBrowserReady(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readProfile(): PlayerProfile {
  if (!isBrowserReady()) {
    return defaultPlayerProfile;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return defaultPlayerProfile;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultPlayerProfile;
    }

    return normalizeProfile(parsed as Partial<PlayerProfile>);
  } catch {
    return defaultPlayerProfile;
  }
}

export function writeProfile(profile: PlayerProfile): PlayerProfile {
  const normalized = normalizeProfile(profile);

  if (!isBrowserReady()) {
    return normalized;
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: normalized }));
  return normalized;
}

export function updateProfile(mutation: ProfileMutation): PlayerProfile {
  const current = readProfile();
  const next = mutation(current);
  return writeProfile(next);
}

export function subscribeToProfile(callback: (profile: PlayerProfile) => void): () => void {
  if (!isBrowserReady()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PROFILE_STORAGE_KEY) return;
    callback(readProfile());
  };

  const handleLocalUpdate = () => {
    callback(readProfile());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(PROFILE_UPDATED_EVENT, handleLocalUpdate as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PROFILE_UPDATED_EVENT, handleLocalUpdate as EventListener);
  };
}
