<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { prefersReducedMotion, useEditorial } from '@/composables/useEditorial'
import { experience } from '@/data/profile'

/**
 * Trayectoria como línea de tiempo trazada.
 *
 * La lista anterior era una tabla de filas con bordes: legible, pero
 * indistinguible de un currículum en HTML. Aquí la sucesión se dibuja —
 * una línea vertical que avanza con el scroll y va encendiendo los nodos
 * a su paso— de modo que el orden temporal se ve además de leerse.
 */

const root = ref<HTMLElement | null>(null)
const line = ref<HTMLElement | null>(null)

useEditorial(root)

let ctx: gsap.Context | null = null

onMounted(() => {
  if (prefersReducedMotion()) return

  ctx = gsap.context(() => {
    // La línea se traza de arriba abajo atada al scroll.
    gsap.fromTo(
      line.value,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root.value,
          start: 'top 65%',
          end: 'bottom 75%',
          scrub: true,
        },
      },
    )

    // Cada nodo se enciende cuando la línea lo alcanza.
    gsap.utils.toArray<HTMLElement>('[data-node]').forEach((node) => {
      gsap.fromTo(
        node,
        { scale: 0.4, backgroundColor: 'rgb(from var(--color-line-strong) r g b)' },
        {
          scale: 1,
          backgroundColor: 'rgb(from var(--color-accent) r g b)',
          duration: 0.4,
          ease: 'back.out(2.4)',
          scrollTrigger: { trigger: node, start: 'top 72%', once: true },
        },
      )
    })
  }, root.value ?? undefined)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section v-if="experience.length" ref="root" id="trayectoria" class="scroll-mt-24 py-28 sm:py-44">
    <div class="shell">
      <div class="flex items-center gap-6">
        <p data-rise class="eyebrow whitespace-nowrap">03 — Trayectoria</p>
        <span data-rule class="bg-line-strong h-px flex-1"></span>
      </div>

      <h2
        data-line
        class="mt-12 max-w-3xl text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.03em]"
      >
        Dónde he estado
      </h2>

      <!-- El raíl vive en el contenedor y no en cada fila, para que la
           línea sea continua entre etapas en vez de reiniciarse. -->
      <ol class="relative mt-20 pl-8 sm:pl-12">
        <span
          aria-hidden="true"
          class="bg-line absolute top-2 bottom-2 left-0.75 w-px sm:left-1.25"
        ></span>
        <span
          ref="line"
          aria-hidden="true"
          class="bg-accent absolute top-2 bottom-2 left-0.75 w-px origin-top sm:left-1.25"
        ></span>

        <li
          v-for="item in experience"
          :key="`${item.company}-${item.period}`"
          class="group relative pb-14 last:pb-0"
        >
          <!-- Nodo sobre el raíl -->
          <span
            data-node
            aria-hidden="true"
            class="bg-line-strong absolute top-2 -left-8 h-1.75 w-1.75 rounded-full sm:-left-12 sm:h-2.75 sm:w-2.75"
          ></span>

          <div class="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-10">
            <p data-rise class="text-content-subtle font-mono text-xs tracking-wide sm:pt-1.5">
              {{ item.period }}
            </p>

            <div>
              <!-- VASS y SONDA son JPG cuadrados que ya traen su propio
                   fondo sólido dentro del archivo. Por eso van a sangre
                   —`object-cover`, sin padding ni placa—: el recuadro del
                   logo ES el fondo. Con `contain` y una placa blanca detrás
                   quedaba un marco claro alrededor del logo, que se leía
                   como un error de recorte y no como parte de la marca.

                   Es decorativo —el nombre de la empresa está en el h3, a
                   un centímetro— así que va con `alt` vacío para que un
                   lector de pantalla no lo lea dos veces. -->
              <div data-rise class="flex items-center gap-4">
                <img
                  v-if="item.logo"
                  :src="item.logo"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  class="ring-line size-11 shrink-0 overflow-hidden rounded-lg object-cover ring-1 sm:size-13"
                />
                <h3
                  data-rise="0.05"
                  class="text-content-strong text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {{ item.role }}
                  <span class="text-content-subtle font-normal">— {{ item.company }}</span>
                </h3>
              </div>
              <p data-rise="0.12" class="text-content-muted mt-3 max-w-2xl leading-relaxed">
                {{ item.description }}
              </p>

              <!-- Clientes de la etapa. En consultoría el trabajo real
                   se reconoce por el cliente, no por quien contrata, así
                   que este nivel no es un detalle: es lo que distingue
                   tres años en un banco de tres años en una consultora.

                   Va sangrado contra una línea propia —más fina que el
                   raíl de la trayectoria— para que se lea como un
                   desglose de la etapa y no como etapas nuevas. -->
              <ul v-if="item.clients?.length" class="border-line mt-6 space-y-5 border-l pl-6">
                <li v-for="client in item.clients" :key="client.name">
                  <!-- El logo del cliente va más pequeño que el de la
                       empresa: la jerarquía visual tiene que coincidir con
                       la del texto, o el desglose compite con la etapa que
                       lo contiene.

                       La placa es apaisada y no cuadrada porque estos tres
                       logos lo son —el del SII y el del Banco Central son
                       mucho más anchos que altos—, y en un cuadrado
                       `object-contain` los encogía hasta volverlos
                       ilegibles: la altura útil quedaba en un tercio de la
                       caja. Con una caja ancha ocupan el espacio real que
                       tienen.

                       El fondo es el mismo que en la grilla de proyectos:
                       la clase por `id` trae el color de marca de cada uno
                       —el azul del SII y el Banco Central, el blanco de
                       Consorcio, el naranjo de Tukiin— para que el mismo
                       cliente no se vea de dos maneras según la sección.
                       Hace falta además porque son PNG transparentes: dos
                       tienen las letras blancas e invisibles sobre blanco. -->
                  <div data-rise="0.18" class="flex items-center gap-3">
                    <img
                      v-if="client.logo"
                      :src="client.logo"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      class="ring-line logo-plate h-8 w-16 shrink-0 rounded-md object-contain px-1.5 py-1 ring-1"
                      :class="client.id && `client-logo-stage--${client.id}`"
                    />
                    <p class="text-content-strong font-mono text-xs tracking-[0.18em] uppercase">
                      {{ client.name }}
                    </p>
                  </div>

                  <!-- Los proyectos son una enumeración, no una lista con
                       viñetas: separarlos por una barra fina los mantiene
                       compactos y evita que cuatro nombres se lean como
                       cuatro cargos distintos. -->
                  <ul class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <li
                      v-for="(project, index) in client.projects"
                      :key="project"
                      class="text-content-muted flex items-center gap-3 text-sm"
                    >
                      <span
                        v-if="index > 0"
                        aria-hidden="true"
                        class="bg-line-strong h-3 w-px"
                      ></span>
                      {{ project }}
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
