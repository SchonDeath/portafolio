<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { prefersReducedMotion } from '@/composables/useEditorial'

/**
 * Cabecera del documento.
 *
 * Solo el nombre y las secciones: sin numeración, sin botón de contacto
 * ni selector de tema, para que sobre la portada flote lo mínimo.
 *
 * El tema ya no se elige a mano: sigue al sistema (o a una preferencia
 * guardada antes, si la hay). useTheme se sigue llamando porque es quien
 * escucha los cambios del sistema.
 */

useTheme()

const menuOpen = ref(false)
const progress = ref(0)

/**
 * Mientras la portada ocupa la pantalla, la cabecera se vuelve
 * transparente y toma la tinta clara de la noche: flota sobre el
 * horizonte en vez de tapar su cielo con una franja de papel.
 */
const overHero = ref(true)

const links = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'trayectoria', label: 'Trayectoria' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'formacion', label: 'Formación' },
  { id: 'contacto', label: 'Contacto' },
]

const go = (id: string) => {
  menuOpen.value = false
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

/** Avance de lectura, como el margen numerado de un impreso. */
const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? window.scrollY / max : 0
  const hero = document.getElementById('inicio')
  overHero.value = hero ? window.scrollY < hero.offsetHeight - 68 : false
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <!-- Fuera de la portada la cabecera toma la paleta Ministerio, como el
       contenido que tiene debajo; sobre la portada conserva la noche. -->
  <header class="nav" :class="overHero && !menuOpen ? 'nav--over' : 'ministerio'">
    <div class="shell nav__inner">
      <a href="#inicio" class="nav__brand" @click.prevent="go('inicio')">
        Sebastián González
        <span class="nav__brand-mark" aria-hidden="true">®</span>
      </a>

      <p class="nav__note">
        Desarrollador de software<br />Santiago, Chile
      </p>

      <nav class="nav__links" aria-label="Índice del documento">
        <ul>
          <li v-for="link in links" :key="link.id">
            <a :href="`#${link.id}`" @click.prevent="go(link.id)">
              <span class="underline-grow">{{ link.label }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="nav__controls">
        <button
          type="button"
          class="meta-xs nav__toggle"
          :aria-expanded="menuOpen"
          aria-controls="nav-menu"
          :aria-label="menuOpen ? 'Cerrar índice' : 'Abrir índice'"
          @click="menuOpen = !menuOpen"
        >
          {{ menuOpen ? 'Cerrar' : 'Índice' }}
        </button>
      </div>
    </div>

    <!-- Avance de lectura. aria-hidden: es información redundante para
         quien no ve la barra, y como progressbar exigiría anunciar cada
         cambio de valor durante el scroll. -->
    <div class="nav__progress" aria-hidden="true" :style="{ transform: `scaleX(${progress})` }" />

    <Transition name="menu">
      <nav v-if="menuOpen" id="nav-menu" class="nav__mobile" aria-label="Índice">
        <ul>
          <li v-for="link in links" :key="link.id">
            <a :href="`#${link.id}`" @click.prevent="go(link.id)">
              <span class="display-m">{{ link.label }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.nav {
  transition:
    background-color var(--dur-ui) var(--ease-ui),
    border-color var(--dur-ui) var(--ease-ui),
    transform 900ms var(--ease-reveal) 1000ms,
    opacity 900ms var(--ease-reveal) 1000ms;

  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--rule);
}

.nav__inner {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  height: 68px;
}

.nav__brand {
  position: relative;
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
  padding-right: 0.75em;
  white-space: nowrap;
}

.nav__brand-mark {
  position: absolute;
  top: -0.2em;
  right: 0;
  font-size: 0.5rem;
  color: var(--accent);
}

/* Sobre la portada: sin fondo ni filete, y la tinta redefinida a la de
   la noche. Redefinir los tokens en vez de repetir cada regla con otro
   color deja todo el componente —enlaces, números, foco— resuelto. */
.nav--over {
  --ink: var(--night-ink);
  --ink-body: var(--night-ink);
  --ink-muted: var(--night-ink-muted);
  --ink-faint: var(--night-ink-muted);
  --accent: #f28f74;
  --rule: transparent;
  background: transparent;
  backdrop-filter: none;
}

/* Sobre la portada el contenido de la cabecera se retira de las tiras
   de collage: encima del papel escaneado ningún texto se lee. */
.nav--over .nav__inner {
  width: min(100% - 2 * (var(--collage-strip) + var(--space-5)), var(--measure));
}

/* Durante la bienvenida la cabecera no existe: baja con la información,
   al final de la cascada de la portada. */
html[data-intro] .nav {
  opacity: 0;
  transform: translateY(-100%);
  visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .nav {
    transition: none;
  }
}

/* La nota al margen repite lo que la portada dice a 7rem. */
.nav--over .nav__note {
  display: none;
}

.nav--over .nav__progress {
  opacity: 0;
}

/* La nota al margen es de las primeras cosas que sobran al estrechar:
   el nombre y el índice llevan la misma información. */
.nav__note {
  display: none;
}

@media (min-width: 62rem) {
  .nav__note {
    display: block;
    padding-left: var(--space-5);
    border-left: 1px solid var(--rule-strong);
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    line-height: 1.35;
    color: var(--ink-muted);
  }
}

.nav__links {
  display: none;
  margin-left: auto;
}

@media (min-width: 62rem) {
  .nav__links {
    display: block;
  }

  .nav__links ul {
    display: flex;
    gap: var(--space-5);
  }

  .nav__links a {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4em;
    font-size: var(--step-body-s);
    color: var(--ink-body);
    transition: color var(--dur-ui) var(--ease-ui);
  }

  .nav__links a:hover {
    color: var(--ink);
  }
}

.nav__controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-left: auto;
}

@media (min-width: 62rem) {
  .nav__controls {
    margin-left: var(--space-6);
  }
}

.nav__toggle {
  color: var(--ink-muted);
  transition: color var(--dur-ui) var(--ease-ui);
}

.nav__toggle:hover {
  color: var(--accent);
}

@media (min-width: 62rem) {
  .nav__toggle {
    display: none;
  }
}

.nav__progress {
  height: 2px;
  background: var(--accent-vivid);
  transform-origin: left center;
}

/* ── Índice desplegado (móvil) ───────────────────────────── */

.nav__mobile {
  border-top: 1px solid var(--rule);
  background: var(--paper);
  padding: var(--space-5) var(--gutter) var(--space-7);
  max-height: calc(100svh - 68px);
  overflow-y: auto;
}

.nav__mobile a {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  padding-block: var(--space-3);
  border-bottom: 1px solid var(--rule);
  color: var(--ink);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity var(--dur-ui) var(--ease-ui);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
</style>
