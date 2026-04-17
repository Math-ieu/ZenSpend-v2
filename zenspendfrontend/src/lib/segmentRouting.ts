import { UserSegment } from '../types';

export type SegmentRouteSlug = 'couples' | 'young-professionals' | 'families';

const DEFAULT_SEGMENT: UserSegment = 'young_professionals';

const SEGMENT_TO_SLUG: Record<UserSegment, SegmentRouteSlug> = {
  couples: 'couples',
  young_professionals: 'young-professionals',
  families: 'families',
};

const SLUG_TO_SEGMENT: Record<SegmentRouteSlug, UserSegment> = {
  couples: 'couples',
  'young-professionals': 'young_professionals',
  families: 'families',
};

export const getDefaultSegment = (): UserSegment => DEFAULT_SEGMENT;

export const getSegmentRouteSlug = (segment: UserSegment | null | undefined): SegmentRouteSlug => {
  const safeSegment = segment ?? DEFAULT_SEGMENT;
  return SEGMENT_TO_SLUG[safeSegment];
};

export const parseSegmentRouteSlug = (slug: string | null | undefined): UserSegment | null => {
  if (!slug) {
    return null;
  }

  if (slug in SLUG_TO_SEGMENT) {
    return SLUG_TO_SEGMENT[slug as SegmentRouteSlug];
  }

  return null;
};

export const getDashboardPathForSegment = (segment: UserSegment | null | undefined) =>
  `/dashboard/${getSegmentRouteSlug(segment)}`;

export const getLoginPathForSegment = (segment: UserSegment | null | undefined) =>
  `/login/${getSegmentRouteSlug(segment)}`;

export const getSignupPathForSegment = (segment: UserSegment | null | undefined) =>
  `/signup/${getSegmentRouteSlug(segment)}`;

export const getForgotPasswordPathForSegment = (segment: UserSegment | null | undefined) =>
  `/forgot-password/${getSegmentRouteSlug(segment)}`;

export const getResetPasswordPathForSegment = (segment: UserSegment | null | undefined) =>
  `/reset-password/${getSegmentRouteSlug(segment)}`;