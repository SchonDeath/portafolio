import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { onMounted, onUnmounted, type Ref } from 'vue'

gsap.registerPlugin(ScrollTrigger, SplitText)

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Vocabulario de animación.
 *
 * Cuatro gestos, y no hay un quinto. El inventario cerrado es la
 * decisión: un sitio con doce animaciones distintas no se lee como
 * dirigido, se lee como acumulado. Se eliminaron el paralaje y los
 * contadores animados que había antes por eso mismo.
 *
 * Un solo composable en vez de uno por gesto: todos comparten el mismo
 * `gsap.context` por sección, así el `revert()` de desmontaje limpia
 * ScrollTriggers, SplitText y estilos inline de una vez. Cada gesto se
 * activa por atributo en el marcado, para que las secciones se lean como
 * HTML y no como configuración.
 *
 *   [data-line]      titular que entra por líneas desde una máscara
 *   [data-rise]      bloque de texto o UI que sube al entrar
 *   [data-curtain]   imagen revelada por una cortina que se retira
 *   [data-rule]      filete que se dibuja de izquierda a derecha
 */

interface EditorialOptions {
  /** Punto de disparo por defecto de las entradas. */
  start?: string
}

export function useEditorial(root: Ref<HTMLElement | null>, options: EditorialOptions = {}) {
  const { start = 'top 82%' } = options

  let ctx: gsap.Context | null = null

  onMounted(() => {
    const el = root.value
    if (!el) return

    // Sin animación, el marcado ya es su propio estado final: no ocultamos
    // nada desde CSS, así que aquí no hay que restaurar nada.
    if (prefersReducedMotion()) return

    ctx = gsap.context((self) => {
      const q = (sel: string) => (self.selector?.(sel) ?? []) as HTMLElement[]

      /**
       * Bloque al que se ancla el disparo de una entrada.
       *
       * Anclar cada elemento a sí mismo parece lo natural, pero rompe la
       * navegación por ancla: al saltar directo a una sección, lo que ya
       * quedó por encima del punto de disparo cuando se creó el trigger
       * no se anima nunca y queda invisible. El bloque contenedor sí
       * cruza el punto, y además hace que los hermanos entren juntos.
       */
      const blockOf = (el: HTMLElement) => el.closest('article, section, footer') ?? el

      /* ── 1. Revelado por líneas ───────────────────────────
         La máscara es lo que separa esto de un fade: cada línea vive en
         su propio contenedor con overflow oculto, así que el texto
         emerge desde un borde duro en vez de aparecer flotando. */

      q('[data-line]').forEach((target) => {
        const split = new SplitText(target, {
          type: 'lines',
          linesClass: 'split-line',
          mask: 'lines',
        })

        gsap.from(split.lines, {
          yPercent: 112,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: blockOf(target), start, once: true },
        })
      })

      /* ── 2. Bloques que suben ─────────────────────────────
         El retardo se declara en el marcado para escalonar hermanos sin
         que el composable tenga que conocer el orden de la sección. */

      q('[data-rise]').forEach((target) => {
        const delay = Number(target.dataset.rise) || 0

        gsap.from(target, {
          y: 22,
          opacity: 0,
          duration: 0.7,
          ease: 'expo.out',
          delay,
          scrollTrigger: { trigger: blockOf(target), start, once: true },
        })
      })

      /* ── 3. Cortina sobre imágenes ────────────────────────
         La cortina se retira hacia arriba mientras la imagen, que empieza
         sobreescalada, vuelve a su tamaño: el desfase entre ambas es lo
         que hace que se lea como un revelado y no como un wipe plano. */

      q('[data-curtain]').forEach((target) => {
        const image = target.querySelector('img, [data-curtain-target]')

        const tl = gsap.timeline({
          scrollTrigger: { trigger: blockOf(target), start: 'top 86%', once: true },
        })

        tl.fromTo(
          target,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.inOut' },
        )

        if (image) {
          tl.from(image, { scale: 1.12, duration: 1, ease: 'power3.out' }, 0)
        }
      })

      /* ── 4. Filetes ───────────────────────────────────────
         El gesto que hace visible la estructura del documento. */

      q('[data-rule]').forEach((target) => {
        gsap.from(target, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.5,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: blockOf(target), start: 'top 92%', once: true },
        })
      })
    }, el)
  })

  onUnmounted(() => ctx?.revert())
}
