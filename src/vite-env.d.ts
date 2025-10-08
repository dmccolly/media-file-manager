/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string
  readonly VITE_CLOUDINARY_API_KEY: string
  readonly VITE_XANO_API_KEY: string
  readonly VITE_WEBFLOW_API_TOKEN: string
  readonly VITE_WEBFLOW_SITE_ID: string
  readonly VITE_WEBFLOW_COLLECTION_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
