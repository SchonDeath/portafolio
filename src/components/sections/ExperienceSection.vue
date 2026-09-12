<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { experience } from '@/data/profile'
const root = ref<HTMLElement | null>(null)
useEditorial(root)
</script>

<template>
  <section v-if="experience.length" ref="root" id="trayectoria" class="journey-section">
    <div class="wide-shell">
      <div class="section-kicker"><span>[03 — TRAYECTORIA]</span><span>UN RECORRIDO EN CONSTRUCCIÓN</span></div>
      <div class="journey-heading"><h2 data-line>Cada etapa.<br /><span class="serif-word">Más perspectiva.</span></h2><p>Distintos equipos, distintos desafíos.<br />La misma intención de hacer un buen trabajo.</p></div>
      <ol class="journey-list">
        <li v-for="(item, index) in experience" :key="item.company" data-rise class="journey-item">
          <div class="journey-index">0{{ index + 1 }}<span>↘</span></div>
          <div class="journey-company"><p>{{ item.period }}</p><h3>{{ item.company }}</h3><img v-if="item.logo" :src="item.logo" :alt="`Logo de ${item.company}`" loading="lazy" /><span v-else class="independent-mark" aria-hidden="true">↗</span></div>
          <div class="journey-story"><h4>{{ item.role }}</h4><p>{{ item.description }}</p><ul v-if="item.clients?.length"><li v-for="client in item.clients" :key="client.name"><span>{{ client.name }}</span><small>{{ client.projects.join(' · ') }}</small></li></ul></div>
        </li>
      </ol>
    </div>
  </section>
</template>

