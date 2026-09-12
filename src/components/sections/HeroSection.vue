<script setup lang="ts">
import { ref } from 'vue'
import { profile, clientWork } from '@/data/profile'
import { useEditorial } from '@/composables/useEditorial'

/**
 * Portada del expediente.
 *
 * Esta sección sustituye al preloader y al portal: es la entrada al
 * sitio, y por eso el nombre va a 13vw y los clientes aparecen antes que
 * cualquier descripción. Un reclutador que solo vea esta pantalla ya
 * tiene lo esencial — quién es, qué hace, para quién ha trabajado y cómo
 * escribirle.
 *
 * Todo el contenido está en el DOM desde el primer byte. La animación
 * solo lo revela; si el JS no llega a ejecutarse, la portada se lee igual.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root, { start: 'top 95%' })

/** Año de inicio, para el dato de trayectoria sin escribirlo a mano. */
const startYear = 2022
const years = new Date().getFullYear() - startYear
</script>

<template>
  <section id="inicio" ref="root" class="hero">
    <div class="shell">
      <!-- Encabezado de expediente: el dato administrativo antes del
           nombre, como en la carátula de un documento. -->
      <div class="hero__slug">
        <p class="meta-xs">Portafolio · {{ new Date().getFullYear() }}</p>
        <p class="meta-xs hero__location">{{ profile.location }}</p>
      </div>

      <div class="rule" data-rule />

      <h1 class="display-xl hero__name" data-line>
        Sebastián<br />
        <span class="serif-accent">González</span>
      </h1>

      <div class="hero__grid">
        <div class="hero__role">
          <p class="meta hero__label">Cargo</p>
          <p class="display-m" data-rise="0.05">
            Desarrollador full-stack<br />
            <span class="hero__specialty">especialista en frontend</span>
          </p>
        </div>

        <div class="hero__intro">
          <p class="meta hero__label">Resumen</p>
          <p class="lead" data-rise="0.1">{{ profile.introduction }}</p>

          <div class="hero__actions" data-rise="0.15">
            <a href="#proyectos" class="action action--primary">
              Ver proyectos
              <span class="action__arrow" aria-hidden="true">→</span>
            </a>
            <a :href="`mailto:${profile.email}`" class="action action--ghost">
              Escribir
              <span class="action__arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Los clientes cierran la portada. Es la credencial: pesa más que
           cualquier lista de tecnologías, así que va antes del scroll. -->
      <div class="hero__clients" data-rise="0.2">
        <div class="hero__clients-head">
          <p class="meta hero__label">Trabajo para</p>
          <p class="meta-xs hero__count">
            {{ years }} años · {{ clientWork.length }} organizaciones
          </p>
        </div>
        <ul class="hero__clients-list">
          <li v-for="client in clientWork" :key="client.id">
            <span class="display-m">{{ client.name }}</span>
            <span class="meta-xs">{{ client.period }}</span>
          </li>
        </ul>
      </div>

      <p v-if="profile.available" class="hero__status" data-rise="0.25">
        <span class="status-dot" aria-hidden="true" />
        <span class="meta">{{ profile.availableLabel }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  /* La cabecera fija mide 68px; el padding superior la despeja sin que
     el nombre quede pegado a ella. */
  padding-top: calc(68px + var(--space-8));
  padding-bottom: var(--section-gap);
}

.hero__slug {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.hero__location {
  text-align: right;
}

.hero__name {
  margin-top: var(--space-5);
  margin-bottom: var(--space-8);
  color: var(--ink);
}

.hero__grid {
  display: grid;
  gap: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--rule);
}

@media (min-width: 62rem) {
  .hero__grid {
    grid-template-columns: 1fr 1.4fr;
    gap: var(--space-8);
  }
}

.hero__label {
  margin-bottom: var(--space-3);
  color: var(--ink-faint);
}

.hero__specialty {
  color: var(--ink-muted);
}

.hero__intro .lead {
  max-width: 46ch;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

/* ── Clientes ────────────────────────────────────────────── */

.hero__clients {
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  border-top: 1px solid var(--rule-strong);
}

.hero__clients-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.hero__count {
  text-align: right;
}

.hero__clients-list {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 48rem) {
  .hero__clients-list {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-5) var(--space-6);
  }
}

@media (min-width: 75rem) {
  .hero__clients-list {
    grid-template-columns: repeat(4, 1fr);
  }
}

.hero__clients-list li {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--rule);
}

.hero__clients-list .display-m {
  color: var(--ink);
  /* Los nombres institucionales son largos: a tamaño display necesitan
     bajar un punto para no partirse en cuatro líneas. */
  font-size: clamp(1.125rem, 1.6vw, 1.4rem);
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-7);
}

.hero__status .meta {
  color: var(--ink-muted);
}
</style>
