import { useCallback, useState } from 'react';
import { UserSegment } from '../types';

export const USER_SEGMENT_STORAGE_KEY = 'zenspend_user_segment';

export type UserSegmentOption = {
  value: UserSegment;
  label: string;
  subtitle: string;
  highlights: string[];
};

export const USER_SEGMENT_OPTIONS: UserSegmentOption[] = [
  {
    value: 'couples',
    label: 'Couples',
    subtitle: 'Budgets partages et pilotage a deux',
    highlights: [
      'Budget commun + comptes personnels',
      'Contributions equitables et suivi des ecarts',
      'Objectifs de projets de couple',
    ],
  },
  {
    value: 'young_professionals',
    label: 'Jeunes actifs',
    subtitle: 'Acceleration de l epargne et des objectifs',
    highlights: [
      'Plans d epargne automatises',
      'Projection de capacite mensuelle',
      'Suivi des objectifs par etapes',
    ],
  },
  {
    value: 'families',
    label: 'Familles',
    subtitle: 'Multi-comptes et multi-profils au meme endroit',
    highlights: [
      'Vue foyer avec comptes consolides',
      'Roles parent/enfant et enveloppes dediees',
      'Suivi des depenses recurrentes du foyer',
    ],
  },
];

const SEGMENT_VALUES = new Set<UserSegment>(['couples', 'young_professionals', 'families']);

const DEFAULT_SEGMENT: UserSegment = 'young_professionals';

export const isUserSegment = (value: string | null): value is UserSegment => {
  if (!value) {
    return false;
  }
  return SEGMENT_VALUES.has(value as UserSegment);
};

const getStoredUserSegment = (): UserSegment => {
  if (typeof window === 'undefined') {
    return DEFAULT_SEGMENT;
  }

  const stored = window.localStorage.getItem(USER_SEGMENT_STORAGE_KEY);
  if (isUserSegment(stored)) {
    return stored;
  }

  return DEFAULT_SEGMENT;
};

export const persistUserSegment = (segment: string | null | undefined) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = segment ?? null;
  if (isUserSegment(normalized)) {
    window.localStorage.setItem(USER_SEGMENT_STORAGE_KEY, normalized);
  }
};

export const useUserSegment = () => {
  const [segment, setSegmentState] = useState<UserSegment>(getStoredUserSegment);

  const setSegment = useCallback((nextSegment: UserSegment) => {
    setSegmentState(nextSegment);
    persistUserSegment(nextSegment);
  }, []);

  return {
    segment,
    setSegment,
  };
};
