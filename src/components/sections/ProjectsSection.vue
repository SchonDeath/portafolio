<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { prefersReducedMotion, useEditorial } from '@/composables/useEditorial'
import { clientWork, projects, type ClientWork } from '@/data/profile'
import ClientWorkOverlay from '@/components/ClientWorkOverlay.vue'

const root = ref<HTMLElement | null>(null)
const selectedClient = ref<ClientWork | null>(null)
useEditorial(root)
let context: gsap.Context | undefined
onMounted(() => {
  if (prefersReducedMotion()) return
  context = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('.work-poster').forEach(poster => {
      gsap.from(poster, { clipPath: 'inset(12% 0 12% 0)', duration: 1.1, ease: 'power3.out', scrollTrigger: {trigger: poster, start: 'top 85%', once: true} })
    })
  }, root.value ?? undefined)
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section ref="root" id="proyectos" class="work-section">
    <div class="wide-shell">
      <div class="section-kicker"><span>[01 — TRABAJO SELECCIONADO]</span><span>{{ clientWork.length }} CLIENTES / {{ projects.length }} PROYECTOS</span></div>
      <div class="work-heading">
        <h2 data-line>Experiencia<br /><span class="serif-word">que se ve.</span></h2>
        <p>Detrás de cada logo hay un desafío.<br />Y detrás de cada proyecto, una forma de resolverlo.<span>ELIGE UN CLIENTE PARA ENTRAR ↙</span></p>
      </div>
      <div class="work-grid">
        <article v-for="(client, index) in clientWork" :key="client.id" class="client-card work-card">
          <button type="button" class="work-open" :aria-label="`Ver proyectos de ${client.name}`" @click="selectedClient = client">
            <div class="work-poster" :class="`client-logo-stage--${client.id}`">
              <div class="poster-top"><span>CASO / {{ String(index + 1).padStart(2, '0') }}</span><span>{{ client.sector }}</span></div>
              <span class="poster-orbit" aria-hidden="true"></span>
              <img :src="client.logo" :alt="client.name" loading="lazy" decoding="async" class="work-logo" />
              <div class="poster-bottom"><span>{{ client.period }}</span><span class="poster-enter">VER {{ client.projects.length === 1 ? 'PROYECTO' : 'PROYECTOS' }} <b aria-hidden="true">↗</b></span></div>
            </div>
            <div class="work-caption"><h3>{{ client.name }}</h3><span>{{ client.company }} <img v-if="client.companyLogo" :src="client.companyLogo" alt="" loading="lazy" /></span></div>
            <p class="work-summary">{{ client.summary }}</p>
          </button>
        </article>
      </div>
      <div class="work-end"><span>DEL CONTEXTO AL CÓDIGO.</span><span>2022 — {{ new Date().getFullYear() }}</span></div>
    </div>
    <Teleport to="body"><ClientWorkOverlay :client="selectedClient" @close="selectedClient = null" /></Teleport>
  </section>
</template>

