/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOYMENT_TARGET?: 'preview' | 'production'
  readonly VITE_BASE_PATH?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_ALLOW_INDEXING?: string
  readonly VITE_PROJECT_FORM_ENDPOINT?: string
  readonly VITE_FORM_SIMULATE_FAILURE?: string
  readonly VITE_COMPANY_PHONE?: string
  readonly VITE_WECHAT_ID?: string
  readonly VITE_COMPANY_EMAIL?: string
  readonly VITE_COMPANY_ICP_NUMBER?: string
  readonly VITE_COMPANY_LEGAL_NAME?: string
  readonly VITE_COMPANY_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
