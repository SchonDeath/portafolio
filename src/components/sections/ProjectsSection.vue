<script setup lang="ts">
import { ref } from 'vue'
import { projects } from '@/data/profile'
import { useEditorial } from '@/composables/useEditorial'
import { useProjectOverlay } from '@/composables/useProjectOverlay'

/**
 * Índice de proyectos.
 *
 * Lista tabular numerada en vez de la grilla de tarjetas anterior. El
 * motivo no es el ahorro: una grilla obliga a recortar cada proyecto al
 * mismo tamaño, y aquí los siete no pesan lo mismo. La lista deja que
 * los tres destacados abran su portada y que los otros cuatro ocupen una
 * fila — la jerarquía se ve sin tener que declararla con un badge.
 */

const root = ref<HTMLElement | null>(null)
const { open } = useProjectOverlay()

useEditorial(root)
</script>

<template>
  <section id="proyectos" ref="root" class="section ruled">
    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">02</span>
          <span aria-hidden="true"> / </span>
          <span>Proyectos</span>
        </p>
        <p class="meta-xs">2022 — {{ new Date().getFullYear() }}</p>
      </header>

      <div class="projects__intro">
        <h2 class="display-l" data-line>
          Del trámite<br />
          <span class="serif-accent">a la pantalla.</span>
        </h2>
      </div>

      <ol class="projects__list">
        <li
          v-for="(project, i) in projects"
          :key="project.id"
          :class="['projects__item', { 'projects__item--featured': project.featured }]"
        >
          <article>
            <button
              type="button"
              class="projects__row"
              :aria-label="`Ver la ficha de ${project.title}`"
              @click="open(project)"
            >
              <span class="meta-xs projects__num">{{ String(i + 1).padStart(2, '0') }}</span>

              <span class="projects__identity">
                <span class="meta-xs projects__client">{{ project.client }}</span>
                <span class="projects__title display-m">
                  <span class="underline-grow">{{ project.title }}</span>
                </span>
                <span class="body-s projects__tagline">{{ project.tagline }}</span>

                <ul class="tag-list projects__stack" :aria-label="`Tecnologías de ${project.title}`">
                  <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
                </ul>
              </span>

              <span class="projects__side">
                <span class="meta-xs">{{ project.year }}</span>
                <span class="meta-xs projects__sector">{{ project.sector }}</span>
                <span class="meta-xs projects__cue" aria-hidden="true">Ver ficha →</span>
              </span>

              <!-- Solo los destacados traen portada. Es lo que hace que la
                   lista tenga relieve sin necesidad de una etiqueta que
                   diga «destacado». -->
              <span v-if="project.featured" class="projects__cover curtain" data-curtain>
                <img
                  :src="project.image"
                  :alt="`${project.imageKind === 'illustration' ? 'Ilustración conceptual' : 'Captura'} de ${project.title}`"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </button>
          </article>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.projects__intro {
  margin-bottom: var(--space-8);
}

.projects__list {
  border-top: 1px solid var(--rule-strong);
}

.projects__row {
  display: grid;
  gap: var(--space-4);
  width: 100%;
  padding-block: var(--space-6);
  border-bottom: 1px solid var(--rule);
  transition: background-color var(--dur-ui) var(--ease-ui);
}

.projects__row:hover {
  background: var(--paper-raised);
}

/* Fila normal: número, identidad, datos al margen. */
@media (min-width: 62rem) {
  .projects__row {
    grid-template-columns: 3rem 1fr 11rem;
    gap: var(--space-6);
    align-items: start;
  }
}

/* Fila destacada: la portada entra como cuarta columna. Alternar el lado
   evitaría la monotonía pero rompería la alineación de los números, que
   es lo que sostiene la lectura de índice. */
@media (min-width: 62rem) {
  .projects__item--featured .projects__row {
    grid-template-columns: 3rem 1fr 11rem 18rem;
  }
}

.projects__num {
  color: var(--accent);
}

.projects__identity {
  display: block;
}

.projects__client {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--ink-faint);
}

.projects__title {
  display: block;
  color: var(--ink);
  font-size: clamp(1.375rem, 2.6vw, 2rem);
}

.projects__tagline {
  display: block;
  margin-top: var(--space-2);
  max-width: 52ch;
  color: var(--ink-muted);
}

.projects__stack {
  margin-top: var(--space-4);
}

.projects__side {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

@media (min-width: 62rem) {
  .projects__side {
    flex-direction: column;
    gap: var(--space-2);
  }
}

.projects__sector {
  color: var(--ink-faint);
}

.projects__cue {
  color: var(--ink-faint);
  transition: color var(--dur-ui) var(--ease-ui);
}

.projects__row:hover .projects__cue {
  color: var(--accent);
}

.projects__cover {
  display: block;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--rule);
}

/* En móvil la portada va a lo ancho y antes de los datos, que es como se
   lee una ficha en una columna. El order la sube sin duplicar marcado. */
@media (max-width: 61.9375rem) {
  .projects__cover {
    order: -1;
    aspect-ratio: 16 / 9;
  }

  .projects__row {
    display: flex;
    flex-direction: column;
  }
}
</style>
