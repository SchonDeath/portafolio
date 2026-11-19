<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { profile, clientWork } from '@/data/profile'
import { prefersReducedMotion } from '@/composables/useEditorial'

import horizonte from '@/assets/collage/horizonte.mp4'
import desierto from '@/assets/collage/desierto.mp4'
import horizontePoster from '@/assets/collage/horizonte-poster.webp'
import cieloAndes from '@/assets/collage/cielo.webp'
import papelFormulario from '@/assets/collage/documento.webp'
import papelSello from '@/assets/collage/banco.webp'

/**
 * Portada: un horizonte andino entre dos tiras de collage.
 *
 * DOS ESTADOS. Al llegar, la portada es un tríptico de tres paneles
 * iguales —papel, horizonte, sello— con un «Bienvenido» sobre el del
 * centro. Es lo único que se ve: la página no baja y el único camino es
 * el botón «Iniciar». Al pulsarlo el saludo se retira, el panel central se
 * expande hasta dejar los papeles como dos tiras al margen, y la
 * información y la navegación entran en cascada.
 *
 * El estado de bienvenida lo decide un script en index.html antes de la
 * primera pintura (html[data-intro]); aquí solo se sale de él. Todo el
 * contenido está en el DOM desde el principio: sin JS el atributo no
 * existe y la portada se lee entera.
 *
 * La apertura es un clip-path sobre el escenario, no un cambio de ancho:
 * el vídeo y el texto se componen una vez a tamaño final y la animación
 * solo recorta, sin recalcular el layout en cada fotograma.
 *
 * EL VÍDEO ES UNA MEJORA, NO LA PORTADA. Lo primero que pinta es una
 * imagen fija (el primer fotograma, 20 kB); el vídeo se monta después
 * del arranque y solo en pantallas anchas, sin reduce-motion y sin ahorro
 * de datos. Hasta que empieza a reproducirse es invisible, así que nunca
 * hay un recuadro negro.
 *
 * DOS VÍDEOS EN BUCLE: los Andes y el desierto con la Vía Láctea, los dos
 * al anochecer y con el horizonte casi a la misma altura. Se alternan con
 * un fundido en el último segundo de cada uno, no con un corte: el
 * siguiente arranca debajo y aparece encima mientras el anterior acaba.
 * El desierto solo se pide cuando los Andes ya se están reproduciendo, y
 * hasta que puede reproducirse entero los Andes se repiten solos.
 *
 * Son los originales sin la pista de audio y SIN recomprimir (1,1 y
 * 1,4 MB). Una versión de 280 kB se probó y se descartó: a pantalla
 * completa, los degradados del cielo y las zonas oscuras se llenaban de
 * bandas y bloques. Como no retrasan la primera pintura, el peso extra
 * se paga sin que nadie espere.
 *
 * En móvil la imagen es otra: la vertical del mismo horizonte, que
 * encuadra bien en retrato donde el vídeo apaisado se recortaría entero.
 */

// La portada no usa los gestos de useEditorial: su entrada es la apertura
// de la bienvenida, y el escalonado que aquellos escriben en línea
// taparía los retrasos de la cascada.
const nameEl = ref<HTMLElement | null>(null)

const videoOn = ref(false)
const playing = ref(false)

/* ── Bucle de vídeos ─────────────────────────────────────── */

const clips = [horizonte, desierto]
/** Duración del fundido entre vídeos, en segundos. */
const CROSSFADE = 1.2

const active = ref(0)
/** El segundo vídeo se monta cuando el primero ya se ve. */
const secondMounted = ref(false)
/** …y entra en el bucle cuando puede reproducirse sin cortes. */
const secondReady = ref(false)
const videoEls: (HTMLVideoElement | null)[] = []

// Vue escribe `muted` como propiedad después de crear el elemento, y
// Safari de iOS decide el autoplay antes: sin esto, en iPhone el vídeo se
// queda parado. Se fuerza aquí y se pide play() a mano.
const setVideo = (i: number, el: HTMLVideoElement | null) => {
  if (el && videoEls[i] !== el) {
    el.muted = true
    el.defaultMuted = true
    if (i === 0) el.play().catch(() => {})
  }
  videoEls[i] = el
}

