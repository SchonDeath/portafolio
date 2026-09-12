<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { ClientWork } from '@/data/profile'

/**
 * Anexo de cliente: sus proyectos, en orden, con el contexto de en qué
 * empresa se hicieron.
 *
 * El diálogo aplica `inert` al contenido de detrás en vez de solo atrapar
 * el tabulador. La diferencia importa con lectores de pantalla: sin
 * `inert`, el modo de exploración recorre la página oculta aunque el foco
 * no pueda salir.
 */

const props = defineProps<{ client: ClientWork | null }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

let previousFocus: HTMLElement | null = null
let wasLocked = false
let background: HTMLElement | null = null
let previousInert = false

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab' || !dialog.value) return

  // Se recalcula en cada Tab: el anexo tiene enlaces y desplegables que
  // aparecen o no según el cliente.
  const controls = Array.from(
    dialog.value.querySelectorAll<HTMLElement>('button, a[href], summary, [tabindex="0"]'),
  ).filter((el) => el.getClientRects().length > 0)

  const first = controls[0]
  const last = controls.at(-1)

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

const restore = () => {
  window.removeEventListener('keydown', onKeydown)
  if (background) background.inert = previousInert
  document.body.classList.toggle('is-locked', wasLocked)
  previousFocus?.focus({ preventScroll: true })
}

watch(
  () => props.client,
  async (client, previous) => {
    if (client && !previous) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      wasLocked = document.body.classList.contains('is-locked')
      // El contenido del documento, que es lo que hay que desactivar
      // mientras el anexo está encima.
      background = document.getElementById('contenido')
      previousInert = background?.inert ?? false
      if (background) background.inert = true
      document.body.classList.add('is-locked')
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      closeButton.value?.focus({ preventScroll: true })
    } else if (!client && previous) {
      restore()
    }
  },
)

onBeforeUnmount(() => {
  if (props.client) restore()
})
</script>

<template>
  <Transition name="client-panel">
    <div
      v-if="client"
      ref="dialog"
      class="client-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="`Proyectos de ${client.name}`"
    >
      <header class="client-overlay__bar">
        <div class="shell client-overlay__bar-inner">
          <p class="meta">
            <span class="client-overlay__code">ARCHIVO</span>
            <span aria-hidden="true"> / </span>
            <span>{{ client.name }}</span>
          </p>
          <button ref="closeButton" type="button" class="client-overlay__close" @click="emit('close')">
            Cerrar <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      <div class="shell client-overlay__content">
        <!-- Cabecera del archivo: identificación y contexto -->
        <div class="client-overlay__head">
          <div class="client-overlay__mark">
            <img :src="client.logo" :alt="`Logotipo de ${client.name}`" />
          </div>

          <div>
            <p class="meta client-overlay__sector">{{ client.sector }} · {{ client.period }}</p>
            <h2 class="display-l">{{ client.name }}</h2>
            <p class="lead client-overlay__summary">{{ client.summary }}</p>

            <dl class="client-overlay__facts">
              <div>
                <dt class="meta-xs">
                  {{ client.companyLogo ? 'Empresa desde la que participé' : 'Modalidad' }}
                </dt>
                <dd>{{ client.company }}</dd>
              </div>
              <div>
                <dt class="meta-xs">Proyectos</dt>
                <dd>{{ client.projects.length }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Proyectos del cliente -->
        <ol class="client-overlay__projects">
          <li v-for="(project, index) in client.projects" :key="project.id">
            <article class="client-overlay__project">
              <div class="client-overlay__project-body">
                <p class="meta-xs client-overlay__project-num">
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <span aria-hidden="true"> / </span>
                  <span>{{ project.year }}</span>
                </p>

                <h3 class="display-m">{{ project.title }}</h3>
                <p class="client-overlay__tagline">{{ project.tagline }}</p>
                <p class="client-overlay__description">{{ project.description }}</p>

                <ul class="tag-list client-overlay__stack" :aria-label="`Tecnologías de ${project.title}`">
                  <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
                </ul>

                <details v-if="project.capture" class="client-overlay__details">
                  <summary class="meta">Ver captura de la interfaz</summary>
                  <img :src="project.capture" :alt="`Captura de ${project.title}`" loading="lazy" />
                </details>

                <div v-if="project.live || project.repo" class="client-overlay__links">
                  <a v-if="project.live" :href="project.live" target="_blank" rel="noopener">
                    <span class="underline-grow">Ver proyecto</span> <span aria-hidden="true">↗</span>
                  </a>
                  <a v-if="project.repo" :href="project.repo" target="_blank" rel="noopener">
                    <span class="underline-grow">Ver código</span> <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>

              <figure class="client-overlay__figure">
                <img
                  :src="project.image"
                  :alt="`${project.imageKind === 'brand' ? 'Identidad visual' : 'Imagen representativa'} de ${project.title}`"
                  loading="lazy"
                  decoding="async"
                  :class="{ 'is-brand': project.imageKind === 'brand' }"
                />
                <figcaption class="meta-xs">
                  {{
                    project.imageKind === 'brand'
                      ? 'Identidad visual del proyecto.'
                      : 'Imagen representativa del ámbito del proyecto; no es una captura del sistema.'
                  }}
                </figcaption>
              </figure>
            </article>
          </li>
        </ol>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.client-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
  background: var(--paper);
}

