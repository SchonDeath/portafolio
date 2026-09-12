<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { clientWork, projects, type ClientWork } from '@/data/profile'
import ClientWorkOverlay from '@/components/ClientWorkOverlay.vue'

const root = ref<HTMLElement | null>(null)
const selectedClient = ref<ClientWork | null>(null)
useEditorial(root)
</script>

<template>
  <section ref="root" id="proyectos" class="project-section scroll-mt-24 py-24 sm:py-32">
    <div class="shell">
      <div class="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow mb-5">01 — Clientes y proyectos</p>
          <h2 class="text-[clamp(2.2rem,5vw,4rem)] leading-tight tracking-[-0.045em]">Experiencia que se ve.</h2>
          <p class="text-content-muted mt-5 max-w-xl leading-relaxed">
            Cada cliente, una parte del recorrido. Desde VASS, pasando por el trabajo
            independiente, hasta SONDA: conoce los proyectos en los que participé.
          </p>
        </div>
        <span class="text-content-subtle font-mono text-xs">{{ clientWork.length }} clientes / {{ projects.length }} proyectos</span>
      </div>
      <div class="grid gap-8 md:grid-cols-2">
        <article v-for="(client, index) in clientWork" :key="client.id" data-rise class="client-card">
          <button type="button" class="project-link client-link group block h-full w-full text-left" :aria-label="`Ver proyectos de ${client.name}`" @click="selectedClient = client">
            <div class="client-logo-stage" :class="`client-logo-stage--${client.id}`">
              <span class="client-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <img :src="client.logo" :alt="client.name" loading="lazy" decoding="async" />
            </div>
            <div class="project-copy">
              <div class="mb-5 flex flex-wrap items-center gap-3 text-xs">
                <span class="project-sector">{{ client.sector }}</span><span class="text-content-subtle">{{ client.period }}</span>
              </div>
              <h3 class="text-2xl leading-tight tracking-tight">{{ client.name }}</h3>
              <p class="text-content-muted mt-4 leading-relaxed">{{ client.summary }}</p>
              <div class="employer-credit mt-6">
                <img v-if="client.companyLogo" :src="client.companyLogo" alt="" loading="lazy" />
                <span><small>{{ client.companyLogo ? 'Desde' : 'Modalidad' }}</small><strong>{{ client.company }}</strong></span>
              </div>
              <span class="text-content-strong mt-8 flex items-center justify-between gap-4 text-sm font-medium">
                {{ client.projects.length === 1 ? 'Ver proyecto' : `Ver ${client.projects.length} proyectos` }}
                <span aria-hidden="true" class="project-arrow">↗</span>
              </span>
            </div>
          </button>
        </article>
      </div>
    </div>
    <Teleport to="body"><ClientWorkOverlay :client="selectedClient" @close="selectedClient = null" /></Teleport>
  </section>
</template>
