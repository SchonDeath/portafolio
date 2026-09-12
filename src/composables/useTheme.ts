import { ref, watch } from 'vue'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

/**
 * Tema del sitio.
 *
 * El estado vive a nivel de módulo, no dentro de la función: así el botón
 * de la navegación y cualquier otro consumidor comparten la misma
 * referencia en vez de sincronizar copias.
 *
 * La primera pintura la resuelve un script en index.html, antes de que
 * Vue monte. Aquí solo tomamos lo que ese script ya dejó en el DOM, para
 * no reintroducir el parpadeo que precisamente evita.
 *
 * El defecto es claro: el concepto del sitio es un documento impreso y el
 * papel es su estado natural. Este valor casi nunca se usa —el script de
 * arranque ya dejó el suyo en el DOM— pero tiene que coincidir con él.
 */
const theme = ref<Theme>('light')

/** true mientras el visitante no ha elegido: seguimos al sistema. */
let followsSystem = true

const apply = (value: Theme) => {
  document.documentElement.dataset.theme = value
}

export function useTheme() {
  // Estado inicial: lo que el script de arranque dejó puesto.
  const current = document.documentElement.dataset.theme
  if (current === 'light' || current === 'dark') {
    theme.value = current
  }

  try {
    followsSystem = !localStorage.getItem(STORAGE_KEY)
  } catch {
    // Modo privado: seguimos al sistema y no persistimos nada.
  }

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    followsSystem = false

    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch {
      /* la elección vale para esta sesión aunque no se pueda guardar */
    }
  }

  watch(theme, apply)

  // Si el visitante no ha elegido, el sitio sigue al sistema en vivo:
  // cambiar el tema del SO de día a noche se refleja sin recargar.
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', (e) => {
    if (followsSystem) theme.value = e.matches ? 'dark' : 'light'
  })

  return { theme, toggle }
}
