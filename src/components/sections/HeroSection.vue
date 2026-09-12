<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { profile } from '@/data/profile'
import { prefersReducedMotion } from '@/composables/useEditorial'

const root = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const videoSource = ref<string>()
const paused = ref(true)
let context: gsap.Context | undefined
let observer: IntersectionObserver | undefined

const toggleVideo = async () => {
  if (!video.value) return
  if (!paused.value) { video.value.pause(); paused.value = true; return }
  videoSource.value ??= window.__portalVideoUrl ?? '/media/create.mp4'
  await nextTick()
  try { await video.value.play(); paused.value = false } catch { paused.value = true }
}

onMounted(async () => {
  if (prefersReducedMotion()) return
  context = gsap.context(() => {
    gsap.from('[data-opening]', { yPercent: 110, duration: 1.25, stagger: .13, ease: 'power4.out', delay: .15 })
    gsap.from('[data-hero-detail]', { y: 20, opacity: 0, duration: .9, stagger: .1, delay: .6 })
    gsap.from('.hero-film', { clipPath: 'inset(50% 0% 50% 0%)', duration: 1.5, ease: 'power3.inOut', delay: .1 })
    gsap.to('.hero-film-inner', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true } })
  }, root.value ?? undefined)
  await toggleVideo()
  observer = new IntersectionObserver(([entry]) => {
    if (!video.value) return
    if (!entry?.isIntersecting) video.value.pause()
    else if (!paused.value) void video.value.play().catch(() => { paused.value = true })
  }, { threshold: .05 })
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => { context?.revert(); observer?.disconnect(); video.value?.pause() })
</script>

<template>
  <section ref="root" id="inicio" class="creative-hero">
    <div class="wide-shell hero-topline" data-hero-detail>
      <p>SEBASTIÁN GONZÁLEZ <span>— DESARROLLADOR FULL-STACK</span></p>
      <p>SANTIAGO, CHILE <span class="signal-dot"></span></p>
    </div>
    <div class="wide-shell hero-composition">
      <div class="hero-film" aria-label="Proceso creativo">
        <div class="hero-film-inner">
          <video ref="video" :src="videoSource" poster="/media/create-poster.jpg" muted loop playsinline preload="none"></video>
        </div>
        <span class="film-label">DEL PRIMER TRAZO<br />AL ÚLTIMO DETALLE.</span>
        <button type="button" class="film-control" :aria-label="paused ? 'Reproducir video' : 'Pausar video'" :aria-pressed="!paused" @click="toggleVideo">{{ paused ? '▶' : 'Ⅱ' }}</button>
      </div>
      <h1 class="hero-display" aria-label="Ideas que se vuelven experiencias.">
        <span class="type-mask"><span data-opening>IDEAS QUE</span></span>
        <span class="type-mask hero-middle"><span data-opening>SE VUELVEN</span></span>
        <span class="type-mask hero-last"><span data-opening>EXPERIENCIAS<span class="red-period">.</span></span></span>
      </h1>
      <div class="hero-bottom" data-hero-detail>
        <p>Frontend con intención.<br />Software para el mundo real.</p>
        <p class="hero-description">Transformo procesos complejos en interfaces claras. Banca, seguros y sector público.</p>
        <a href="#proyectos" class="round-link" aria-label="Explorar clientes y proyectos"><span>VER<br />TRABAJO</span><span aria-hidden="true">↘</span></a>
      </div>
    </div>
    <div class="wide-shell hero-footer" data-hero-detail>
      <span v-if="profile.available"><i class="signal-dot"></i> {{ profile.availableLabel }}</span>
      <span>DISEÑO EN EL DETALLE. CRITERIO EN EL CÓDIGO.</span>
      <a href="#proyectos">DESLIZA PARA EXPLORAR ↓</a>
    </div>
  </section>
</template>

