<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { certifications } from '@/data/profile'

/**
 * Formación.
 *
 * Cada certificado se muestra con su imagen: el documento mismo convence
 * más que una fila de tabla.
 *
 * Es un carrusel con scroll-snap dentro del contenedor y sin barra
 * visible: una tarjeta por vista en móvil, varias en escritorio.
 *
 * El título de Duoc no lleva imagen (trae RUT, nota y QR personales):
 * su tarjeta es tipográfica, con el mismo tamaño que las demás.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root)

/** Orden fijo: no debe bailar según lleguen los datos. */
const ORDER = ['Frontend', 'Backend', 'Datos', 'Herramientas', 'Título'] as const

const areas = computed(() => ORDER.filter((a) => certifications.some((c) => c.area === a)))

const active = ref<string>('Todas')
/**
 * El filtro que se está mostrando. Va un paso detrás de `active`: al
 * cambiar de área, las tarjetas actuales salen primero y solo entonces
 * se cambia la lista, para que las nuevas entren en cascada.
 */
const shown = ref<string>('Todas')
/** Cambia en cada filtrado: renueva las claves y relanza la entrada. */
const round = ref(0)
const leaving = ref(false)
const LEAVE_MS = 150
/**
 * Eje compartido (shared axis X): si el filtro nuevo está a la derecha
 * del anterior, el contenido avanza hacia la izquierda; si no, retrocede.
 */
const dir = ref<1 | -1>(1)
const filterIndex = (a: string) => (a === 'Todas' ? -1 : areas.value.indexOf(a as never))

const visible = computed(() =>
  shown.value === 'Todas'
    ? certifications
    : certifications.filter((item) => item.area === shown.value),
)

/** Horas acreditadas: la suma dice más que el número de diplomas. */
const totalHours = computed(() =>
  Math.round(certifications.reduce((sum, c) => sum + (parseFloat(c.hours ?? '0') || 0), 0)),
)

/* ── Carrusel ──────────────────────────────────────────── */

const track = ref<HTMLElement | null>(null)

/* Estado de los extremos para las flechas. */
const atStart = ref(true)
const atEnd = ref(false)

const update = () => {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 4
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
}

const step = (dir: 1 | -1) => {
  const el = track.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('.cert')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollBy({ left: dir * amount, behavior: reduce ? 'auto' : 'smooth' })
}

let leaveTimer: number | undefined

watch(active, (area, prev) => {
  dir.value = filterIndex(area) >= filterIndex(prev) ? 1 : -1
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const swap = async () => {
    shown.value = area
    round.value++
    leaving.value = false
    await nextTick()
    track.value?.scrollTo({ left: 0 })
    update()
  }
  window.clearTimeout(leaveTimer)
  if (reduce) return void swap()
  leaving.value = true
  leaveTimer = window.setTimeout(swap, LEAVE_MS)
})

onMounted(() => {
  update()
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', update)
  window.clearTimeout(leaveTimer)
})
</script>

<template>
  <section v-if="certifications.length" id="formacion" ref="root" class="section ruled">
    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">04</span>
          <span aria-hidden="true"> / </span>
          <span>Formación</span>
        </p>
        <p class="meta-xs">{{ certifications.length }} registros · {{ totalHours }} horas</p>
      </header>

      <div class="certs__intro">
        <h2 class="display-l" data-line>
          Aprender<br />
          <span class="serif-accent">es parte del trabajo.</span>
        </h2>

        <div class="certs__filter" role="group" aria-label="Filtrar por área">
          <button
            type="button"
            class="certs__chip"
            :class="{ 'is-active': active === 'Todas' }"
            :aria-pressed="active === 'Todas'"
            @click="active = 'Todas'"
          >
            Todas
          </button>
          <button
            v-for="area in areas"
            :key="area"
            type="button"
            class="certs__chip"
            :class="{ 'is-active': active === area }"
            :aria-pressed="active === area"
            @click="active = area"
          >
            {{ area }}
          </button>
        </div>
      </div>

      <div class="certs__carousel" role="region" aria-roledescription="galería" aria-label="Certificaciones">
        <ol
          ref="track"
          class="certs__track"
          :class="{ 'is-leaving': leaving }"
          :style="{ '--axis-dir': dir }"
          @scroll.passive="update"
        >
          <li
            v-for="(item, i) in visible"
            :key="`${round}-${item.title}`"
            class="cert"
            :class="{ 'cert--enter': round > 0 }"
            :style="{ '--i': i }"
            :aria-label="`${i + 1} de ${visible.length}`"
          >
            <div class="cert__full">
              <div class="cert__media" :class="{ 'cert__media--type': !item.image }">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="`Certificado de ${item.title}`"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="cert__diploma" aria-hidden="true">
                  <span class="meta-xs">Título técnico de nivel superior</span>
                  <span class="cert__diploma-title">{{ item.title }}</span>
                  <span class="meta-xs">{{ item.issuer }}</span>
                </div>
              </div>

              <div class="cert__body">
                <p class="meta-xs cert__meta">
                  <span class="cert__num">{{ String(i + 1).padStart(2, '0') }}</span>
                  <span>{{ item.area }}</span>
                  <span>{{ item.issuer }}</span>
                </p>
                <h3 class="cert__title">{{ item.title }}</h3>
                <p v-if="item.instructor" class="body-s cert__instructor">{{ item.instructor }}</p>
                <p class="body-s cert__date">
                  {{ item.date }}<template v-if="item.hours"> · {{ item.hours }}</template>
                </p>
                <a
                  v-if="item.url"
                  :href="item.url"
                  target="_blank"
                  rel="noopener"
                  class="meta-xs cert__verify"
                >
                  Verificar <span aria-hidden="true">↗</span>
                  <span class="visually-hidden">(se abre en otra pestaña)</span>
                </a>
              </div>
            </div>

          </li>
        </ol>
      </div>

      <div class="certs__controls">
        <p class="meta-xs certs__note">
          Los certificados de Udemy enlazan a su página de verificación.
        </p>
        <div class="certs__nav" role="group" aria-label="Navegar certificados">
          <button type="button" class="certs__arrow" :disabled="atStart" aria-label="Anterior" @click="step(-1)">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button type="button" class="certs__arrow" :disabled="atEnd" aria-label="Siguiente" @click="step(1)">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.certs__intro {
  display: grid;
  gap: var(--space-6);
  margin-bottom: var(--space-7);
}