.client-overlay__bar {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--paper);
  border-bottom: 1px solid var(--rule-strong);
}

.client-overlay__bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-4);
}

.client-overlay__code {
  color: var(--accent);
}

.client-overlay__close {
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

.client-overlay__close:hover {
  color: var(--accent);
}

.client-overlay__content {
  padding-block: var(--space-8) var(--space-9);
}

.client-overlay__head {
  display: grid;
  gap: var(--space-6);
  padding-bottom: var(--space-7);
  border-bottom: 1px solid var(--rule-strong);
}

@media (min-width: 62rem) {
  .client-overlay__head {
    grid-template-columns: 12rem 1fr;
    gap: var(--space-8);
    align-items: start;
  }
}

/* Misma placa gris que en el índice, por el mismo motivo: los logos
   llegan en tintas opuestas y sobre papel claro los blancos se pierden. */
.client-overlay__mark {
  display: grid;
  place-items: center;
  width: 12rem;
  height: 7rem;
  padding: var(--space-5);
  background: #46505e;
  border: 1px solid var(--rule);
}

.client-overlay__mark img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.client-overlay__sector {
  margin-bottom: var(--space-3);
  color: var(--accent);
}

.client-overlay__summary {
  margin-top: var(--space-4);
  max-width: 52ch;
  color: var(--ink-muted);
}

.client-overlay__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  margin-top: var(--space-6);
}

.client-overlay__facts dd {
  margin-top: var(--space-1);
  color: var(--ink);
  font-size: var(--step-body-s);
}

.client-overlay__projects > li {
  border-bottom: 1px solid var(--rule);
}

.client-overlay__project {
  display: grid;
  gap: var(--space-6);
  padding-block: var(--space-8);
}

@media (min-width: 62rem) {
  .client-overlay__project {
    grid-template-columns: 1fr 20rem;
    gap: var(--space-8);
    align-items: start;
  }
}

.client-overlay__project-num {
  margin-bottom: var(--space-3);
}

.client-overlay__project-num span:first-child {
  color: var(--accent);
}

.client-overlay__tagline {
  margin-top: var(--space-3);
  color: var(--ink);
  font-size: var(--step-lead);
  line-height: 1.5;
}

.client-overlay__description {
  margin-top: var(--space-4);
  max-width: 66ch;
  color: var(--ink-body);
}

.client-overlay__stack {
  margin-top: var(--space-5);
}

.client-overlay__details {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--rule-strong);
}

.client-overlay__details summary {
  color: var(--ink);
}

.client-overlay__details img {
  width: 100%;
  height: auto;
  margin-top: var(--space-4);
  border: 1px solid var(--rule);
}

.client-overlay__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin-top: var(--space-5);
  font-size: var(--step-body-s);
  color: var(--accent);
}

.client-overlay__figure img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border: 1px solid var(--rule);
}

/* La identidad de marca no se recorta: se muestra entera sobre su color. */
.client-overlay__figure img.is-brand {
  object-fit: contain;
  padding: var(--space-6);
  background: #ce472e;
}

.client-overlay__figure figcaption {
  margin-top: var(--space-3);
  text-transform: none;
  letter-spacing: 0.04em;
}

.client-panel-enter-active,
.client-panel-leave-active {
  transition: opacity var(--dur-ui) var(--ease-ui);
}

.client-panel-enter-from,
.client-panel-leave-to {
  opacity: 0;
}
</style>
