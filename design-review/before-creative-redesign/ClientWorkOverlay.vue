<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { ClientWork } from '@/data/profile'

const props = defineProps<{ client: ClientWork | null }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null
let wasLocked = false

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') { event.preventDefault(); emit('close'); return }
  if (event.key !== 'Tab' || !dialog.value) return
  const controls = Array.from(dialog.value.querySelectorAll<HTMLElement>('button, a[href], summary, [tabindex="0"]')).filter(el => el.getClientRects().length > 0)
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}

const restore = () => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.toggle('is-locked', wasLocked)
  previousFocus?.focus({ preventScroll: true })
}

watch(() => props.client, async (client, previous) => {
  if (client && !previous) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    wasLocked = document.body.classList.contains('is-locked')
    document.body.classList.add('is-locked')
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    closeButton.value?.focus({ preventScroll: true })
  } else if (!client && previous) restore()
})
onBeforeUnmount(() => { if (props.client) restore() })
</script>

<template>
  <Transition name="client-panel">
    <div v-if="client" ref="dialog" role="dialog" aria-modal="true" :aria-label="`Proyectos de ${client.name}`" class="client-dialog fixed inset-0 z-50 overflow-y-auto bg-surface-deep">
      <div class="sticky top-0 z-10 border-b border-line bg-surface-deep/95 backdrop-blur-xl">
        <div class="shell flex items-center justify-between gap-4 py-4">
          <p class="text-content-muted text-xs sm:text-sm">Clientes / <span class="text-content-strong">{{ client.name }}</span></p>
          <button ref="closeButton" type="button" class="secondary-action shrink-0" @click="emit('close')">Cerrar <span aria-hidden="true">×</span></button>
        </div>
      </div>
      <div class="shell py-12 sm:py-20">
        <header class="client-detail-header">
          <div class="detail-logo" :class="`client-logo-stage--${client.id}`"><img :src="client.logo" :alt="client.name" /></div>
          <div>
            <p class="eyebrow mb-4">{{ client.sector }} / {{ client.period }}</p>
            <h2 class="text-[clamp(2rem,5vw,4rem)] leading-tight tracking-tight">{{ client.name }}</h2>
            <p class="text-content-muted mt-5 max-w-2xl leading-relaxed">{{ client.summary }}</p>
            <div class="employer-credit mt-6">
              <img v-if="client.companyLogo" :src="client.companyLogo" alt="" />
              <span><small>{{ client.companyLogo ? 'Empresa desde la que participé' : 'Modalidad de trabajo' }}</small><strong>{{ client.company }}</strong></span>
            </div>
          </div>
        </header>
        <div class="mt-14 border-t border-line sm:mt-20">
          <article v-for="(project, index) in client.projects" :key="project.id" class="client-project border-b border-line py-12 sm:py-16">
            <figure>
              <img :src="project.image" :alt="`${project.imageKind === 'brand' ? 'Identidad visual' : 'Imagen representativa'} de ${project.title}`" class="client-project-image" :class="{ 'client-project-image--brand': project.imageKind === 'brand' }" loading="lazy" decoding="async" />
              <figcaption class="text-content-muted mt-3 text-xs">{{ project.imageKind === 'brand' ? 'Identidad visual del proyecto.' : 'Imagen representativa del ámbito del proyecto.' }}</figcaption>
            </figure>
            <div>
              <p class="text-content-subtle mb-4 font-mono text-xs">{{ String(index + 1).padStart(2, '0') }} / {{ project.year }}</p>
              <h3 class="text-2xl leading-tight tracking-tight sm:text-3xl">{{ project.title }}</h3>
              <p class="text-content-strong mt-4 leading-relaxed">{{ project.tagline }}</p>
              <p class="text-content-muted mt-5 leading-relaxed">{{ project.description }}</p>
              <ul class="mt-6 flex flex-wrap gap-2" aria-label="Tecnologías"><li v-for="tech in project.stack" :key="tech" class="tech-tag">{{ tech }}</li></ul>
              <details v-if="project.capture" class="mt-6 rounded-lg border border-line-strong p-4">
                <summary class="text-content-strong text-sm font-medium">Ver captura de la interfaz</summary>
                <img :src="project.capture" :alt="`Captura de ${project.title}`" class="mt-4 h-auto w-full rounded" loading="lazy" />
              </details>
              <a v-if="project.live" :href="project.live" target="_blank" rel="noopener" class="secondary-action mt-6">Ver proyecto ↗</a>
              <a v-if="project.repo" :href="project.repo" target="_blank" rel="noopener" class="secondary-action mt-6">Ver código ↗</a>
            </div>
          </article>
        </div>
      </div>
    </div>
  </Transition>
</template>
