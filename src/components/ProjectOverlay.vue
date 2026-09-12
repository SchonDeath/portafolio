<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/composables/useEditorial'
import type { Project } from '@/data/profile'

/**
 * Ficha de proyecto a pantalla completa.
 *
 * En el concepto de expediente esto es el anexo: se abre desde la lista,
 * tiene su propio encabezado numerado y se cierra devolviendo al índice.
 * Por eso no hereda el scroll-reveal del documento — entra y sale con su
 * propia animación, como una hoja que se pone encima.
 */

const { project, index } = defineProps<{
  project: Project | null
  /** Posición en la lista, para el código de expediente. */
  index: number
}>()

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

/** Quién tenía el foco antes de abrir, para devolvérselo al cerrar. */
let opener: HTMLElement | null = null

const code = computed(() => `EXP/${String(index + 1).padStart(3, '0')}`)

const imageAlt = computed(() =>
  project
    ? `${project.imageKind === 'illustration' ? 'Ilustración conceptual' : 'Captura'} de ${project.title}`
    : '',
)

const close = () => emit('close')

/**
 * Confinamiento de teclado.
 *
 * Sin esto el tabulador se escapa del diálogo y recorre la página de
 * detrás, que sigue ahí aunque no se vea: quien navega con teclado
 * termina enfocando enlaces invisibles sin forma de volver. El listado de
 * enfocables se recalcula en cada Tab porque el contenido del anexo
 * cambia según el proyecto (no todos traen enlaces).
 */
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
    return
  }

  if (e.key !== 'Tab' || !dialog.value) return

  const focusables = dialog.value.querySelectorAll<HTMLElement>(
    'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )
  if (!focusables.length) return

  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement

  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => project,
  async (next, prev) => {
    if (next && !prev) {
      opener = document.activeElement as HTMLElement | null
      document.body.classList.add('is-locked')
      window.addEventListener('keydown', onKeydown)

      await nextTick()
      closeButton.value?.focus()

      if (!prefersReducedMotion() && panel.value) {
        gsap.fromTo(
          panel.value,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' },
        )
      }
    } else if (!next && prev) {
      document.body.classList.remove('is-locked')
      window.removeEventListener('keydown', onKeydown)
      // El foco vuelve a la tarjeta que abrió la ficha, no al principio
      // del documento: quien navega con teclado retoma donde estaba.
      opener?.focus()
      opener = null
    }
  },
)

onBeforeUnmount(() => {
  document.body.classList.remove('is-locked')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition name="overlay">
    <div
      v-if="project"
      ref="dialog"
      class="overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="project.title"
    >
      <div ref="panel" class="overlay__panel">
        <!-- Cabecera de expediente: código, estado y cierre -->
        <header class="overlay__bar">
          <div class="shell overlay__bar-inner">
            <p class="meta">
              <span class="overlay__code">{{ code }}</span>
              <span aria-hidden="true"> / </span>
              <span>{{ project.sector }}</span>
            </p>
            <button ref="closeButton" type="button" class="overlay__close" @click="close">
              Cerrar <span aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        <div class="shell overlay__content">
          <!-- Identificación -->
          <div class="overlay__title-block">
            <p class="meta overlay__client">{{ project.client }}</p>
            <h2 class="display-l">{{ project.title }}</h2>
            <p class="lead overlay__tagline">{{ project.tagline }}</p>
          </div>

          <!-- Cuerpo: ficha técnica al margen, narrativa al centro -->
          <div class="overlay__body">
            <aside class="overlay__aside">
              <dl class="overlay__facts">
                <div>
                  <dt class="meta-xs">Periodo</dt>
                  <dd>{{ project.year }}</dd>
                </div>
                <div>
                  <dt class="meta-xs">Cliente</dt>
                  <dd>{{ project.client }}</dd>
                </div>
                <div>
                  <dt class="meta-xs">Sector</dt>
                  <dd>{{ project.sector }}</dd>
                </div>
              </dl>

              <div class="overlay__stack">
                <p class="meta-xs">Stack</p>
                <ul class="tag-list overlay__stack-list">
                  <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
                </ul>
              </div>

              <div v-if="project.live || project.repo" class="overlay__links">
                <a v-if="project.live" :href="project.live" target="_blank" rel="noopener">
                  <span class="underline-grow">Ver en vivo</span> <span aria-hidden="true">↗</span>
                </a>
                <a v-if="project.repo" :href="project.repo" target="_blank" rel="noopener">
                  <span class="underline-grow">Código</span> <span aria-hidden="true">↗</span>
                </a>
              </div>
            </aside>

            <div class="overlay__narrative">
              <p>{{ project.description }}</p>

              <figure class="overlay__figure">
                <img :src="project.image" :alt="imageAlt" loading="lazy" />
                <figcaption class="meta-xs">
                  {{
                    project.imageKind === 'illustration'
                      ? 'Ilustración conceptual del alcance; no es una captura del sistema.'
                      : 'Captura del proyecto.'
                  }}
                </figcaption>
              </figure>

              <figure v-if="project.capture" class="overlay__figure">
                <img :src="project.capture" :alt="`Captura de ${project.title}`" loading="lazy" />
                <figcaption class="meta-xs">Captura del proyecto.</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
  background: var(--paper);
}

.overlay__panel {
  min-height: 100%;
  padding-bottom: var(--space-9);
}

/* La barra queda pegada arriba: en una ficha larga, el botón de cerrar
   tiene que seguir disponible sin volver al principio. */
.overlay__bar {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--paper);
  border-bottom: 1px solid var(--rule-strong);
}

.overlay__bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-4);
}

.overlay__code {
  color: var(--accent);
}

.overlay__close {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--step-meta);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
  transition: color var(--dur-ui) var(--ease-ui);
}

.overlay__close:hover {
  color: var(--accent);
}

.overlay__content {
  padding-top: var(--space-8);
}

.overlay__title-block {
  max-width: 22ch;
  margin-bottom: var(--space-8);
}

.overlay__client {
  color: var(--accent);
  margin-bottom: var(--space-4);
}

.overlay__tagline {
  margin-top: var(--space-4);
  color: var(--ink-muted);
  max-width: 40ch;
}

.overlay__body {
  display: grid;
  gap: var(--space-7);
  padding-top: var(--space-7);
  border-top: 1px solid var(--rule);
}

@media (min-width: 62rem) {
  .overlay__body {
    grid-template-columns: 16rem 1fr;
    gap: var(--space-9);
  }
}

.overlay__facts > div {
  padding-block: var(--space-3);
  border-bottom: 1px solid var(--rule);
}

.overlay__facts dd {
  margin-top: var(--space-1);
  color: var(--ink);
  font-size: var(--step-body-s);
}

.overlay__stack {
  margin-top: var(--space-5);
}

.overlay__stack-list {
  margin-top: var(--space-3);
  flex-direction: column;
  gap: var(--space-2);
}

/* En columna, el punto separador de .tag-list sobra. */
.overlay__stack-list li + li::before {
  content: none;
}

.overlay__links {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-6);
  font-size: var(--step-body-s);
  color: var(--accent);
}

.overlay__narrative {
  max-width: 68ch;
}

.overlay__narrative > p {
  font-size: var(--step-lead);
  line-height: 1.6;
  color: var(--ink-body);
}

.overlay__figure {
  margin-top: var(--space-7);
}

.overlay__figure img {
  width: 100%;
  height: auto;
  border: 1px solid var(--rule-strong);
}

.overlay__figure figcaption {
  margin-top: var(--space-3);
  text-transform: none;
  letter-spacing: 0.04em;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity var(--dur-ui) var(--ease-ui);
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
