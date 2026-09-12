<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { prefersReducedMotion, useEditorial } from '@/composables/useEditorial'
import { profile, projects, experience, skills } from '@/data/profile'

/**
 * Declaración de intenciones.
 *
 * En vez de la pareja «titular + dos párrafos» que traía —correcta y
 * anónima— esta sección es una sola frase larga a tamaño de titular que
 * se ilumina palabra a palabra con el scroll. El texto no aparece: se
 * lee, al ritmo al que se baja.
 *
 * Debajo, el stack va inline dentro de la prosa en lugar de en su propia
 * tabla: una lista de tecnologías separada dice menos que verlas
 * nombradas dentro de lo que se hace con ellas.
 */

const root = ref<HTMLElement | null>(null)
const manifesto = ref<HTMLElement | null>(null)

// Los gestos declarativos del resto de la sección siguen viniendo del
// vocabulario compartido; aquí solo se añade lo que es propio.
useEditorial(root)

const since = experience.length ? Math.min(...experience.map(item => Number(item.period.split(' ')[0]))) : ''

/**
 * Cifras de la trayectoria.
 *
 * Se derivan de los datos en vez de escribirse a mano, para que no se
 * queden atrás al añadir un proyecto. Lo que se cuenta son años,
 * proyectos y clientes: «etapas» —que antes era una de las cifras—
 * daba «2», un número que resta en lugar de sumar.
 */
const startYear = Number(since)
const years = Number.isFinite(startYear) ? new Date().getFullYear() - startYear : 0

/** Clientes distintos, no empresas: es el nivel donde está el mérito. */
const clientCount = new Set(
  experience.flatMap((item) => item.clients?.map((client) => client.name) ?? []),
).size

const stats = [
  { value: `${years}+`, label: 'Años en sistemas críticos' },
  { value: String(projects.length), label: 'Proyectos' },
  { value: String(clientCount), label: 'Clientes' },
]

let ctx: gsap.Context | null = null

onMounted(() => {
  if (prefersReducedMotion()) return

  ctx = gsap.context(() => {
    const el = manifesto.value
    if (!el) return

    const split = new SplitText(el, { type: 'words', wordsClass: 'split-word' })

    // Cada palabra pasa de apagada a plena a medida que la sección cruza
    // la pantalla. El `stagger` sobre un `scrub` es lo que produce la
    // lectura progresiva: el scroll es el cursor.
    gsap.fromTo(
      split.words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.35,
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          end: 'bottom 55%',
          scrub: true,
        },
      },
    )
  }, root.value ?? undefined)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section ref="root" id="sobre-mi" class="scroll-mt-24 py-28 sm:py-44">
    <div class="shell">
      <div class="flex items-center gap-6">
        <p data-rise class="eyebrow whitespace-nowrap">02 — Sobre mí</p>
        <span data-rule class="bg-line-strong h-px flex-1"></span>
      </div>

      <!-- El manifiesto. Una sola frase, a tamaño de titular, que se
           enciende con el scroll. -->
      <p
        ref="manifesto"
        class="text-content-strong mt-16 max-w-4xl text-[clamp(1.5rem,3.4vw,2.75rem)] leading-[1.25] font-medium tracking-[-0.02em] sm:mt-24"
      >
        Mi foco está en hacer comprensible lo complejo: interfaces claras,
        arquitectura mantenible y un equipo que pueda seguir construyendo.
      </p>

      <!-- Bio en columna estrecha, desplazada a la derecha: cuelga del
           manifiesto en vez de repetir su ancho. -->
      <div class="mt-20 grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <p data-rise class="text-content-subtle font-mono text-xs tracking-widest uppercase">
            El recorrido
          </p>
        </div>

        <div>
          <p
            v-for="(paragraph, i) in profile.bio"
            :key="i"
            data-line
            class="text-content-muted mt-6 leading-relaxed first:mt-0"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>

      <!-- Stack: agrupado por oficio, en columnas de texto corrido en vez
           de una tabla con filas. La tabla anterior tenía el aire de una
           hoja de cálculo. -->
      <div class="border-line mt-24 grid gap-10 border-t pt-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div v-for="(group, i) in skills" :key="group.label" data-rise="0.05">
          <p class="text-accent mb-4 font-mono text-xs tracking-widest uppercase">
            {{ String(i + 1).padStart(2, '0') }} — {{ group.label }}
          </p>
          <ul class="space-y-1.5">
            <li v-for="item in group.items" :key="item" class="text-content-muted text-sm">
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Cifras, en una barra al pie -->
      <dl class="border-line mt-16 flex flex-wrap gap-x-16 gap-y-8 border-t pt-10">
        <div v-for="stat in stats" :key="stat.label" data-rise="0.05">
          <dd
            class="text-content-strong font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none font-semibold tracking-tight"
          >
            {{ stat.value }}
          </dd>
          <dt class="text-content-subtle mt-2 font-mono text-xs tracking-widest uppercase">
            {{ stat.label }}
          </dt>
        </div>
      </dl>
    </div>
  </section>
</template>
