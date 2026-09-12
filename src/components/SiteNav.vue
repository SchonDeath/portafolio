<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { prefersReducedMotion } from '@/composables/useEditorial'
const emit = defineEmits<{ portal: [] }>()
const { theme, toggle } = useTheme()
const menuOpen = ref(false)
const progress = ref(0)
const links = [
  { id: 'proyectos', label: 'Trabajo' },
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'trayectoria', label: 'Trayectoria' },
  { id: 'certificaciones', label: 'Formación' },
  { id: 'contacto', label: 'Hablemos' },
]
const go = (id: string) => {
  menuOpen.value = false
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
const onScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; progress.value = max > 0 ? scrollY / max : 0 }
const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') menuOpen.value = false }
onMounted(() => { window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('keydown', onKeydown); onScroll() })
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKeydown) })
</script>

<template>
  <header class="creative-nav">
    <nav class="wide-shell nav-inner" aria-label="Navegación principal">
      <a href="#inicio" class="nav-brand" aria-label="Sebastián González — Inicio">s<span>g</span><i>®</i></a>
      <p class="nav-note">DESARROLLO DIGITAL<br />CON INTENCIÓN.</p>
      <ul class="desktop-links"><li v-for="link in links" :key="link.id"><a :href="`#${link.id}`" @click.prevent="go(link.id)">{{ link.label }}<span v-if="link.id === 'contacto'" aria-hidden="true"> ↗</span></a></li></ul>
      <div class="nav-controls">
        <button type="button" aria-label="Volver al portal de entrada" title="Ver intro" @click="emit('portal')">◎</button>
        <button type="button" :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'" @click="toggle">◐</button>
        <button class="menu-toggle" type="button" :aria-expanded="menuOpen" aria-controls="creative-menu" :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'" @click="menuOpen = !menuOpen">{{ menuOpen ? '×' : '☰' }}</button>
      </div>
    </nav>
    <div class="nav-progress" :style="{ transform: `scaleX(${progress})` }"></div>
    <Transition name="nav-menu"><div v-if="menuOpen" id="creative-menu" class="mobile-nav"><a v-for="(link, index) in links" :key="link.id" :href="`#${link.id}`" @click.prevent="go(link.id)"><small>0{{ index + 1 }}</small>{{ link.label }}<span>↗</span></a></div></Transition>
  </header>
</template>
