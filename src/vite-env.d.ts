/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZHIPU_API_KEY: string
  readonly VITE_USE_OLLAMA: string
  readonly VITE_OLLAMA_URL: string
  readonly VITE_OLLAMA_MODEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
