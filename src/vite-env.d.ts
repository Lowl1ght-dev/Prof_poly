/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Полный URL к скрипту на проде для `npm run dev` (например https://profpol-stjazhka.ru/api/lead.php) */
  readonly VITE_LEAD_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
