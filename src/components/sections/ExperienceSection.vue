<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { experience } from '@/data/profile'

/**
 * Trayectoria, en tabla.
 *
 * El timeline vertical con línea y puntos es el formato reflejo de un
 * portafolio, y para tres etapas gasta media pantalla en decorar lo que
 * una tabla dice en tres filas. La tabla además permite comparar los
 * periodos de un vistazo, que es justo lo que se busca aquí.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root)
</script>

<template>
  <section v-if="experience.length" id="trayectoria" ref="root" class="section ruled">
    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">03</span>
          <span aria-hidden="true"> / </span>
          <span>Trayectoria</span>
        </p>
        <p class="meta-xs">{{ experience.length }} etapas</p>
      </header>

      <div class="experience__intro">
        <h2 class="display-l" data-line>
          Tres etapas,<br />
          <span class="serif-accent">un mismo oficio.</span>
        </h2>
      </div>

      <ol class="experience__list">
        <li v-for="(item, i) in experience" :key="item.company" data-rise="0">
          <article class="experience__row">
            <div class="experience__period">
              <span class="meta-xs experience__num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="meta-xs">{{ item.period }}</span>
            </div>

            <div class="experience__org">
              <h3 class="display-m">{{ item.company }}</h3>
              <p class="meta-xs experience__role">{{ item.role }}</p>
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

.experience__list {
  border-top: 1px solid var(--rule-strong);
}

.experience__row {
  display: grid;
  gap: var(--space-4);
  padding-block: var(--space-6);
  border-bottom: 1px solid var(--rule);
}

@media (min-width: 62rem) {
  .experience__row {
    grid-template-columns: 9rem 14rem 1fr;
    gap: var(--space-6);
    align-items: start;
    padding-block: var(--space-7);
  }
}

.experience__period {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

@media (min-width: 62rem) {
  .experience__period {
    flex-direction: column;
    gap: var(--space-2);
  }
}

.experience__num {
  color: var(--accent);
}

.experience__org h3 {
  font-size: clamp(1.25rem, 2.2vw, 1.625rem);
}

.experience__role {
  margin-top: var(--space-2);
  color: var(--ink-faint);
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
