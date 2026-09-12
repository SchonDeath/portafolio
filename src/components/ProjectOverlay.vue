<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import FluidImage from '@/components/FluidImage.vue'
import { prefersReducedMotion } from '@/composables/useEditorial'
import type { Project } from '@/data/profile'

/**
 * Vista de proyecto a pantalla completa: título tipográfico enorme sobre
 * la portada, franja de metadatos tipo ficha técnica, y cuerpo editorial
 * debajo. Es una capa aparte del flujo del documento (no una sección más
 * de la página), así que entra y sale con su propia animación en vez de
 * heredar el scroll-reveal del resto del sitio.
 */

const { project, index } = defineProps<{
  project: Project | null
  /** Posición en la lista, para el código SEC/00N. */
  index: number
}>()

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)

const sectionCode = computed(() => `SEC/${String(index + 1).padStart(3, '0')}`)
const status = computed(() => project?.year.includes('Presente') ? 'En desarrollo' : 'Experiencia de proyecto')

const close = () => emit('close')

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

watch(
  () => project,
  (next, prev) => {
    if (next && !prev) {
      document.body.classList.add('is-locked')
      window.addEventListener('keydown', onKeydown)

      if (!prefersReducedMotion() && panel.value) {
        gsap.fromTo(
          panel.value,
          { yPercent: 4, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' },
        )
        gsap.from('[data-overlay-in]', {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.06,
          delay: 0.15,
        })
      }
    } else if (!next && prev) {
      document.body.classList.remove('is-locked')
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

onMounted(() => {
  if (project) document.body.classList.add('is-locked')
})

onBeforeUnmount(() => {
  document.body.classList.remove('is-locked')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-300 ease-in"
    leave-to-class="opacity-0"
  >
    <div
      v-if="project"
      class="bg-surface-deep fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="project.title"
    >
      <div ref="panel" class="min-h-full">
        <!-- Cabecera: portada a ancho completo con el título superpuesto -->
        <header class="relative h-[70vh] min-h-[420px] overflow-hidden sm:h-[80vh]">
          <FluidImage
            :src="project.image"
            :alt="`${project.imageKind === 'illustration' ? 'Ilustración conceptual' : 'Captura'} de ${project.title}`"
            :strength="0.06"
            class="opacity-90"
          />
          <!-- Mismo motivo que en la tarjeta: las portadas son capturas
               de pantalla de fondo blanco, y aquí ocupan 70-80vh con el
               título apoyado en la base. Sin un velo que llegue hasta
               media altura, el texto blanco cae sobre el blanco de la
               captura y desaparece. -->
          <div
            aria-hidden="true"
            class="bg-surface-deep/20 pointer-events-none absolute inset-0"
          ></div>
          <div
            aria-hidden="true"
            class="from-surface-deep via-surface-deep/75 pointer-events-none absolute inset-0 bg-linear-to-t from-20% via-55% to-transparent"
          ></div>

          <!-- Barra superior: estado + cerrar -->
          <div class="shell absolute inset-x-0 top-6 flex items-center justify-between gap-4 sm:top-10">
            <span
              data-overlay-in
              class="border-content-subtle/25 bg-surface-deep/60 text-content-strong rounded-full border px-4 py-1.5 font-mono text-[0.7rem] tracking-widest uppercase backdrop-blur-sm"
            >
              {{ status }}
            </span>

            <button
              data-overlay-in
              type="button"
              class="border-content-subtle/25 bg-surface-deep/60 text-content-strong hover:border-accent/60 hover:text-accent-bright inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[0.7rem] tracking-widest uppercase backdrop-blur-sm transition-colors duration-300"
              @click="close"
            >
              Cerrar
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <!-- Título, apoyado sobre la base de la portada. El cliente
               va encima y no debajo: es el dato que sitúa al resto. -->
          <div class="shell absolute inset-x-0 bottom-8 sm:bottom-12">
            <p
              data-overlay-in
              class="text-accent-bright mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-widest uppercase sm:text-sm"
            >
              <span>{{ project.client }}</span>
              <span aria-hidden="true" class="bg-line-strong h-3 w-px"></span>
              <span class="text-content-muted">{{ project.sector }}</span>
            </p>
            <h2
              data-overlay-in
              class="text-content-strong text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
            >
              {{ project.title }}
            </h2>
            <p
              data-overlay-in
              class="text-content mt-4 font-mono text-xs tracking-widest uppercase sm:text-sm"
            >
              {{ project.tagline }} · {{ project.year }}
            </p>
          </div>
        </header>

        <!-- Ficha técnica: mismo motivo `eyebrow + regla + código` que
             usa el resto del sitio para encabezar una sección. -->
        <div class="border-content-subtle/15 border-y">
          <div class="shell flex items-center justify-between gap-6 py-4">
            <p class="eyebrow whitespace-nowrap">■ Detalle del proyecto</p>
            <p class="text-content-subtle font-mono text-xs">{{ sectionCode }}</p>
          </div>
        </div>

        <!-- Cuerpo: enlaces rápidos a un lado, narrativa al otro -->
        <div class="shell grid gap-12 py-16 sm:py-20 lg:grid-cols-[16rem_1fr] lg:gap-20">
          <aside class="lg:border-content-subtle/15 lg:border-r lg:pr-10">
            <p class="text-content-subtle font-mono text-xs tracking-widest uppercase">
              Stack
            </p>
            <ul class="mt-4 flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-2.5">
              <li
                v-for="tech in project.stack"
                :key="tech"
                class="border-content-subtle/15 text-content-muted rounded-full border px-3 py-1 font-mono text-[0.7rem] lg:w-fit"
              >
                {{ tech }}
              </li>
            </ul>

            <div v-if="project.live || project.repo" class="mt-10 flex flex-col gap-3">
              <a
                v-if="project.live"
                :href="project.live"
                target="_blank"
                rel="noopener"
                class="text-accent-bright hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
              >
                Ver en vivo <span aria-hidden="true">↗</span>
              </a>
              <a
                v-if="project.repo"
                :href="project.repo"
                target="_blank"
                rel="noopener"
                class="text-content-muted hover:text-content-strong inline-flex items-center gap-2 text-sm transition-colors"
              >
                Código <span aria-hidden="true">↗</span>
              </a>
            </div>
          </aside>

          <div class="max-w-2xl">
            <h3 class="text-content-strong text-2xl font-semibold tracking-tight sm:text-3xl">
              Sobre el proyecto
            </h3>
            <p class="text-content mt-6 text-base leading-relaxed sm:text-lg">
              {{ project.description }}
            </p>
            <figure class="mt-10">
              <img :src="project.image" :alt="`${project.imageKind === 'illustration' ? 'Ilustración conceptual' : 'Captura'} de ${project.title}`" class="h-auto w-full rounded-lg border border-line" loading="lazy" />
              <figcaption class="text-content-muted mt-3 text-xs">
                {{ project.imageKind === 'illustration' ? 'Ilustración conceptual del alcance del proyecto; no corresponde a una captura del sistema.' : 'Captura del proyecto.' }}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
