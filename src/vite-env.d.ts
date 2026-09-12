/// <reference types="vite/client" />

declare global {
  interface Window {
    /**
     * URL de blob del clip del portal, ya descargado por el preloader.
     *
     * El preloader baja el vídeo con `fetch` para medir la barra por bytes
     * reales, y lo deja aquí para que el portal lo reproduzca desde memoria
     * en vez de pedirlo por segunda vez. Es `undefined` cuando esa descarga
     * falló o cuando el portal se abre sin preloader — en ambos casos el
     * portal cae a su `src` normal.
     */
    __portalVideoUrl?: string
  }
}

export {}