const onPlaying = (i: number) => {
  if (i !== 0) return
  playing.value = true
  secondMounted.value = true
}

const onTimeUpdate = (i: number) => {
  const current = videoEls[i]
  if (i !== active.value || !current?.duration || !secondReady.value) return
  if (current.duration - current.currentTime > CROSSFADE) return

  const nextIndex = (i + 1) % clips.length
  const next = videoEls[nextIndex]
  if (!next) return
  next.currentTime = 0
  next.play().catch(() => {})
  active.value = nextIndex
}

/* ── Bienvenida ──────────────────────────────────────────── */

const intro = ref(document.documentElement.hasAttribute('data-intro'))
/** true desde que se pulsa «Bienvenido»: activa los retrasos de la cascada. */
const opening = ref(false)

const enter = async () => {
  if (!intro.value) return
  intro.value = false
  opening.value = true
  // El atributo se quita DESPUÉS de que Vue pinte la clase hero--opening:
  // si cayeran en ticks distintos, las transiciones arrancarían sin los
  // retrasos de la cascada y la información llegaría antes que la ventana.
  await nextTick()
  document.documentElement.removeAttribute('data-intro')
  detach()
  // El foco va al nombre: quien navega con teclado o lector de pantalla
  // sigue desde lo que acaba de aparecer, no desde un botón que ya no está.
  nextTick(() => nameEl.value?.focus({ preventScroll: true }))
}

// Mientras dura la bienvenida, el resto de la página está bloqueado: el
// scroll lo corta base.css y el teclado, inert en todo lo que no es la
// portada. Así el tabulador no se escapa a secciones que no se ven.
const blocked = () =>
  document.querySelectorAll<HTMLElement>('#contenido > :not(#inicio), #contacto')

// Única excepción: el enlace de salto. Quien navega con teclado puede
// usarlo para pasar la bienvenida sin buscar el botón.
const onClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('a[href^="#"]')) enter()
}

const detach = () => {
  window.removeEventListener('click', onClick, true)
  blocked().forEach((el) => (el.inert = false))
}

onMounted(() => {
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  videoOn.value = !prefersReducedMotion() && !saveData

  if (intro.value) {
    window.addEventListener('click', onClick, true)
    blocked().forEach((el) => (el.inert = true))
  }
})

onBeforeUnmount(detach)

const index = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'trayectoria', label: 'Trayectoria' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'formacion', label: 'Formación' },
  { id: 'contacto', label: 'Contacto' },
]
</script>

