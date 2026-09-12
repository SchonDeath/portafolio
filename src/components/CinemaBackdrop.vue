<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createCinemaScene, cinemaPalettes, type CinemaScene } from '@/composables/useCinemaScene'
import { prefersReducedMotion } from '@/composables/useEditorial'
import { useTheme } from '@/composables/useTheme'

/**
 * Telón 3D del sitio entero.
 *
 * Va fijo detrás de todo el contenido y no se desmonta entre secciones:
 * es una sola escena continua cuyo avance lo dicta el scroll de la
 * página. El HTML de las secciones flota encima como sobreimpresión.
 *
 * El canvas es puramente decorativo —toda la información vive en el
 * DOM— así que queda fuera del árbol de accesibilidad.
 */

const { theme } = useTheme()

const canvas = ref<HTMLCanvasElement | null>(null)

/**
 * Viñeteado del telón. Sigue al tema porque su trabajo es asentar el
 * texto contra el fondo, y el fondo se invierte: oscurecer un cielo
 * diurno lo ensucia en vez de dar contraste.
 */
const vignette = computed(() =>
  theme.value === 'dark'
    ? 'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 30%, rgba(3, 6, 14, 0.55) 100%)'
    : 'radial-gradient(ellipse 90% 75% at 50% 50%, rgba(255, 255, 255, 0.35) 30%, rgba(232, 240, 248, 0.75) 100%)',
)
let scene: CinemaScene | null = null
let trigger: ScrollTrigger | null = null

const onPointerMove = (e: PointerEvent) => {
  scene?.setPointer(
    (e.clientX / window.innerWidth) * 2 - 1,
    -((e.clientY / window.innerHeight) * 2 - 1),
  )
}

onMounted(() => {
  if (!canvas.value) return

  // Con reduce-motion no hay viaje: la escena quedaría moviéndose bajo
  // un contenido que no se anima, que es justo lo que la preferencia
  // pide evitar. El fondo plano del tema hace su papel.
  if (prefersReducedMotion()) return

  scene = createCinemaScene(cinemaPalettes[theme.value])
  scene.mount(canvas.value)

  // El scroll de la página entera es el eje del recorrido. `scrub` en
  // lugar de una animación por tiempo: la cámara responde al gesto del
  // usuario, no a un reloj propio, que es lo que la hace sentir atada
  // a la mano.
  trigger = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => scene?.setProgress(self.progress),
  })

  window.addEventListener('pointermove', onPointerMove, { passive: true })
})

watch(theme, (value) => scene?.setPalette(cinemaPalettes[value]))

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  trigger?.kill()
  scene?.dispose()
})
</script>

<template>
  <div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
    <canvas ref="canvas" class="block h-full w-full"></canvas>

    <!-- Velo de legibilidad sobre la escena. El contenido va encima del
         3D, y sin este asiento el texto compite con las estrellas justo
         donde más denso está el campo.

         Pesa en los bordes y deja limpio el centro: cargarlo por igual
         apagaba la escena entera y dejaba el fondo gris lavado, que es
         justo lo que se quería evitar al ponerle un espacio detrás. -->
    <div class="absolute inset-0 transition-[background] duration-500" :style="{ background: vignette }"></div>
  </div>
</template>
