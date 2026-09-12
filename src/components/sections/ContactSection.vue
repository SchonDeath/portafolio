<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { profile, socials } from '@/data/profile'
const root = ref<HTMLElement | null>(null)
const year = new Date().getFullYear()
useEditorial(root)
</script>

<template>
  <footer ref="root" id="contacto" class="contact-studio">
    <div class="wide-shell">
      <div class="section-kicker"><span>[05 — SIGUIENTE CAPÍTULO]</span><span v-if="profile.available"><i class="signal-dot"></i> {{ profile.availableLabel }}</span></div>
      <p class="contact-intro">¿Una idea, un desafío o un equipo al que sumar?</p>
      <a :href="`mailto:${profile.email}`" class="contact-call"><span>HAGAMOS<br /><i>QUE PASE.</i></span><b aria-hidden="true">↗</b></a>
      <div class="contact-details"><a :href="`mailto:${profile.email}`">{{ profile.email }} ↗</a><p>Santiago, Chile.<br />Abierto a nuevas conversaciones.</p></div>
      <div class="contact-bottom"><span>© {{ year }} {{ profile.name }}</span><ul><li v-for="social in socials" :key="social.label"><a :href="social.url" :target="social.url.startsWith('mailto:') ? undefined : '_blank'" rel="noopener">{{ social.label }} ↗</a></li></ul><a href="#inicio">VOLVER ARRIBA ↑</a></div>
    </div>
  </footer>
</template>

