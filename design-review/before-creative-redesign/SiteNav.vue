<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { profile } from '@/data/profile'

const links = [
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'trayectoria', label: 'Trayectoria' },
  { id: 'certificaciones', label: 'Certificaciones' },
  { id: 'contacto', label: 'Contacto' },
]

const emit = defineEmits<{ portal: [] }>()

const { theme, toggle } = useTheme()

const scrolled = ref(false)
const active = ref('')
const menuOpen = ref(false)

const onScroll = () => (scrolled.value = window.scrollY > 40)

// Un solo observer para todas las secciones; la que esté más arriba
// dentro de la banda central de la pantalla gana el estado activo.
let observer: IntersectionObserver | null = null

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) active.value = visible.target.id
    },
    { rootMargin: '-45% 0px -45% 0px' },
  )

  links.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) observer!.observe(el)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
})

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const go = (id: string) => {
  menuOpen.value = false
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 transition-all duration-500"
    :class="scrolled ? 'border-content-subtle/10 bg-surface-deep/80 border-b backdrop-blur-xl' : ''"
  >
    <nav class="shell flex h-16 items-center justify-between gap-6 sm:h-20">
      <button
        type="button"
        class="text-content-strong hover:text-accent-bright font-display text-sm font-semibold tracking-tight transition-colors"
        @click="toTop"
      >
        {{ profile.name }}
      </button>

      <!-- Escritorio -->
      <ul class="hidden items-center gap-1 md:flex">
        <li v-for="link in links" :key="link.id">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm transition-colors duration-300"
            :class="
              active === link.id
                ? 'text-accent-bright bg-accent-deep/10'
                : 'text-content-muted hover:text-content-strong'
            "
            @click="go(link.id)"
          >
            {{ link.label }}
          </button>
        </li>
      </ul>

      <div class="flex items-center gap-1">
        <!-- Volver al portal de entrada -->
        <button
          type="button"
          class="text-content-muted hover:text-accent-bright hover:bg-accent-deep/10 rounded-full p-2.5 transition-colors duration-300"
          aria-label="Volver al portal de entrada"
          title="Portal de entrada"
          @click="emit('portal')"
        >
          <!-- Anillos concéntricos: el mismo motivo del umbral 3D, para
               que el botón se lea como "vuelve a ese lugar" y no como un
               icono de inicio genérico. -->
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3.2" />
            <circle cx="12" cy="12" r="7.5" opacity="0.55" />
            <circle cx="12" cy="12" r="11" opacity="0.28" />
          </svg>
        </button>

        <!-- Cambio de tema -->
        <button
          type="button"
          class="text-content-muted hover:text-accent-bright hover:bg-accent-deep/10 rounded-full p-2.5 transition-colors duration-300"
          :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          :title="theme === 'dark' ? 'Tema claro' : 'Tema oscuro'"
          @click="toggle"
        >
          <!-- Un solo trazo que se transforma: el círculo se encoge y los
               rayos se retraen, en vez de intercambiar dos iconos. -->
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            aria-hidden="true"
            class="transition-transform duration-500"
            :class="theme === 'dark' ? 'rotate-0' : 'rotate-180'"
          >
            <!-- En claro el círculo crece y una máscara le muerde un lado:
                 sol → luna con la misma figura, sin cambiar de icono. -->
            <mask id="moon-bite">
              <rect width="24" height="24" fill="white" />
              <circle cx="20" cy="7" r="7" :fill="theme === 'dark' ? 'white' : 'black'" />
            </mask>
            <circle
              cx="12"
              cy="12"
              :r="theme === 'dark' ? 5 : 8.5"
              mask="url(#moon-bite)"
              class="transition-all duration-500"
            />
            <g
              class="transition-opacity duration-300"
              :class="theme === 'dark' ? 'opacity-100' : 'opacity-0'"
            >
              <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </g>
          </svg>
        </button>

        <!-- Móvil -->
          <button
          type="button"
          class="text-content hover:text-accent-bright -mr-2 p-2 transition-colors md:hidden"
          :aria-expanded="menuOpen"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          <span class="block h-px w-6 bg-current transition-transform" :class="menuOpen ? 'translate-y-[3px] rotate-45' : ''"></span>
          <span class="mt-[6px] block h-px w-6 bg-current transition-transform" :class="menuOpen ? '-translate-y-[3px] -rotate-45' : ''"></span>
        </button>
      </div>
    </nav>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0"
    >
      <ul
        v-if="menuOpen"
        class="border-content-subtle/10 bg-surface-deep/95 shell space-y-1 border-t py-4 backdrop-blur-xl md:hidden"
      >
        <li v-for="link in links" :key="link.id">
          <button
            type="button"
            class="text-content hover:text-accent-bright w-full rounded-lg px-2 py-3 text-left text-sm transition-colors"
            @click="go(link.id)"
          >
            {{ link.label }}
          </button>
        </li>
      </ul>
    </Transition>
  </header>
</template>
