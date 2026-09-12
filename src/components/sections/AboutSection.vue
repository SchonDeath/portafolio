<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { experience, projects, skills, profile } from '@/data/profile'
const root = ref<HTMLElement | null>(null)
useEditorial(root)
const years = new Date().getFullYear() - Math.min(...experience.map(item => Number(item.period.slice(0, 4))))
</script>

<template>
  <section ref="root" id="sobre-mi" class="about-studio">
    <div class="wide-shell">
      <div class="section-kicker"><span>[02 — LA PERSONA DETRÁS]</span><span>CURIOSIDAD × CRITERIO</span></div>
      <div class="about-composition">
        <div class="about-symbol" aria-hidden="true"><svg viewBox="0 0 200 200"><g fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="100" cy="100" rx="85" ry="32"/><ellipse cx="100" cy="100" rx="85" ry="32" transform="rotate(60 100 100)"/><ellipse cx="100" cy="100" rx="85" ry="32" transform="rotate(120 100 100)"/><circle cx="100" cy="100" r="13" fill="currentColor"/></g></svg><p>{{ profile.name }}<br />DESARROLLADOR / SANTIAGO</p></div>
        <div><h2 data-line>Lo complejo,<br /><span class="serif-word">bien resuelto.</span></h2><p class="about-lead" data-rise>Me interesa lo que ocurre entre una buena idea y un producto que la gente realmente puede usar.</p>
          <div class="about-prose" data-rise><p>Trabajo en sistemas donde cada decisión importa: pensiones, seguros y trámites tributarios. Mi especialidad es el frontend, con experiencia full-stack para entender lo que pasa a ambos lados de la interfaz.</p><p>También acompaño al equipo: distribuyo trabajo, enseño Vue y patrones de arquitectura, y construyo estándares que permiten seguir creciendo.</p></div>
          <a v-if="profile.resume" :href="profile.resume" download class="text-action">Descargar CV ↗</a>
        </div>
      </div>
      <div class="studio-stats"><div><strong>{{ years }}<span>+</span></strong><p>AÑOS CONSTRUYENDO</p></div><div><strong>{{ projects.length.toString().padStart(2,'0') }}</strong><p>PROYECTOS CON CONTEXTO</p></div><div><strong>03</strong><p>ETAPAS PROFESIONALES</p></div></div>
      <div class="stack-grid"><div v-for="(group, index) in skills" :key="group.label" data-rise><span class="stack-number">0{{ index + 1 }} /</span><h3>{{ group.label }}</h3><ul><li v-for="item in group.items" :key="item">{{ item }}</li></ul></div></div>
    </div>
  </section>
</template>

