<script setup lang="ts">
import { ref } from 'vue'
import { clientWork, projects, type ClientWork } from '@/data/profile'
import { useEditorial } from '@/composables/useEditorial'
import ClientWorkOverlay from '@/components/ClientWorkOverlay.vue'

/**
 * Índice de clientes.
 *
 * Va antes que los proyectos porque es la credencial: «Banco Central de
 * Chile» y «Servicio de Impuestos Internos» dicen más que cualquier
 * lista de tecnologías, y quien llega con prisa necesita verlos primero.
 *
 * Las tarjetas con placa de logo desaparecieron. En un expediente los
 * organismos se listan, no se exponen como marcas: cada fila lleva su
 * número, el nombre a tamaño display y el logo reducido a un sello
 * discreto al margen. El logo deja de ser el protagonista visual y pasa
 * a ser lo que es — un identificador.
 */

const root = ref<HTMLElement | null>(null)
const selectedClient = ref<ClientWork | null>(null)

useEditorial(root)
</script>

<template>
  <section id="clientes" ref="root" class="section ruled">
    <div class="shell">
      <header class="section-head">
        <div>
          <p class="meta">
            <span class="section-number">01</span>
            <span aria-hidden="true"> / </span>
            <span>Clientes</span>
          </p>
        </div>
        <p class="meta-xs">
          {{ clientWork.length }} organizaciones · {{ projects.length }} proyectos
        </p>
      </header>

      <div class="clients__intro">
        <h2 class="display-l" data-line>
          Sistemas para<br />
          <span class="serif-accent">quien no puede fallar.</span>
        </h2>
        <p class="lead clients__lead" data-rise="0.05">
          Banca, seguros y sector público. Software que administra el dinero y los
          datos de otras personas, y que se juzga por cómo se comporta el peor día
          del año.
        </p>
      </div>

      <ul class="clients__list">
        <li v-for="(client, i) in clientWork" :key="client.id" data-rise="0">
          <button
            type="button"
            class="clients__row"
            :aria-label="`Ver los proyectos de ${client.name}`"
            @click="selectedClient = client"
          >
            <span class="meta-xs clients__num">{{ String(i + 1).padStart(2, '0') }}</span>

            <span class="clients__identity">
              <span class="display-m clients__name">
                <span class="underline-grow">{{ client.name }}</span>
              </span>
              <span class="body-s clients__summary">{{ client.summary }}</span>
            </span>

            <span class="clients__meta">
              <span class="meta-xs">{{ client.sector }}</span>
              <span class="meta-xs">{{ client.period }}</span>
              <span class="meta-xs clients__via">
                {{ client.companyLogo ? 'Vía' : '' }} {{ client.company }}
              </span>
            </span>

            <!-- El logo va al final y en pequeño: identifica la fila, no
                 la encabeza. Fondo neutro porque los archivos llegan en
                 tintas opuestas —el del SII y el del Banco Central son
                 blancos, el de Consorcio azul sobre blanco— y un solo
                 gris medio deja legibles ambos extremos. -->
            <span class="clients__mark">
              <img :src="client.logo" :alt="`Logotipo de ${client.name}`" loading="lazy" />
            </span>

            <span class="clients__cue meta-xs" aria-hidden="true">
              {{ client.projects.length }}
              {{ client.projects.length === 1 ? 'proyecto' : 'proyectos' }} →
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
.clients__intro {
  display: grid;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

@media (min-width: 62rem) {
  .clients__intro {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-8);
    align-items: end;
  }
}

.clients__lead {
  max-width: 44ch;
  color: var(--ink-muted);
}

.clients__list {
  border-top: 1px solid var(--rule-strong);
}

.clients__row {
  display: grid;
  gap: var(--space-3);
  width: 100%;
  padding-block: var(--space-5);
  border-bottom: 1px solid var(--rule);
  transition: background-color var(--dur-ui) var(--ease-ui);
}

/* Rejilla de la fila en escritorio: número, identidad, datos, sello y
   señal de apertura. Las columnas fijas mantienen alineados los cinco
   campos entre filas, que es lo que la hace leerse como tabla. */
@media (min-width: 62rem) {
  .clients__row {
    grid-template-columns: 3rem 1fr 12rem 5rem 9rem;
    gap: var(--space-5);
    align-items: center;
    padding-block: var(--space-6);
  }
}

.clients__row:hover {
  background: var(--paper-raised);
}

.clients__num {
  color: var(--accent);
}

.clients__identity {
  display: block;
}

.clients__name {
  display: block;
  color: var(--ink);
  font-size: clamp(1.25rem, 2.4vw, 1.75rem);
}

.clients__summary {
  display: block;
  margin-top: var(--space-2);
  max-width: 52ch;
  color: var(--ink-muted);
}

.clients__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

@media (min-width: 62rem) {
  .clients__meta {
    flex-direction: column;
    gap: var(--space-1);
  }
}

.clients__via {
  color: var(--ink-faint);
}

/* Placa del sello. El gris medio no es decorativo: los logos llegan en
   PNG con transparencia y tintas opuestas, y sobre papel claro los
   blancos desaparecerían. */
.clients__mark {
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 2.75rem;
  padding: var(--space-2);
  background: #46505e;
  border: 1px solid var(--rule);
}

.clients__mark img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.clients__cue {
  color: var(--ink-faint);
  transition: color var(--dur-ui) var(--ease-ui);
}

@media (min-width: 62rem) {
  .clients__cue {
    text-align: right;
  }
}

.clients__row:hover .clients__cue {
  color: var(--accent);
}
</style>