<template>
  <section id="inicio" class="hero" :class="{ 'hero--opening': opening, 'hero--video': videoOn }">
    <!-- Paneles de collage. Decorativos: alt vacío y fuera del árbol de
         accesibilidad, el contenido está todo en el centro. -->
    <div class="hero__strip hero__strip--left" aria-hidden="true">
      <img :src="papelFormulario" alt="" class="hero__paper hero__paper--full" />
    </div>
    <div class="hero__strip hero__strip--right" aria-hidden="true">
      <img :src="papelSello" alt="" class="hero__paper hero__paper--full" />
    </div>

    <div class="hero__stage">
      <div class="hero__media" aria-hidden="true">
        <picture>
          <!-- Sin vídeo (reduce-motion, ahorro de datos) el móvil usa la
               foto vertical; con vídeo, el primer fotograma, para que el
               fundido no cambie de paisaje. -->
          <source v-if="!videoOn" media="(max-width: 47.99rem)" :srcset="cieloAndes" />
          <img :src="horizontePoster" alt="" fetchpriority="high" decoding="async" />
        </picture>
        <template v-if="videoOn">
          <!-- El primero se repite solo mientras el segundo no esté listo;
               después ninguno lleva loop y el relevo lo hace onTimeUpdate. -->
          <video
            v-for="(clip, i) in clips.slice(0, secondMounted ? 2 : 1)"
            :key="clip"
            :ref="(el) => setVideo(i, el as HTMLVideoElement | null)"
            :src="clip"
            :class="{ 'is-playing': playing && active === i }"
            :autoplay="i === 0"
            :loop="i === 0 && !secondReady"
            preload="auto"
            muted
            playsinline
            disablepictureinpicture
            @playing="onPlaying(i)"
            @canplaythrough="i === 1 && (secondReady = true)"
            @timeupdate="onTimeUpdate(i)"
          />
        </template>
      </div>

      <Transition name="intro">
        <div v-if="intro" class="hero__intro">
          <p class="hero__welcome">Bienvenido</p>
          <button type="button" class="hero__enter" @click="enter">
            Iniciar
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" />
            </svg>
          </button>
        </div>
      </Transition>

      <div class="hero__content" :inert="intro">
        <p class="hero__eyebrow">
          {{ profile.location }}
        </p>

        <h1 ref="nameEl" class="hero__name" tabindex="-1">{{ profile.name }}</h1>

        <p class="hero__role">
          Desarrollador de software
        </p>

        <nav class="hero__index" aria-label="Índice de la página">
          <a v-for="(item, i) in index" :key="item.id" :href="`#${item.id}`">
            <span class="hero__index-num">({{ i + 1 }})</span>
            <span class="hero__index-leader" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="hero__foot">
          <p class="hero__clients">
            <template v-for="(client, i) in clientWork" :key="client.id">
              <span v-if="i" aria-hidden="true"> · </span>{{ client.name }}
            </template>
          </p>
          <p v-if="profile.available" class="hero__status">
            <span class="hero__dot" aria-hidden="true" />
            {{ profile.availableLabel }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  --strip: var(--collage-strip);
  /* Durante la bienvenida los tres paneles miden lo mismo. */
  --intro-window: calc(100% / 3);
  /* Altura del horizonte en la imagen: el saludo se apoya sobre él. En
     la foto vertical de móvil está más abajo que en el vídeo. */
  --horizon: 61%;
  --open-ease: cubic-bezier(0.65, 0, 0.35, 1);
  --open-dur: 1300ms;

  position: relative;
  display: flex;
  min-height: 100svh;
  background: var(--night);
  color: var(--night-ink);
  overflow: hidden;
}

@media (min-width: 48rem) {
  .hero {
    --horizon: 45%;
  }
}

/* ── Móvil ───────────────────────────────────────────────────
   En 390px tres tercios iguales dejan el saludo en una columna de 130px:
   el panel central se ensancha y los papeles quedan como dos bandas.
   Abierta la portada, las tiras de 16px parecían un fallo de render, así
   que el horizonte ocupa todo el ancho. */
@media (max-width: 47.99rem) {
  .hero {
    --intro-window: 64%;
  }

  /* Con vídeo manda el horizonte del vídeo, no el de la foto vertical. */
  .hero--video {
    --horizon: 45%;
  }

  .hero .hero__stage {
    clip-path: inset(0 0);
  }

  .hero .hero__content {
    padding: calc(68px + clamp(3.5rem, 11svh, 6rem)) calc(var(--strip) + var(--space-5)) var(--space-6);
  }

  .hero .hero__name {
    font-size: clamp(2.25rem, 10.5vw, 3rem);
  }

  /* El índice cae sobre la parte oscura del paisaje, bajo el horizonte. */
  .hero .hero__index {
    margin-top: clamp(2.5rem, 12svh, 6.5rem);
    font-size: 1.0625rem;
  }

  .hero .hero__index a {
    padding-block: 0.5rem;
    text-shadow: 0 1px 10px rgb(0 0 0 / 0.5);
  }

  .hero .hero__welcome {
    font-size: clamp(2rem, 9vw, 2.75rem);
  }
}

/* Durante la bienvenida la portada mide exactamente la pantalla. La
   información, aunque oculta, sigue ocupando su sitio, y en ventanas
   bajas (un portátil de 657px, o Windows al 125 %) estiraba la portada
   y dejaba el botón «Iniciar» fuera de la vista, sin forma de llegar a
   él porque el scroll está bloqueado. */
