/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_FORM_ENDPOINT?: string
  readonly VITE_FORM_SIMULATE_FAILURE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
