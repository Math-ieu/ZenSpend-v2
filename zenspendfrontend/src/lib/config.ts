// Centralized runtime configuration for the frontend.
//
// The API base URL is read from Vite environment variables at build time.
// We accept both VITE_API_URL and the legacy VITE_API_BASE_URL for backward
// compatibility, falling back to the local dev backend.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api';
