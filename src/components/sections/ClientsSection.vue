<script setup lang="ts">
import { computed, ref } from 'vue'
import { clientWork, type ClientWork } from '@/data/profile'
import { useEditorial } from '@/composables/useEditorial'
import ClientWorkOverlay from '@/components/ClientWorkOverlay.vue'

/**
 * Clientes, en tríptico.
 *
 * Va antes que los proyectos porque es la credencial: «Banco Central de
 * Chile» y «Servicio de Impuestos Internos» dicen más que cualquier
 * lista de tecnologías, y quien llega con prisa necesita verlos primero.
 *
 * Es la primera sección en la paleta Ministerio, y el contraste con la
 * noche de la portada es el cambio de registro: de la bienvenida al
 * documento. Cada panel es la placa del logo del
 * cliente, sobre el fondo del propio logo (logoPlate): una institución
 * se reconoce antes por su marca que por su nombre escrito.
 *
 * Un cliente sin placa no ocupa panel: se lista debajo, en una línea con
 * puntos guía, como el anexo de un índice.
 */

const root = ref<HTMLElement | null>(null)
const selectedClient = ref<ClientWork | null>(null)

useEditorial(root)

const panels = computed(() => clientWork.filter((client) => client.logoPlate))
const annex = computed(() => clientWork.filter((client) => !client.logoPlate))

const via = (client: ClientWork) =>
  client.companyLogo ? `vía ${client.company}` : client.company

</script>

<template>
  <section id="clientes" ref="root" class="section clients">
    <div class="shell">
      <header class="clients__head">
        <div class="clients__heading">
          <span class="clients__num">01</span>
          <h2 class="clients__name">Clientes</h2>
          <span class="clients__line" aria-hidden="true" />
        </div>
      </header>

      <div class="clients__intro">
        <h2 class="clients__title" data-line>
          Sistemas donde equivocarse <strong>cuesta caro</strong>.
        </h2>
        <p class="lead clients__lead" data-rise="0.05">
          Banca, seguros y sector público. Software que administra el dinero y los
          datos de otras personas, y que se juzga por cómo se comporta el peor día
          del año.
        </p>
      </div>

      <ul class="clients__panels">
        <li v-for="(client, i) in panels" :key="client.id" :data-rise="i * 0.08">
          <button
            type="button"
            class="panel"
            :aria-label="`Ver los proyectos de ${client.name}`"
            @click="selectedClient = client"
          >
            <!-- alt vacío: el nombre del cliente va escrito justo debajo, y
                 el botón ya lo anuncia en su aria-label. -->
            <span class="panel__plate" :style="{ backgroundColor: client.logoPlate }">
              <img
                :src="client.logo"
                alt=""
                class="panel__logo"
                :class="`panel__logo--${client.id}`"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span class="meta-xs panel__meta">
              <span class="panel__sector">{{ client.sector }} · {{ via(client) }}</span>
              <span>{{ client.period }}</span>
            </span>
            <span class="panel__name">
              <span class="underline-grow">{{ client.name }}</span>
            </span>
            <span class="body-s panel__summary">{{ client.summary }}</span>
            <span class="meta-xs panel__cue" aria-hidden="true">Ver proyectos →</span>
          </button>
        </li>
      </ul>

      <ul v-if="annex.length" class="clients__annex">
        <li v-for="client in annex" :key="client.id">
          <button
            type="button"
            class="annex"
            :aria-label="`Ver los proyectos de ${client.name}`"
            @click="selectedClient = client"
          >
            <span class="meta-xs">Además</span>
            <span class="annex__name">{{ client.name }}</span>
            <span class="annex__leader" aria-hidden="true" />
            <span class="body-s annex__summary">
              {{ client.summary }} · {{ via(client) }} · {{ client.period }}
            </span>
          </button>
        </li>
      </ul>
    </div>

    <Teleport to="body">
      <ClientWorkOverlay :client="selectedClient" @close="selectedClient = null" />
    </Teleport>
  </section>
</template>

<style scoped>
.clients {
  background: var(--paper);
  color: var(--ink-body);
  /* La portada ya separa con su propio borde de fotografía. */
  border-top: 0;
}

/* Cabecera: sello con el número, título y filete que llena la línea; debajo,
   los nombres de las organizaciones en lugar de un contador. */
.clients__head {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-7);
}

.clients__heading {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.clients__num {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: var(--accent);
  color: var(--paper-raised);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
}

.clients__name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--ink);
}

.clients__line {
  flex: 1;
  min-width: 1rem;
  height: 1px;
  background: var(--rule-strong);
}

.clients__intro {
  display: grid;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

@media (min-width: 62rem) {
  .clients__intro {
    grid-template-columns: 1.3fr 1fr;
    gap: var(--space-8);
    align-items: end;
  }
}

.clients__title {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(2.25rem, 4.6vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: var(--ink);
}

.clients__title strong {
  font-weight: 600;
}

.clients__lead {
  max-width: 44ch;
  color: var(--ink-muted);
}

/* ── Tríptico ────────────────────────────────────────────── */

.clients__panels {
  display: grid;
  gap: var(--space-7) var(--grid-gap);
}

@media (min-width: 62rem) {
  .clients__panels {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  height: 100%;
}

/* Placa del logo. El fondo llega en línea desde logoPlate: es el color
   con el que cada marca fue diseñada, no uno del sitio. */
.panel__plate {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  margin-bottom: var(--space-2);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06);
}

@media (min-width: 62rem) {
  .panel__plate {
    aspect-ratio: 4 / 3.4;
  }
}

.panel__logo {
  height: auto;
  transition: transform 900ms var(--ease-reveal);
}

/* Cada logo tiene su propia proporción: el ancho se ajusta a mano para
   que los tres pesen lo mismo a la vista, no para que midan lo mismo. */
.panel__logo--sii {
  width: 64%;
}

.panel__logo--consorcio {
  width: 46%;
}

.panel__logo--banco-central {
  width: 42%;
}

.panel:hover .panel__logo {
  transform: scale(1.05);
}

.panel__meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.panel__sector {
  color: var(--accent);
}

.panel__name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.375rem, 2vw, 1.75rem);
  line-height: 1.1;
  color: var(--ink);
}

.panel__summary {
  color: var(--ink-muted);
}

.panel__cue {
  margin-top: auto;
  padding-top: var(--space-2);
  transition: color var(--dur-ui) var(--ease-ui);
}

.panel:hover .panel__cue {
  color: var(--accent);
}

/* ── Anexo ───────────────────────────────────────────────── */

.clients__annex {
  margin-top: var(--space-8);
}

.annex {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2) var(--space-4);
  width: 100%;
  min-height: 44px;
}

.annex__name {
  font-family: var(--font-editorial);
  font-size: 1.375rem;
  color: var(--ink);
}

.annex__leader {
  flex: 1;
  min-width: 2rem;
  border-bottom: 1px dotted var(--rule-strong);
}

.annex__summary {
  color: var(--ink-muted);
}

.annex:hover .annex__leader {
  border-bottom-color: var(--accent);
}
</style>
