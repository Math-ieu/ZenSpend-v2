/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ZenSpend backend API, e.g. http://localhost:8000/api */
  readonly VITE_API_URL?: string;
  /** Legacy alias for VITE_API_URL (kept for backward compatibility). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