html[data-intro] .hero {
  height: 100svh;
}

/* ── Collage lateral ─────────────────────────────────────────
   Cada panel mide media pantalla: durante la bienvenida se ve entero,
   y abierta la portada el escenario lo tapa salvo la tira del margen. */

.hero__strip {
  position: absolute;
  inset-block: 0;
  width: 50%;
}

.hero__strip--left {
  left: 0;
}

.hero__strip--right {
  right: 0;
}

.hero__paper {
  position: absolute;
  inset-inline: 0;
  width: 100%;
  object-fit: cover;
}

.hero__paper--full {
  inset-block: 0;
  height: 100%;
  object-position: left center;
}

/* ── Escenario ───────────────────────────────────────────── */

.hero__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  clip-path: inset(0 var(--strip));
  transition: clip-path var(--open-dur) var(--open-ease) 120ms;
}

html[data-intro] .hero__stage {
  clip-path: inset(0 calc((100% - var(--intro-window)) / 2));
}

.hero__media,
.hero__media img,
.hero__media video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 1.2s = CROSSFADE en el script: el fundido entre vídeos dura lo mismo
   que el solape en el que ambos se reproducen. */
.hero__media video {
  opacity: 0;
  transition: opacity 1.2s var(--ease-ui);
}

.hero__media video.is-playing {
  opacity: 1;
}

/* Velo de noche desde arriba: el cielo del vídeo aclara hacia el final
   del bucle, y sin él la cabecera y el antetítulo pierden contraste. */
.hero__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgb(11 10 12 / 0.5) 0%,
    rgb(11 10 12 / 0.2) 38%,
    transparent 55%
  );
  transition: opacity var(--open-dur) var(--ease-ui);
}

/* En la bienvenida el cielo va limpio: no hay cabecera que proteger. */
html[data-intro] .hero__media::after {
  opacity: 0;
}

/* Grano de película por encima de la imagen: iguala el vídeo limpio con
   los papeles escaneados. */
.hero__stage::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image: var(--grain);
  opacity: 0.28;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* ── Bienvenida ──────────────────────────────────────────── */

.hero__intro {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.hero__welcome {
  position: absolute;
  left: 50%;
  top: var(--horizon);
  transform: translate(-50%, -112%);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-editorial);
  font-weight: 500;
  /* Cabe en un tercio de pantalla: el panel central de la bienvenida. */
  font-size: clamp(1.375rem, 4.6vw, 4.5rem);
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  /* Blanco puro, no el crema del sitio: sobre la parte clara del cielo el
     crema se lavaba. */
  color: #ffffff;
}

/* Halo oscuro muy suave detrás del saludo: sostiene el contraste del
   blanco sobre el cielo claro sin que se note como una mancha. Va en el
   contenedor y no en el propio saludo: el transform del saludo lo vuelve
   un contexto de apilamiento, y dentro de él un ::before con z-index
   negativo se pinta ENCIMA del texto recortado, agrisándolo. */
.hero__intro::before {
  content: '';
  position: absolute;
  left: 50%;
  top: var(--horizon);
  width: min(100%, 44rem);
  height: clamp(8rem, 26vh, 16rem);
  transform: translate(-50%, -78%);
  background: radial-gradient(closest-side, rgb(11 10 12 / 0.34), transparent);
  pointer-events: none;
}

/* ── Montaje de la bienvenida ────────────────────────────────
   Al cargar, los tres paneles suben de abajo arriba uno tras otro; luego
   el saludo entra con el mismo gesto que el nombre (desde la izquierda,
   disolviendo el desenfoque); el botón llega el último. Solo relleno hacia atrás: al terminar, cada panel vuelve a
   mandar su valor normal y la apertura puede transicionar desde ahí. */

html[data-intro] .hero__strip--left {
  animation: panel-rise 1100ms var(--open-ease) 0ms backwards;
}

html[data-intro] .hero__stage {
  animation: stage-rise 1100ms var(--open-ease) 160ms backwards;
}

