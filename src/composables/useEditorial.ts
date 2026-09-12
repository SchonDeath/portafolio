import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { onMounted, onUnmounted, type Ref } from 'vue'

gsap.registerPlugin(ScrollTrigger, SplitText)

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Vocabulario de animación editorial.
 *
 * Un solo composable en vez de uno por gesto: todos comparten el mismo
 * `gsap.context` por sección, así el `revert()` de desmontaje limpia
 * ScrollTriggers, SplitText y estilos inline de una vez. Cada gesto se
 * activa por atributo en el marcado, no por opción, para que las
 * secciones se lean como HTML y no como configuración.
 *
 *   [data-line]      titular que entra por líneas desde una máscara
 *   [data-word]      titular que entra palabra a palabra
 *   [data-rise]      bloque de texto o UI que sube al entrar
 *   [data-curtain]   imagen revelada por una cortina que se retira
 *   [data-parallax]  desplazamiento lento durante el scroll
 *   [data-count]     cifra que cuenta hasta su valor final
 *   [data-rule]      línea divisoria que se dibuja de izquierda a derecha
 */

interface EditorialOptions {
  /** Punto de disparo por defecto de las entradas. */
  start?: string
}

export function useEditorial(root: Ref<HTMLElement | null>, options: EditorialOptions = {}) {
  const { start = 'top 80%' } = options

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

      /* ── Titulares por líneas ─────────────────────────────
         La máscara es el truco que separa esto de un fade: cada línea
         vive en su propio contenedor con overflow oculto, así que el
         texto emerge desde un borde duro en vez de aparecer flotando. */

      q('[data-line]').forEach((target) => {
        const split = new SplitText(target, {
          type: 'lines',
          linesClass: 'split-line',
          // El wrapper por línea es lo que da el borde de la máscara.
          mask: 'lines',
        })

        gsap.from(split.lines, {
          yPercent: 115,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: blockOf(target), start, once: true },
        })
      })

      /* ── Titulares por palabras ──────────────────────────── */

      q('[data-word]').forEach((target) => {
        const split = new SplitText(target, { type: 'words', wordsClass: 'split-word' })

        gsap.from(split.words, {
          yPercent: 60,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.035,
          scrollTrigger: { trigger: blockOf(target), start, once: true },
        })
      })

      /* ── Bloques que suben ───────────────────────────────── */

      q('[data-rise]').forEach((target) => {
        // El retardo se declara en el marcado para escalonar hermanos sin
        // que el composable tenga que conocer el orden de la sección.
        const delay = Number(target.dataset.rise) || 0

        gsap.from(target, {
          y: 26,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          delay,
          scrollTrigger: { trigger: blockOf(target), start, once: true },
        })
      })

      /* ── Cortina sobre imágenes ──────────────────────────── */

      q('[data-curtain]').forEach((target) => {
        const image = target.querySelector('img, [data-curtain-target]')

        const tl = gsap.timeline({
          scrollTrigger: { trigger: blockOf(target), start: 'top 85%', once: true },
        })

        // La cortina se retira hacia arriba mientras la imagen, que empieza
        // sobreescalada, vuelve a su tamaño: el desfase entre ambas es lo
        // que hace que se lea como un revelado y no como un wipe plano.
        tl.fromTo(
          target,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.inOut' },
        )

        if (image) {
          tl.from(image, { scale: 1.25, duration: 1.6, ease: 'power3.out' }, 0)
        }
      })

      /* ── Paralaje ────────────────────────────────────────── */

      q('[data-parallax]').forEach((target) => {
        // Valor en px: cuánto se desplaza entre entrar y salir de pantalla.
        const distance = Number(target.dataset.parallax) || 60

        gsap.fromTo(
          target,
          { y: -distance / 2 },
          {
            y: distance / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: target,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      })

      /* ── Cifras ──────────────────────────────────────────── */

      q('[data-count]').forEach((target) => {
        const end = Number(target.dataset.count)
        if (!Number.isFinite(end)) return

        const counter = { value: 0 }

        gsap.to(counter, {
          value: end,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: blockOf(target), start, once: true },
          onUpdate() {
            target.textContent = String(Math.round(counter.value))
          },
        })
      })

      /* ── Líneas divisorias ───────────────────────────────── */

      q('[data-rule]').forEach((target) => {
        gsap.from(target, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: blockOf(target), start: 'top 92%', once: true },
        })
      })
    }, el)
  })

  onUnmounted(() => ctx?.revert())
}
