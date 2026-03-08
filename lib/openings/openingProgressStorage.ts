import { defaultOpeningsProgress, normalizeOpeningsProgress } from './openingProgressHelpers';
import type { OpeningsProgressMutation, OpeningsProgressState } from './openingProgressTypes';

export const OPENINGS_PROGRESS_STORAGE_KEY = 'skakcoach-openings-progress';
const OPENINGS_PROGRESS_UPDATED_EVENT = 'skakcoach-openings-progress-updated';

function isBrowserReady(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readOpeningsProgress(): OpeningsProgressState {
  if (!isBrowserReady()) {
    return defaultOpeningsProgress;
  }

  try {
    const raw = window.localStorage.getItem(OPENINGS_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return defaultOpeningsProgress;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultOpeningsProgress;
    }

    return normalizeOpeningsProgress(parsed as Partial<OpeningsProgressState>);
  } catch {
    return defaultOpeningsProgress;
  }
}

export function writeOpeningsProgress(progress: OpeningsProgressState): OpeningsProgressState {
  const normalized = normalizeOpeningsProgress(progress);

  if (!isBrowserReady()) {
    return normalized;
  }

  window.localStorage.setItem(OPENINGS_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(OPENINGS_PROGRESS_UPDATED_EVENT, { detail: normalized }));
  return normalized;
}

export function updateOpeningsProgress(mutation: OpeningsProgressMutation): OpeningsProgressState {
  const current = readOpeningsProgress();
  const next = mutation(current);
  return writeOpeningsProgress(next);
}

export function subscribeToOpeningsProgress(
  callback: (progress: OpeningsProgressState) => void,
): () => void {
  if (!isBrowserReady()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== OPENINGS_PROGRESS_STORAGE_KEY) return;
    callback(readOpeningsProgress());
  };

  const handleLocalUpdate = () => {
    callback(readOpeningsProgress());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(OPENINGS_PROGRESS_UPDATED_EVENT, handleLocalUpdate as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(OPENINGS_PROGRESS_UPDATED_EVENT, handleLocalUpdate as EventListener);
  };
}