html[data-intro] .hero__strip--right {
  animation: panel-rise 1100ms var(--open-ease) 320ms backwards;
}

@keyframes panel-rise {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes stage-rise {
  from {
    clip-path: inset(100% calc((100% - var(--intro-window)) / 2) 0 calc((100% - var(--intro-window)) / 2));
  }
  to {
    clip-path: inset(0 calc((100% - var(--intro-window)) / 2));
  }
}

html[data-intro] .hero__welcome {
  animation: welcome-in 1100ms var(--ease-reveal) 1100ms backwards;
}

@keyframes welcome-in {
  from {
    opacity: 0;
    filter: blur(14px);
    transform: translate(calc(-50% - 64px), -112%);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -112%);
  }
}

html[data-intro] .hero__enter {
  animation: enter-in 700ms var(--ease-reveal) 1800ms backwards;
}

@keyframes enter-in {
  from {
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, 12px);
  }
  to {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
  }
}

/* El único control de la bienvenida: tiene que verse como botón. */
.hero__enter {
  position: absolute;
  left: 50%;
  bottom: clamp(var(--space-6), 9svh, var(--space-8));
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 48px;
  /* En móvil el panel central mide un tercio de 390px: el botón no puede
     pasarse de sus bordes. */
  padding: 0 var(--space-4);
  border: 1px solid var(--night-rule);
  border-radius: 999px;
  background: rgb(11 10 12 / 0.35);
  backdrop-filter: blur(6px);
  font-size: var(--step-body-s);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--night-ink);
  white-space: nowrap;
  transition:
    background-color var(--dur-ui) var(--ease-ui),
    color var(--dur-ui) var(--ease-ui);
}

@media (min-width: 48rem) {
  .hero__enter {
    padding: 0 var(--space-5);
  }
}

.hero__enter:hover {
  background: var(--night-ink);
  color: var(--night);
}

.hero__enter svg {
  animation: nudge 1.8s var(--ease-ui) infinite;
}

@keyframes nudge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

.hero__enter:focus-visible {
  outline-color: var(--night-ink);
}

/* Salida del saludo: se desvanece subiendo y desenfocándose, antes de
   que la ventana termine de abrirse. */
.intro-leave-active .hero__welcome,
.intro-leave-active .hero__enter {
  transition:
    opacity 500ms var(--ease-ui),
    filter 500ms var(--ease-ui),
    transform 700ms var(--ease-reveal);
}

.intro-leave-active {
  transition: opacity 700ms linear;
}

.intro-leave-to .hero__welcome {
  opacity: 0;
  filter: blur(8px);
  transform: translate(-50%, -150%);
}

.intro-leave-to .hero__enter {
  opacity: 0;
  transform: translate(-50%, 12px);
}

/* ── Contenido ───────────────────────────────────────────── */

.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: calc(68px + clamp(8rem, 25svh, 13rem)) calc(var(--strip) + var(--space-5)) var(--space-6);
  text-align: center;
}

/* Entrada en cascada tras la bienvenida. Solo al abrirla: en una visita
   sin bienvenida mandan los gestos normales de useEditorial. Cada hijo
   lleva su retraso; el nombre llega cuando la ventana va por la mitad. */
.hero--opening .hero__content > * {
  transition:
    opacity 1000ms var(--ease-reveal),
    transform 1100ms var(--ease-reveal),
    filter 1000ms var(--ease-reveal),
    visibility 0s;
}

.hero--opening .hero__content > :nth-child(1) { transition-delay: 650ms; }
.hero--opening .hero__content > :nth-child(2) { transition-delay: 720ms; }
.hero--opening .hero__content > :nth-child(3) { transition-delay: 820ms; }
.hero--opening .hero__content > :nth-child(4) { transition-delay: 920ms; }
.hero--opening .hero__content > :nth-child(5) { transition-delay: 1020ms; }

/* Entrada «shimmer sweep»: cada bloque llega entero desde la izquierda
   hasta su sitio centrado mientras se disuelve el desenfoque. Entero y no
   letra a letra: el texto se puede seleccionar y leer en todo momento, y
   un lector de pantalla no recibe el nombre partido en nodos. */
