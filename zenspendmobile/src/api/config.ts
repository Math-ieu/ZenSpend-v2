// Runtime configuration for the mobile API layer.
//
// EXPO_PUBLIC_* variables are inlined at build time by Expo and are safe to
// read on the client. We fall back to the Android emulator loopback so the app
// can talk to a Django dev server running on the host machine.
import { Platform } from 'react-native';

const DEFAULT_DEV_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || DEFAULT_DEV_URL;

// Bank sync (DSP2 read-only import) is deferred to a post-MVP release. The
// connect-bank flow stays in the codebase but its entry point is hidden until
// EXPO_PUBLIC_BANK_SYNC=true, so the shipped MVP exposes no half-wired feature.
export const BANK_SYNC_ENABLED = process.env.EXPO_PUBLIC_BANK_SYNC === 'true';
