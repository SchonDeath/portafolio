<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { prefersReducedMotion, useEditorial } from '@/composables/useEditorial'
import { profile, socials } from '@/data/profile'

/**
 * Final del recorrido.
 *
 * Es la última estación del viaje 3D, y por eso el cierre no es una
 * tarjeta de contacto sino una llamada a tamaño de cartel: el email
 * ocupa el ancho de la página, como el nombre en la apertura. La página
 * abre y cierra con el mismo gesto tipográfico.
 */

const root = ref<HTMLElement | null>(null)
const mail = ref<HTMLElement | null>(null)

useEditorial(root)

const year = new Date().getFullYear()

let ctx: gsap.Context | null = null

/**
 * El email se agranda ligeramente al acercarse el final del scroll: la
 * cámara del fondo se detiene aquí, y el texto recoge ese frenado en vez
 * de quedarse quieto de golpe.
 */
onMounted(() => {
  if (prefersReducedMotion()) return

  ctx = gsap.context(() => {
    gsap.fromTo(
      mail.value,
      { scale: 0.95, opacity: 0.5 },
      {
        scale: 1,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root.value,
          start: 'top 80%',
          end: 'bottom bottom',
          scrub: true,
        },
      },
    )
  }, root.value ?? undefined)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <footer
    ref="root"
    id="contacto"
    class="relative flex min-h-svh scroll-mt-24 flex-col justify-center overflow-hidden pt-28 pb-10"
  >
    <div class="shell relative flex flex-1 flex-col justify-center">
      <div class="flex items-center gap-6">
        <p data-rise class="eyebrow whitespace-nowrap">05 — Contacto</p>
        <span data-rule class="bg-line-strong h-px flex-1"></span>
      </div>

      <p
        data-line
        class="text-content-muted mt-16 max-w-xl text-lg leading-relaxed sm:text-xl"
      >
        Conversemos sobre tu próximo proyecto. Desarrollo frontend, plataformas web
        y oportunidades para construir en equipo.
      </p>

      <!-- El email como titular de cierre: mismo peso visual que el
           nombre en la apertura, para que la página cierre el círculo. -->
      <a
        ref="mail"
        :href="`mailto:${profile.email}`"
        class="group text-content-strong hover:text-accent-bright mt-12 block origin-left break-all transition-colors duration-300"
      >
        <span class="block text-[clamp(1.75rem,6.5vw,5.5rem)] leading-none font-semibold tracking-[-0.04em]">
          {{ profile.email }}
        </span>
        <span
          aria-hidden="true"
          class="text-accent mt-6 inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase"
        >
          Escríbeme
          <span class="transition-transform duration-500 group-hover:translate-x-2">→</span>
        </span>
      </a>
    </div>

    <!-- Pie: redes y créditos en una sola barra -->
    <div class="shell relative">
      <div
        data-rise
        class="border-line text-content-subtle flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-t pt-8 font-mono text-xs"
      >
        <p>© {{ year }} {{ profile.name }}</p>

        <ul class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <li v-for="social in socials" :key="social.label">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener"
              class="hover:text-accent-bright transition-colors"
            >
              {{ social.label }}
            </a>
          </li>
        </ul>

        <p class="text-content-faint">Vue · Three.js · GSAP · Tailwind</p>
      </div>
    </div>
  </footer>
</template>
