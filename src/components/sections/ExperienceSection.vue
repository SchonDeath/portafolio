<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { clientWork, experience } from '@/data/profile'

/**
 * Trayectoria: línea de tiempo y detalle.
 *
 * Arriba, una línea horizontal con una parada por institución: el trazo se dibuja al
 * entrar en vista y cada parada aparece cuando la línea llega a ella.
 * Al final, la tabla de siempre con la descripción de cada etapa: la
 * línea orienta, la tabla informa.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root)

const yearOf = (period: string) => period.match(/\d{4}/)?.[0] ?? period

/**
 * Una parada por institución y no por empresa: VASS duró dos clientes,
 * y lo que se recorre en el tiempo es el trabajo, no el empleador.
 * clientWork va del actual al primero; la línea va al revés.
 */
const stops = [...clientWork].sort((a, b) => Number(yearOf(a.period)) - Number(yearOf(b.period)))
</script>

<template>
  <section v-if="experience.length" id="trayectoria" ref="root" class="section ruled">
    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">02</span>
          <span aria-hidden="true"> / </span>
          <span>Trayectoria</span>
        </p>
        <p class="meta-xs">{{ experience.length }} etapas</p>
      </header>

      <div class="experience__intro">
        <h2 class="display-l" data-line>
          Tres instituciones,<br />
          <span class="serif-accent">un mismo oficio.</span>
        </h2>

      </div>

      <!-- Línea de tiempo. Decorativa para lectores de pantalla: la tabla
           de abajo dice lo mismo con más detalle. -->
      <div class="experience__timeline" aria-hidden="true">
        <div class="experience__track">
          <div class="experience__fill" data-rule />
        </div>
        <ol class="experience__stops">
          <li
            v-for="(client, i) in stops"
            :key="client.id"
            class="experience__stop"
            :data-rise="0.25 + i * 0.3"
          >
            <span class="meta-xs experience__stop-year">{{ yearOf(client.period) }}</span>
            <span class="experience__stop-name">{{ client.name }}</span>
            <span class="body-s experience__stop-org">{{ client.sector }} · vía {{ client.company }}</span>
          </li>
        </ol>
      </div>

      <ol class="experience__list">
        <li v-for="(item, i) in experience" :key="item.company" data-rise="0">
          <article class="experience__row">
            <!-- Panel de la empresa: el logo con sus colores de fondo y,
                 encima, el período y el cargo. -->
            <div
              class="experience__panel"
              :class="{ 'has-logo': item.logo }"
              :style="item.logoPlate ? { backgroundColor: item.logoPlate } : undefined"
            >
              <img
                v-if="item.logo"
                :src="item.logo"
                alt=""
                aria-hidden="true"
                class="experience__logo"
                loading="lazy"
                decoding="async"
              />
              <p class="experience__period">
                <span class="experience__num">{{ String(i + 1).padStart(2, '0') }}</span>
                <span>{{ item.period }}</span>
              </p>
              <div class="experience__org">
                <h3 :class="{ 'visually-hidden': item.logo }">{{ item.company }}</h3>
                <p class="experience__role">{{ item.role }}</p>
              </div>
            </div>

            <div class="experience__detail">
              <p>{{ item.description }}</p>

              <ul v-if="item.clients?.length" class="experience__clients">
                <li v-for="client in item.clients" :key="client.name">
                  <span class="experience__client-name">{{ client.name }}</span>
                  <span class="body-s experience__client-projects">
                    {{ client.projects.join(' · ') }}
                  </span>
                </li>
              </ul>
            </div>
          </article>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.experience__intro {
  margin-bottom: var(--space-8);
}

/* ── Línea de tiempo ─────────────────────────────────────── */

.experience__timeline {
  margin-bottom: var(--space-8);
}

.experience__track {
  position: relative;
  height: 2px;
  background: var(--rule-strong);
}

.experience__fill {
  position: absolute;
  inset: 0;
  background: var(--accent);
}

/* El gesto [data-rule] dura lo de un filete; esta línea recorre tres
   etapas y se toma su tiempo, para que las paradas lleguen con ella. */
[data-animate] .experience__fill {
  transition-duration: 1400ms;
}

.experience__stops {
  display: grid;
  gap: var(--space-5);
}

@media (min-width: 48rem) {
  .experience__stops {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
  }
}

.experience__stop {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-5);
  min-width: 0;
}

/* La parada: un anillo sobre la línea, con el fondo de la página dentro. */
.experience__stop::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 0;
  width: 10px;
  height: 10px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  background: var(--paper);
}

/* En móvil las paradas se apilan y la línea deja de pasar por ellas. */
@media (max-width: 47.99rem) {
  .experience__stop::before {
    display: none;
  }
}

.experience__stop-year {
  color: var(--accent);
}

.experience__stop-name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.0625rem;
  line-height: 1.3;
  color: var(--ink);
}

.experience__stop-org {
  color: var(--ink-muted);
}

.experience__list {
  border-top: 1px solid var(--rule-strong);
}

.experience__row {
  display: grid;
  gap: var(--space-5);
  padding-block: var(--space-6);
  border-bottom: 1px solid var(--rule);
}

@media (min-width: 62rem) {
  .experience__row {
    grid-template-columns: 22rem 1fr;
    gap: var(--space-7);
    align-items: start;
    padding-block: var(--space-7);
  }
}

/* El panel toma el negro de los propios logos como fondo, así el
   cuadrado de la imagen se funde con él y no se ve el borde. */
.experience__panel {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 13rem;
  padding: var(--space-5);
  overflow: hidden;
  color: var(--ink);
  border: 1px solid var(--rule);
}

.experience__panel.has-logo {
  background: #121212;
  border-color: transparent;
  color: #ffffff;
}

.experience__logo {
  position: absolute;
  z-index: -1;
  top: 50%;
  left: 50%;
  /* Tamaño nativo del archivo (200 px): más grande se pixela. El fondo
     del panel es el mismo color del logo, así que igual llena el ancho. */
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%);
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.experience__period {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.experience__num {
  color: var(--accent);
}

.has-logo .experience__num {
  color: rgb(255 255 255 / 0.7);
}

.experience__org h3 {
  font-size: clamp(1.25rem, 2.2vw, 1.625rem);
}

.experience__role {
  margin-top: var(--space-1);
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
}

/* Sobre el logo, un degradado al pie para que el cargo se lea aunque
   pase por encima de la palabra de la marca. */
.has-logo .experience__org {
  margin: 0 calc(-1 * var(--space-5)) calc(-1 * var(--space-5));
  padding: var(--space-6) var(--space-5) var(--space-5);
  background: linear-gradient(to top, rgb(0 0 0 / 0.75), transparent);
}

.experience__detail > p {
  max-width: 62ch;
  color: var(--ink-body);
}

/* Los clientes de cada etapa, sangrados bajo su descripción: el filete
   de la izquierda los ata a ella sin necesidad de un subtítulo. */
.experience__clients {
  margin-top: var(--space-5);
  display: grid;
  gap: var(--space-4);
}

.experience__clients > li {
  padding-left: var(--space-4);
  border-left: 1px solid var(--accent-vivid);
}

.experience__client-name {
  display: block;
  color: var(--ink);
  font-weight: 500;
}

.experience__client-projects {
  display: block;
  margin-top: var(--space-1);
  color: var(--ink-muted);
}
</style>
