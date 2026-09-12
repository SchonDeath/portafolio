import { onMounted, onUnmounted, type Ref } from 'vue'

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Vocabulario de animación.
 *
 * Cuatro gestos, y no hay un quinto. El inventario cerrado es la
 * decisión: un sitio con doce animaciones distintas no se lee como
 * dirigido, se lee como acumulado.
 *
 *   [data-line]      titular que entra por líneas desde una máscara
 *   [data-rise]      bloque que sube al entrar en vista
 *   [data-curtain]   imagen revelada por una cortina que se retira
 *   [data-rule]      filete que se dibuja de izquierda a derecha
 *
 * IMPLEMENTACIÓN. Esto lo hacía GSAP con ScrollTrigger y SplitText: 122 kB
 * minificados para cuatro gestos que son un translate, un fade, un
 * clip-path y un scaleX. Todos son transiciones CSS que el navegador
 * resuelve en el compositor; lo único que hacía falta era saber cuándo
 * disparar, y de eso se encarga IntersectionObserver en 40 líneas.
 *
 * El coste real de GSAP no era el peso sino lo que arrastraba: su
 * SplitText partía los titulares midiendo el layout, y aquí basta con
 * declarar las líneas en el marcado.
 *
 * El estado inicial vive en CSS bajo [data-animate], una clase que este
 * composable pone en <html> al montarse. Sin JS, el atributo no existe y
 * el contenido se ve en su estado final: la página se lee entera aunque
 * el bundle no llegue nunca.
 *
 * RED DE SEGURIDAD. Un observador solo dispara si algo se desplaza o ya
 * está en pantalla. Eso deja fuera a quien fotografía la página entera
 * sin recorrerla —capturas automáticas, vistas previas, herramientas de
 * impresión— y también el caso en que un fallo deje elementos sin
 * revelar. Por eso hay un plazo máximo: pasado FALLBACK_MS desde el
 * montaje, todo lo que siga oculto se muestra. El movimiento es un
 * adorno; que el contenido se vea, no.
 */

/** Plazo tras el cual se revela lo que quede pendiente, pase lo que pase. */
const FALLBACK_MS = 3000

interface EditorialOptions {
  /** Margen inferior del disparo: cuánto antes de entrar del todo. */
  rootMargin?: string
}

/** Un observador para todo el sitio: crear uno por sección es desperdicio. */
let observer: IntersectionObserver | null = null
let observed = 0

const ensureObserver = (rootMargin: string) => {
  if (observer) return observer

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const el = entry.target as HTMLElement

        /**
         * El escalonado se declara en el marcado (data-rise="0.05") para
         * que la sección controle el orden de entrada de sus hermanos sin
         * que este composable tenga que conocerlos.
         */
        const delay = Number(el.dataset.rise) || 0
        if (delay) el.style.transitionDelay = `${delay}s`

        el.dataset.shown = ''
        // Una vez mostrado, deja de observarse: estos gestos ocurren una
        // sola vez y mantener el observador vivo cuesta trabajo por scroll.
        observer!.unobserve(el)
      }
    },
    { rootMargin, threshold: 0 },
  )

  return observer
}

export function useEditorial(root: Ref<HTMLElement | null>, options: EditorialOptions = {}) {
  const { rootMargin = '0px 0px -12% 0px' } = options

  let targets: HTMLElement[] = []
  let fallback: ReturnType<typeof setTimeout> | undefined

  onMounted(() => {
    const el = root.value
    if (!el) return

    // Sin animación no hay nada que preparar: el marcado ya es su estado
    // final y [data-animate] nunca llega a ponerse.
    if (prefersReducedMotion()) return

    // Marca el documento como animable. Va aquí y no en el HTML para que
    // el estado inicial oculto solo exista si hay JS para revelarlo.
    document.documentElement.dataset.animate = ''

    const io = ensureObserver(rootMargin)

    targets = Array.from(
      el.querySelectorAll<HTMLElement>('[data-line], [data-rise], [data-curtain], [data-rule]'),
    )

    for (const target of targets) {
      io.observe(target)
      observed++
    }

    fallback = setTimeout(() => {
      for (const target of targets) {
        if (target.dataset.shown === undefined) {
          // Sin retardo: a estas alturas escalonar la entrada de media
          // página sería peor que mostrarla de una vez.
          target.style.transitionDelay = '0s'
          target.dataset.shown = ''
          observer?.unobserve(target)
        }
      }
    }, FALLBACK_MS)
  })

  onUnmounted(() => {
    clearTimeout(fallback)
    if (!observer) return

    for (const target of targets) {
      observer.unobserve(target)
      observed--
    }

    // El último en desmontarse apaga la luz.
    if (observed <= 0) {
      observer.disconnect()
      observer = null
      observed = 0
    }
  })
}
