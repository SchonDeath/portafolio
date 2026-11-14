<script setup lang="ts">
import SiteNav from '@/components/SiteNav.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import ClientsSection from '@/components/sections/ClientsSection.vue'
import ExperienceSection from '@/components/sections/ExperienceSection.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import CertificationsSection from '@/components/sections/CertificationsSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'

/**
 * El sitio arranca en su contenido.
 *
 * Antes había un preloader de terminal y un portal con vídeo a pantalla
 * completa: 1.251 líneas entre los dos, y una descarga de 3,1 MB sin
 * techo de tiempo antes de que se viera nada. La entrada ahora es el
 * propio hero, que está en el DOM desde el primer byte y se lee aunque
 * el JS no llegue a ejecutarse.
 */
</script>

<template>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <SiteNav />

  <main id="contenido">
    <HeroSection />
    <!-- Pasada la portada, la paleta Ministerio (tokens.css → .ministerio). -->
    <div class="ministerio">
      <ClientsSection />
      <ExperienceSection />
      <AboutSection />
      <CertificationsSection />
    </div>
  </main>

  <div class="ministerio">
    <ContactSection />
  </div>

</template>