html[data-intro] .hero__content > * {
  opacity: 0;
  transform: translateX(-72px);
  filter: blur(14px);
  visibility: hidden;
}

.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--step-meta);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--night-ink);
  text-shadow: 0 1px 12px rgb(0 0 0 / 0.35);
}

.hero__name {
  margin-top: var(--space-5);
  font-family: var(--font-editorial);
  font-weight: 500;
  font-size: clamp(2.5rem, 5.4vw, 4.75rem);
  line-height: 1;
  letter-spacing: -0.035em;
  color: var(--night-ink);
}

/* El destello: una banda de luz que cruza el nombre una sola vez, cuando
   ya terminó de llegar. Es el mismo color de tinta con una franja más
   clara en medio, recortada al texto; fuera de la franja el nombre se ve
   exactamente igual que sin efecto. */
.hero--opening .hero__name {
  background-image: linear-gradient(
    100deg,
    var(--night-ink) 0%,
    var(--night-ink) 42%,
    #ffffff 48%,
    #ffe2c9 50%,
    #ffffff 52%,
    var(--night-ink) 58%,
    var(--night-ink) 100%
  );
  background-size: 300% 100%;
  background-position: 100% 0;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer-sweep 1600ms var(--ease-ui) 1650ms both;
}

@keyframes shimmer-sweep {
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
}

/* Recibe el foco al abrir la portada solo para situar al lector; no es
   un control, así que no dibuja anillo. */
.hero__name:focus {
  outline: none;
}

.hero__role {
  margin-top: var(--space-4);
  font-family: var(--font-editorial);
  font-size: clamp(1rem, 1.25vw, 1.125rem);
  color: var(--night-ink);
  text-shadow: 0 1px 12px rgb(0 0 0 / 0.45);
}

/* Índice con puntos guía, como la tabla de contenidos de un informe. */
.hero__index {
  display: flex;
  flex-direction: column;
  width: min(100%, 23rem);
  margin-top: clamp(1.5rem, 3.5svh, 2.25rem);
  font-family: var(--font-editorial);
  font-size: 1rem;
  text-align: left;
}

.hero__index a {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  /* Filas juntas, como la tabla de contenidos de un informe: ~30px por
     fila. Siguen por encima del mínimo de 24px para un objetivo táctil. */
  padding-block: 0.3rem;
  line-height: 1.5;
  color: var(--night-ink);
}

.hero__index-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--night-ink-muted);
}

.hero__index-leader {
  flex: 1;
  border-bottom: 1px dotted var(--night-rule);
  transition: border-color var(--dur-ui) var(--ease-ui);
}

.hero__index a:hover .hero__index-leader,
.hero__index a:focus-visible .hero__index-leader {
  border-bottom-color: var(--night-ink);
}

.hero__index a:focus-visible {
  outline-color: var(--night-ink);
}

.hero__foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-8);
  font-family: var(--font-mono);
  font-size: var(--step-meta-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--night-ink-muted);
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.hero__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f28f74;
}

/* En móvil la lista de clientes a pie de portada se vuelve un párrafo
   de cuatro líneas: la sección siguiente los muestra con más espacio. */
@media (max-width: 47.99rem) {
  .hero__clients {
    display: none;
  }
}

/* Con reduce-motion la bienvenida sigue ahí, pero se abre de golpe. */
@media (prefers-reduced-motion: reduce) {
  .hero__stage,
  .hero--opening .hero__content > *,
  .hero__media::after,
  .intro-leave-active,
  .intro-leave-active .hero__welcome,
  .intro-leave-active .hero__enter {
    transition: none;
  }

  .hero__enter svg,
  .hero--opening .hero__name,
  html[data-intro] .hero__strip--left,
  html[data-intro] .hero__strip--right,
  html[data-intro] .hero__stage,
  html[data-intro] .hero__welcome,
  html[data-intro] .hero__enter {
    animation: none;
  }
}
</style>
