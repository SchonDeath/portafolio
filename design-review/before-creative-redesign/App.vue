<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import gsap from 'gsap'
import Preloader from '@/components/Preloader.vue'
import PortalGate from '@/components/PortalGate.vue'
import CinemaBackdrop from '@/components/CinemaBackdrop.vue'
import ProjectOverlay from '@/components/ProjectOverlay.vue'
import SiteNav from '@/components/SiteNav.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import ProjectsSection from '@/components/sections/ProjectsSection.vue'
import ExperienceSection from '@/components/sections/ExperienceSection.vue'
import CertificationsSection from '@/components/sections/CertificationsSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import { prefersReducedMotion } from '@/composables/useEditorial'
import { useProjectOverlay } from '@/composables/useProjectOverlay'

/**
 * El portal se muestra en cada carga, también al recargar: es la entrada
 * al sitio, no un aviso que se descarta. Antes se recordaba en
 * sessionStorage y quien recargaba caía directo en el perfil, lo que
 * hacía la bienvenida invisible en la práctica.
 */
const loading = ref(true)
/** El portal se monta antes de que las cortinas se abran, no después. */
const gateMounted = ref(false)
const showGate = ref(true)
const siteReady = ref(false)

// El scroll queda bloqueado mientras cualquiera de las dos pantallas de
// entrada esté al frente. Un solo watcher evita los cuatro puntos donde
// antes había que acordarse de añadir y quitar la clase a mano.
watch(
  [loading, showGate],
  ([isLoading, isGateOpen]) => {
    document.body.classList.toggle('is-locked', isLoading || isGateOpen)
  },
  { immediate: true },
)

/**
 * Cuando el portal se monta bajo el preloader, su entrada se solapa con el
 * fundido del negro. Reabierto luego desde la navegación no hay nada con
 * qué solaparse, así que vuelve a su retraso propio.
 */
const gateIntroDelay = ref(0)

/**
 * Lo que tarda el preloader en destapar el portal desde que avisa con
 * `reveal`: la pausa con la barra llena, y nada más.
 *
 * No incluye el apagado de la barra a propósito. El negro se retira antes de
 * que esta se desvanezca, con el recuadro del vídeo ya debajo y con su misma
 * forma; a partir de ahí los dos gestos corren solapados —la barra se apaga
 * mientras el recuadro se abre— y es ese solape lo que hace que el paso de
 * una pantalla a otra no se lea como dos pasos. Ver `playExit` en
 * `Preloader.vue`: tiene que seguir a la pausa de allí.
 */
const PRELOADER_EXIT_S = 0.15

/** El negro del preloader va a fundirse: montamos lo que quedará detrás. */
const onReveal = () => {
  // El portal se monta ya —así le da tiempo a armar la escena y a tener
  // fotograma— pero su apertura espera a que el preloader se haya quitado
  // de encima.
  //
  // El `reveal` no es el final del preloader: tras emitirlo todavía se
  // queda medio segundo en pantalla montando lo de detrás. Abriendo el
  // recuadro en ese instante, el negro tapaba la primera mitad del
  // crecimiento y lo que se descubría al retirarlo era un plano ya casi a
  // tamaño completo: el gesto existía, pero nadie lo veía empezar.
  //
  // Este retraso cubre esa espera para que la apertura arranque de cero con
  // la pantalla ya despejada, con el recuadro pequeño y visible.
  gateIntroDelay.value = PRELOADER_EXIT_S
  gateMounted.value = true
}

/** Cortinas ya abiertas: el preloader se retira del DOM. */
const onPreloaded = () => {
  loading.value = false
  gateMounted.value = true
}

const onEnter = async () => {
  siteReady.value = true

  // El sitio ya está en el DOM antes de retirar el portal, para que
  // no haya un fotograma de fondo vacío entre ambos.
  await nextTick()
  showGate.value = false

  if (!prefersReducedMotion()) {
    gsap.from('#site', { opacity: 0, duration: 0.8, ease: 'power2.out' })
  }
}

/** Reabre el portal de bienvenida a pedido, desde el botón de la navegación. */
const onReturnToPortal = () => {
  gateIntroDelay.value = 0.35
  showGate.value = true
  window.scrollTo({ top: 0, behavior: 'auto' })
}

const { activeProject, close: closeProject, activeIndex } = useProjectOverlay()
</script>

<template>
  <Preloader v-if="loading" @reveal="onReveal" @done="onPreloaded" />
  <PortalGate
    v-if="showGate && gateMounted"
    :intro-delay="gateIntroDelay"
    @enter="onEnter"
  />

  <div id="site" v-if="siteReady">
    <!-- Telón 3D continuo: vive detrás de todas las secciones y su
         avance lo conduce el scroll de la página. -->
    <CinemaBackdrop />

    <SiteNav @portal="onReturnToPortal" />
    <main>
      <HeroSection />
      <ProjectsSection />
      <AboutSection />
      <ExperienceSection />
      <CertificationsSection />
    </main>
    <ContactSection />
  </div>

  <ProjectOverlay :project="activeProject" :index="activeIndex()" @close="closeProject" />
</template>
