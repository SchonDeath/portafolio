<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { certifications } from '@/data/profile'

/**
 * Formación, como tabla de registro.
 *
 * Once certificados puestos como tarjetas con logo llenan la pantalla y
 * no dicen nada: nadie compara cursos, se busca si sabe lo que hace
 * falta. En tabla se recorren de un vistazo y el código de verificación
 * queda donde debe estar — al lado de cada fila, no escondido.
 *
 * El filtro por área no es decorativo: con once filas es la diferencia
 * entre recorrer todo y ver de golpe qué hay de frontend.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root)

/** Orden fijo: no debe bailar según lleguen los datos. */
const ORDER = ['Frontend', 'Backend', 'Datos', 'Herramientas', 'Título'] as const

const areas = computed(() => ORDER.filter((a) => certifications.some((c) => c.area === a)))

const active = ref<string>('Todas')

const visible = computed(() =>
  active.value === 'Todas'
    ? certifications
    : certifications.filter((item) => item.area === active.value),
)

/** Horas acreditadas: la suma dice más que el número de diplomas. */
const totalHours = computed(() =>
  Math.round(certifications.reduce((sum, c) => sum + (parseFloat(c.hours ?? '0') || 0), 0)),
)
</script>

<template>
  <section v-if="certifications.length" id="formacion" ref="root" class="section ruled">
    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">05</span>
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

      <!-- El scroll horizontal es solo para la tabla, nunca para la
           página: en móvil la columna de título se estrecharía hasta ser
           ilegible si obligáramos a que todo entrase. -->
      <div class="certs__scroll">
        <table class="doc-table certs__table">
          <caption class="visually-hidden">
            Certificaciones y titulación, de la más reciente a la más antigua
          </caption>
          <thead>
            <tr>
              <th scope="col" class="certs__col-num">Nº</th>
              <th scope="col">Título</th>
              <th scope="col" class="certs__col-area">Área</th>
              <th scope="col" class="certs__col-issuer">Emisor</th>
              <th scope="col" class="certs__col-date">Fecha</th>
              <th scope="col" class="certs__col-hours">Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in visible" :key="item.title">
              <td class="certs__col-num">
                <span class="meta-xs certs__num">{{ String(i + 1).padStart(2, '0') }}</span>
              </td>
              <td>
                <a
                  v-if="item.url"
                  :href="item.url"
                  target="_blank"
                  rel="noopener"
                  class="certs__title"
                >
                  <span class="underline-grow">{{ item.title }}</span>
                  <span aria-hidden="true"> ↗</span>
                  <span class="visually-hidden">(verificar certificado, se abre en otra pestaña)</span>
                </a>
                <span v-else class="certs__title">{{ item.title }}</span>
                <span v-if="item.instructor" class="certs__instructor">{{ item.instructor }}</span>
              </td>
              <td class="certs__col-area">
                <span class="meta-xs">{{ item.area }}</span>
              </td>
              <td class="certs__col-issuer">{{ item.issuer }}</td>
              <td class="certs__col-date">{{ item.date }}</td>
              <td class="certs__col-hours">{{ item.hours ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="meta-xs certs__note">
        Los certificados de Udemy enlazan a su página de verificación.
      </p>
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

.certs__scroll {
  overflow-x: auto;
}

.certs__table {
  min-width: 46rem;
}

.certs__num {
  color: var(--accent);
}

.certs__col-num {
  width: 3rem;
}

.certs__col-area {
  width: 8rem;
}

.certs__col-issuer {
  width: 8rem;
}

.certs__col-date {
  width: 11rem;
}

.certs__col-hours {
  width: 7rem;
}

.certs__title {
  display: block;
  color: var(--ink);
  font-weight: 500;
  max-width: 44ch;
}

a.certs__title {
  transition: color var(--dur-ui) var(--ease-ui);
}

a.certs__title:hover {
  color: var(--accent);
}

.certs__instructor {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--step-body-s);
  color: var(--ink-muted);
}

.certs__col-issuer,
.certs__col-date,
.certs__col-hours {
  font-size: var(--step-body-s);
  color: var(--ink-muted);
}

.certs__note {
  margin-top: var(--space-5);
  text-transform: none;
  letter-spacing: 0.04em;
}
</style>
