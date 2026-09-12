<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { certifications } from '@/data/profile'

/**
 * Certificaciones como índice, no como muro de insignias.
 *
 * Once certificados puestos como tarjetas con logo llenan la pantalla y
 * no dicen nada: el visitante no compara cursos, busca si sabe lo que
 * necesita. Por eso se leen como una lista tipográfica agrupada por área
 * —Frontend, Backend, Datos, Herramientas— donde el título manda y el
 * emisor, la fecha y la duración quedan como dato de apoyo.
 *
 * El filtro por área no es decorativo: con once filas es la diferencia
 * entre recorrer todo y ver de un golpe qué hay de frontend.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root)

/** Áreas presentes, en orden fijo: el orden no debe bailar según los datos. */
const ORDER = ['Frontend', 'Backend', 'Datos', 'Herramientas', 'Título'] as const

const areas = computed(() =>
  ORDER.filter(area => certifications.some(item => item.area === area)),
)

const active = ref<string>('Todas')

const visible = computed(() =>
  active.value === 'Todas'
    ? certifications
    : certifications.filter(item => item.area === active.value),
)

/** Horas acreditadas: la suma dice más que el número de diplomas. */
const totalHours = computed(() =>
  Math.round(
    certifications.reduce((sum, item) => sum + (parseFloat(item.hours ?? '0') || 0), 0),
  ),
)
</script>

<template>
  <section
    v-if="certifications.length"
    ref="root"
    id="certificaciones"
    class="learning-section scroll-mt-24 py-28 sm:py-44"
  >
    <div class="shell">
      <div class="flex items-center gap-6">
        <p data-rise class="eyebrow whitespace-nowrap">04 — Certificaciones</p>
        <span data-rule class="bg-line-strong h-px flex-1"></span>
      </div>

      <div class="mt-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <h2
          data-line
          class="max-w-3xl text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.03em]"
        >
          Siempre aprendiendo.
        </h2>
        <p data-rise class="text-content-subtle font-mono text-xs">
          {{ certifications.length }} certificados / {{ totalHours }} horas
        </p>
      </div>

      <!-- El filtro es un grupo de radio en la práctica: una sola opción
           activa a la vez. `aria-pressed` lo hace explícito para quien
           navega con lector de pantalla, donde el color no se ve. -->
      <div data-rise class="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filtrar por área">
        <button
          v-for="area in ['Todas', ...areas]"
          :key="area"
          type="button"
          class="cert-filter"
          :aria-pressed="active === area"
          @click="active = area"
        >
          {{ area }}
        </button>
      </div>

      <ul class="mt-12 border-t border-line">
        <li
          v-for="item in visible"
          :key="item.title"
          data-rise
          class="cert-row border-b border-line"
        >
          <!-- Toda la fila es el enlace cuando hay algo que verificar, y
               un div cuando no: un `a` sin href no es accesible por
               teclado y anuncia un destino que no existe. -->
          <component
            :is="item.url ? 'a' : 'div'"
            v-bind="item.url ? { href: item.url, target: '_blank', rel: 'noopener' } : {}"
            class="cert-link"
          >
            <span class="cert-area">{{ item.area }}</span>

            <span class="min-w-0">
              <span class="cert-title">{{ item.title }}</span>
              <span class="cert-meta">
                {{ item.issuer
                }}<template v-if="item.instructor"> · {{ item.instructor }}</template>
                <template v-if="item.hours"> · {{ item.hours }}</template>
              </span>
            </span>

            <span class="cert-date">{{ item.date }}</span>

            <span class="cert-verify">
              <template v-if="item.url">
                Verificar <span aria-hidden="true" class="cert-arrow">↗</span>
                <span class="sr-only">el certificado de {{ item.title }} en Udemy</span>
              </template>
              <template v-else>Título profesional</template>
            </span>
          </component>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.cert-filter {
  padding: 7px 15px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--content-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}
.cert-filter:hover {
  color: var(--content-strong);
  border-color: var(--accent);
}
.cert-filter[aria-pressed='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--surface-deep);
}

/* La fila es una grilla de cuatro columnas en escritorio; en móvil el
   área y la fecha se apilan bajo el título, que es lo único que no
   puede perderse. */
.cert-link {
  display: grid;
  grid-template-columns: 108px 1fr auto auto;
  align-items: baseline;
  gap: 24px;
  padding: 22px 4px;
}
.cert-area {
  color: var(--content-faint);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.cert-title {
  display: block;
  color: var(--content-strong);
  font-size: 17px;
  line-height: 1.35;
  letter-spacing: -0.01em;
}
.cert-meta {
  display: block;
  margin-top: 5px;
  color: var(--content-muted);
  font-size: 13px;
}
.cert-date {
  color: var(--content-subtle);
  font-family: var(--font-mono);
  font-size: 11px;
  white-space: nowrap;
}
.cert-verify {
  color: var(--content-subtle);
  font-family: var(--font-mono);
  font-size: 11px;
  white-space: nowrap;
}
a.cert-link:hover .cert-title {
  color: var(--accent-bright);
}
a.cert-link:hover .cert-verify {
  color: var(--accent-bright);
}
.cert-arrow {
  display: inline-block;
  transition: transform 0.2s var(--ease-out-expo);
}
a.cert-link:hover .cert-arrow {
  transform: translate(2px, -2px);
}
.cert-link:focus-visible {
  outline: 2px solid var(--accent-bright);
  outline-offset: -2px;
}

@media (max-width: 767px) {
  .cert-link {
    grid-template-columns: 1fr auto;
    gap: 6px 16px;
    padding: 18px 2px;
  }
  /* El título toma el ancho completo y el resto se ordena debajo. */
  .cert-area {
    order: -1;
    grid-column: 1 / -1;
  }
  .cert-link > span:nth-child(2) {
    grid-column: 1 / -1;
  }
  .cert-date {
    margin-top: 4px;
  }
  .cert-verify {
    margin-top: 4px;
    text-align: right;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cert-arrow,
  .cert-filter {
    transition: none;
  }
}
</style>
