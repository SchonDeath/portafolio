<script setup lang="ts">
import { ref } from 'vue'
import { projects } from '@/data/profile'
import { useEditorial } from '@/composables/useEditorial'
import { useProjectOverlay } from '@/composables/useProjectOverlay'

/**
 * Proyectos, en clave Hielo.
 *
 * Una sola lista tipográfica, sin fichas ni imágenes. El resto de la lista
 * se atenúa para que la fila activa mande. En pantallas táctiles la
 * descripción queda siempre visible.
 */

const root = ref<HTMLElement | null>(null)
const { open } = useProjectOverlay()

const num = (n: number) => String(n).padStart(2, '0')

useEditorial(root)
</script>

<template>
  <section id="proyectos" ref="root" class="section projects">
    <div class="shell">
      <header class="projects__head">
        <h2 class="projects__title" data-line>Proyectos</h2>
        <p class="projects__meta">
          {{ num(projects.length) }} — 2022/{{ new Date().getFullYear() }}
        </p>
      </header>

      <ol class="projects__list">
        <li v-for="project in projects" :key="project.id" data-rise="0">
          <button
            type="button"
            class="item"
            :aria-label="`Ver la ficha de ${project.title}`"
            @click="open(project)"
          >
            <span class="item__title">{{ project.title }}</span>
            <span class="item__year">{{ project.year }}</span>
            <span class="item__detail">{{ project.client }} · {{ project.tagline }}</span>
          </button>
        </li>
      </ol>
    </div>

  </section>
</template>

<style scoped>
.projects {
  overflow: hidden;
}

.projects__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: clamp(2rem, 6vw, 4.5rem);
}

.projects__title {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 9vw, 7rem);
  font-weight: 300;
  letter-spacing: -0.06em;
  line-height: 0.92;
}

.projects__meta {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: var(--step-body-s);
}

.projects__list {
  border-top: 1px solid var(--rule-strong);
}

.item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-4);
  align-items: baseline;
  width: 100%;
  padding-block: clamp(1rem, 2.4vw, 1.5rem);
  border-bottom: 1px solid var(--rule);
  color: var(--ink);
  text-align: left;
  transition:
    color var(--dur-ui) var(--ease-ui),
    padding-left 450ms var(--ease-reveal);
}

.item__year {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: var(--step-body-s);
  transition: color var(--dur-ui) var(--ease-ui);
}

.item__title {
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2.8vw, 2rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.item__detail {
  grid-column: 1 / -1;
  color: var(--ink-muted);
  font-size: var(--step-body-s);
}

/* Con cursor: la descripción se despliega solo en la fila activa y el
   resto de la lista se retira a un segundo plano. */
@media (hover: hover) {
  .item__detail {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      max-height 400ms var(--ease-reveal),
      opacity var(--dur-ui) var(--ease-ui);
  }

  .projects__list:hover .item {
    color: var(--ink-faint);
  }

  .projects__list .item:hover,
  .item:focus-visible {
    padding-left: var(--space-4);
    color: var(--ink);
  }

  .item:hover .item__detail,
  .item:focus-visible .item__detail {
    max-height: 3rem;
    opacity: 1;
  }

  .item:hover .item__year,
  .item:focus-visible .item__year {
    color: var(--accent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .item,
  .item__detail {
    transition: none;
  }
}
</style>