@media (min-width: 62rem) {
  .certs__intro {
    grid-template-columns: 1fr auto;
    gap: var(--space-8);
    align-items: end;
  }
}

.certs__filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.certs__chip {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--rule-strong);
  font-family: var(--font-mono);
  font-size: var(--step-meta-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
  transition:
    border-color var(--dur-ui) var(--ease-ui),
    color var(--dur-ui) var(--ease-ui),
    background-color var(--dur-ui) var(--ease-ui);
}

.certs__chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.certs__chip.is-active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

/* ── Carrusel ─────────────────────────────────────────── */

.certs__track {
  /* Sin esto, el texto oculto de «Verificar» (posición absoluta) toma
     como referencia al carrusel y estira la página: scroll horizontal. */
  position: relative;
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  padding-block: var(--space-2) var(--space-3);
  /* Se desplaza con el dedo, el trackpad o las flechas; la barra sobra. */
  scrollbar-width: none;
}

.certs__track::-webkit-scrollbar {
  display: none;
}

.cert {
  position: relative;
  flex: 0 0 min(82%, 22rem);
  scroll-snap-align: start;
  border: 1px solid var(--rule);
  background: var(--paper-raised);
  overflow: hidden;
}

.cert__full {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cert__media {
  position: relative;
  aspect-ratio: 880 / 655;
  overflow: hidden;
  border-bottom: 1px solid var(--rule);
  background: #f7f8fa;
}

.cert__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left top;
}

@media (min-width: 48rem) {
  .cert {
    flex-basis: calc((100% - var(--space-4)) / 2);
  }
}

@media (min-width: 75rem) {
  .cert {
    flex-basis: calc((100% - 2 * var(--space-4)) / 3);
  }
}

/* Tarjeta tipográfica del título: mismo formato, sin datos personales. */
.cert__media--type {
  background: var(--ink);
  color: var(--paper);
}

.cert__media--type::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--grain);
  opacity: 0.3;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.cert__diploma {
  position: absolute;
  inset: var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-5);
  border: 1px solid color-mix(in srgb, var(--paper) 35%, transparent);
}

.cert__diploma-title {
  font-family: var(--font-editorial);
  font-style: italic;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.1;
}

.cert__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  padding: var(--space-5);
}

.cert__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: var(--ink-faint);
}

.cert__num {
  color: var(--accent);
}

.cert__title {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
}

.cert__instructor,
.cert__date {
  color: var(--ink-muted);
}

.cert__verify {
  margin-top: auto;
  padding-top: var(--space-3);
  align-self: flex-start;
  color: var(--accent);
}

.cert__verify:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Controles ──────────────────────────────────────────── */

.certs__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.certs__note {
  text-transform: none;
  letter-spacing: 0.04em;
}

/* Flechas y contador en una sola pieza, con un borde común. */
.certs__nav {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--rule-strong);
}

.certs__arrow {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--ink);
  transition:
    background-color var(--dur-ui) var(--ease-ui),
    color var(--dur-ui) var(--ease-ui);
}

.certs__arrow + .certs__arrow {
  border-left: 1px solid var(--rule-strong);
}

.certs__arrow:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.certs__arrow:disabled {
  color: var(--rule-strong);
  cursor: default;
}

/* ── Animación del filtro ───────────────────────────────── */

/* Eje compartido X: lo que sale se desplaza y se apaga en la dirección
   del avance; lo nuevo llega desde el lado opuesto mientras aparece. */
.certs__track.is-leaving .cert {
  animation: cert-out 150ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

.cert--enter {
  animation: cert-in 300ms cubic-bezier(0, 0, 0.2, 1) both;
}

@keyframes cert-out {
  to {
    opacity: 0;
    transform: translateX(calc(var(--axis-dir, 1) * -30px));
  }
}

@keyframes cert-in {
  from {
    opacity: 0;
    transform: translateX(calc(var(--axis-dir, 1) * 30px));
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cert--enter,
  .certs__track.is-leaving .cert {
    animation: none;
  }

}
</style>
