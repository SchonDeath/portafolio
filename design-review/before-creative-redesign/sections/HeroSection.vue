<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { prefersReducedMotion } from '@/composables/useEditorial'
import { profile, socials } from '@/data/profile'

/**
 * Apertura del recorrido.
 *
 * Ocupa la altura entera y no lleva imagen: el fondo es la escena 3D, y
 * lo único que se sobreimprime es el nombre a tamaño de cartel. La
 * versión anterior ponía un retrato a ancho completo aquí, que es lo que
 * hacía que se leyera igual que cualquier plantilla.
 *
 * El titular se parte en dos pesos que se cruzan —el rol en negro
 * enorme, el apellido en fino— para que la jerarquía la haga la
 * tipografía y no un color de acento.
 */

const root = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const name = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

onMounted(() => {
  if (prefersReducedMotion()) return

  ctx = gsap.context((self) => {
    const q = (sel: string) => (self.selector?.(sel) ?? []) as HTMLElement[]

    // El titular se aleja y se desvanece al bajar, como si la cámara lo
    // dejara atrás: es el gesto que cose el HTML con el viaje 3D.
    gsap.to(title.value, {
      y: -120,
      scale: 0.94,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: 'bottom 30%',
        scrub: true,
      },
    })

    /* ── Entrada del nombre ────────────────────────────────
       El nombre no entra como bloque: se parte en caracteres dentro de
       una máscara por línea, así cada letra emerge desde un borde duro
       en vez de flotar. Lo que lo hace caro es el reparto — las letras
       salen casi juntas, con un stagger corto, pero sobre una curva muy
       larga: el conjunto se asienta despacio sin que ninguna letra se
       quede rezagada.

       El desenfoque acompaña sólo el primer tercio del recorrido, que es
       lo que da la sensación de enfoque de cámara; por eso se anima
       aparte y no dentro del mismo tween. */

    const lines = q('[data-name-line]').map(
      (el) =>
        new SplitText(el, {
          type: 'chars',
          charsClass: 'name-char',
          // El wrapper por línea da el borde contra el que se recorta.
          mask: 'lines',
        }),
    )

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.2 })

    lines.forEach((split, index) => {
      // La segunda línea arranca antes de que termine la primera: el
      // solape es lo que convierte dos entradas en un solo gesto.
      const at = index * 0.34

      tl.from(
        split.chars,
        {
          yPercent: 120,
          // El giro es mínimo a propósito: lo justo para que las letras
          // no suban como un bloque rígido. Más que esto se nota y se
          // vuelve decorativo.
          rotate: 5,
          duration: 1.6,
          stagger: { each: 0.028, from: 'start' },
        },
        at,
      )

      tl.from(
        split.chars,
        {
          filter: 'blur(14px)',
          opacity: 0,
          duration: 0.9,
          stagger: { each: 0.028, from: 'start' },
        },
        at,
      )
    })

    // Un empuje de escala sobre el conjunto, no sobre las letras: el
    // bloque se asienta hacia su tamaño final mientras las letras
    // todavía suben, y ese desfase es el que da profundidad.
    tl.from(
      name.value,
      { scale: 1.06, transformOrigin: 'left center', duration: 2, ease: 'power3.out' },
      0,
    )

    // Las coordenadas y su línea entran antes que el nombre, muy
    // sutiles, para que la pantalla no esté vacía cuando arranca el
    // titular.
    tl.from('[data-hero-lead]', { opacity: 0, x: -18, duration: 1.1 }, 0)
    tl.from(
      '[data-hero-rule]',
      { scaleX: 0, transformOrigin: 'left center', duration: 1.4, ease: 'power3.inOut' },
      0.1,
    )

    // Todo lo que cuelga del titular entra después, ya sin protagonismo:
    // sube poco y en cascada corta.
    tl.from(
      '[data-hero]',
      { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 },
      // Enganchado al final de la última línea del nombre, no al del
      // timeline: si no, el pie esperaría a que se asiente la escala.
      lines.length * 0.34 + 0.45,
    )
  }, root.value ?? undefined)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section
    ref="root"
    class="professional-hero relative flex min-h-svh flex-col justify-between overflow-hidden pt-32 pb-12"
  >
    <div ref="title" class="shell relative flex flex-1 flex-col justify-center">
      <!-- Coordenadas de apertura: sitúan antes de nombrar. Entran por
           su cuenta, antes del titular, para que el nombre llegue a una
           pantalla que ya tiene algo en pie. -->
      <div class="mb-10 flex items-center gap-4 font-mono text-xs tracking-[0.3em] uppercase">
        <span data-hero-lead class="bg-accent h-1.5 w-1.5 rounded-full"></span>
        <span data-hero-lead class="text-content-muted">{{ profile.location }}</span>
        <span data-hero-rule class="bg-line-strong h-px flex-1"></span>
        <span data-hero-lead class="text-content-subtle hidden sm:inline">Portafolio profesional</span>
      </div>

      <!-- El nombre a tamaño de cartel. Dos líneas, dos pesos: el
           contraste tipográfico es toda la jerarquía que necesita.

           Cada línea es su propio blanco de partición: SplitText la
           recorta en caracteres y le pone la máscara desde la que
           emergen. El texto va sin espacios sobrantes en el marcado
           porque la partición hereda el whitespace tal cual. -->
      <h1 ref="name" class="flex flex-col leading-[0.86]">
        <span
          data-name-line
          class="text-content-strong block text-[clamp(3rem,8.5vw,7.5rem)] font-semibold tracking-[-0.055em]"
        >Sebastián</span>
        <span
          data-name-line
          class="text-content-muted block text-[clamp(3rem,8.5vw,7.5rem)] font-light tracking-[-0.055em]"
        >González</span>
      </h1>

      <!-- Rol y bio en dos columnas desiguales, alineadas al pie del
           titular: el bloque de texto cuelga de la tipografía grande en
           vez de flotar centrado. -->
      <div class="mt-14 grid gap-10 border-t border-line pt-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <p
          data-hero
          class="text-content-strong text-lg leading-snug font-medium sm:text-xl"
        >
          {{ profile.role }}
        </p>

        <p data-hero class="text-content-muted max-w-xl leading-relaxed">
          {{ profile.introduction }}
        </p>
      </div>
      <div data-hero class="hero-actions mt-8 flex flex-wrap gap-3">
        <a href="#proyectos" class="primary-action">Explorar proyectos <span aria-hidden="true">↗</span></a>
        <a href="#contacto" class="secondary-action">Conversemos <span aria-hidden="true">→</span></a>
        <a v-if="profile.resume" :href="profile.resume" class="secondary-action" download>Descargar CV ↓</a>
      </div>
      <div data-hero class="client-strip my-10">
        <p>Experiencia en proyectos para</p>
        <ul><li>Banco Central de Chile</li><li>Consorcio</li><li>Servicio de Impuestos Internos</li></ul>
      </div>
    </div>

    <!-- Pie fijo del hero: estado, accesos y redes en una sola barra.
         Los botones grandes centrados de antes eran lo más plantilla de
         toda la página. -->
    <div class="shell relative">
      <div
        data-hero
        class="border-line flex flex-wrap items-center gap-x-8 gap-y-4 border-t pt-6"
      >
        <p v-if="profile.available" class="flex items-center gap-3">
          <span class="relative flex h-2 w-2">
            <span
              class="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            ></span>
            <span class="bg-accent-bright relative inline-flex h-2 w-2 rounded-full"></span>
          </span>
          <span class="text-content-muted font-mono text-xs tracking-widest uppercase">
            {{ profile.availableLabel }}
          </span>
        </p>

        <span class="bg-line-strong hidden h-px flex-1 sm:block"></span>

        <ul class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <li v-for="social in socials" :key="social.label">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener"
              class="text-content-subtle hover:text-accent-bright font-mono text-xs tracking-wide transition-colors"
            >
              {{ social.label }}
            </a>
          </li>
        </ul>

        <a
          href="#proyectos"
          class="group text-content-strong hover:text-accent-bright inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          Ver trabajo
          <span
            aria-hidden="true"
            class="border-line-strong group-hover:border-accent-bright flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
          >
            ↓
          </span>
        </a>
      </div>
    </div>
  </section>
</template>
