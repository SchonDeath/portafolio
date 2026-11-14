<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { profile, socials } from '@/data/profile'

/**
 * Cierre del documento, en ficha.
 *
 * Antes el cierre era un «Hablemos» a tamaño display: un gesto de agencia
 * que gritaba más que el resto del sitio. Ahora es una ficha de datos,
 * como el pie de una carta institucional: un titular contenido a la
 * izquierda y, a la derecha, las filas de contacto con su rótulo.
 *
 * El correo lleva un botón para copiarlo: un mailto depende de que el
 * visitante tenga un cliente de correo configurado, y muchos no lo tienen.
 */

const root = ref<HTMLElement | null>(null)
const year = new Date().getFullYear()
const copied = ref(false)

const links = socials.filter((social) => !social.url.startsWith('mailto:'))

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText(profile.email)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1800)
  } catch {
    // Sin permiso de portapapeles el correo sigue a la vista y seleccionable.
  }
}

useEditorial(root)
</script>

<template>
  <footer id="contacto" ref="root" class="contact">
    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">05</span>
          <span aria-hidden="true"> / </span>
          <span>Contacto</span>
        </p>
        <p v-if="profile.available" class="contact__status">
          <span class="status-dot" aria-hidden="true" />
          <span class="meta-xs">{{ profile.availableLabel }}</span>
        </p>
      </header>

      <div class="contact__body">
        <div class="contact__intro">
          <h2 class="display-m contact__title" data-line>
            Conversemos sobre<br />
            <span class="serif-accent">el próximo proyecto.</span>
          </h2>
          <p class="contact__lead" data-rise="0.05">
            Para propuestas de trabajo, colaboraciones o consultas técnicas,
            el correo es la vía más directa.
          </p>
        </div>

        <dl class="contact__sheet" data-rise="0.1">
          <div class="contact__row">
            <dt class="meta-xs">Correo</dt>
            <dd class="contact__mail">
              <a :href="`mailto:${profile.email}`" class="contact__email">
                <span class="underline-grow">{{ profile.email }}</span>
              </a>
              <button type="button" class="contact__copy" @click="copyEmail">
                {{ copied ? 'Copiado' : 'Copiar' }}
              </button>
              <span class="visually-hidden" aria-live="polite">
                {{ copied ? 'Correo copiado al portapapeles' : '' }}
              </span>
            </dd>
          </div>

          <div class="contact__row">
            <dt class="meta-xs">Ubicación</dt>
            <dd>{{ profile.location }}</dd>
          </div>

          <div v-if="profile.available" class="contact__row">
            <dt class="meta-xs">Estado</dt>
            <dd>{{ profile.availableLabel }}</dd>
          </div>

          <div v-if="links.length" class="contact__row">
            <dt class="meta-xs">Enlaces</dt>
            <dd>
              <ul class="contact__links">
                <li v-for="social in links" :key="social.label">
                  <a :href="social.url" target="_blank" rel="noopener">
                    <span class="underline-grow">{{ social.label }}</span>
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      <div class="contact__foot">
        <p class="meta-xs">© {{ year }} {{ profile.name }}</p>
        <a href="#inicio" class="meta-xs contact__top">
          <span class="underline-grow">Volver arriba</span>
          <span aria-hidden="true"> ↑</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.contact {
  padding-block: var(--section-gap) var(--space-6);
  background: var(--paper-sunk);
  border-top: 1px solid var(--rule-strong);
}

.contact__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.contact__body {
  display: grid;
  gap: var(--space-7);
}

@media (min-width: 62rem) {
  .contact__body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    gap: var(--space-9);
    align-items: start;
  }
}

.contact__title {
  color: var(--ink);
}

.contact__lead {
  margin-top: var(--space-5);
  max-width: 44ch;
  color: var(--ink-muted);
}

/* ── Ficha ───────────────────────────────────────────────── */

.contact__sheet {
  border-top: 2px solid var(--ink);
}

.contact__row {
  display: grid;
  gap: var(--space-2);
  padding-block: var(--space-4);
  border-bottom: 1px solid var(--rule);
}

@media (min-width: 36rem) {
  .contact__row {
    grid-template-columns: 7.5rem minmax(0, 1fr);
    gap: var(--space-5);
    align-items: baseline;
  }
}

.contact__row dd {
  min-width: 0;
  color: var(--ink);
}

.contact__mail {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2) var(--space-4);
}

.contact__email {
  color: var(--ink);
  font-weight: 500;
  /* El correo tiene que caber en 360px sin desbordar la caja. */
  word-break: break-word;
}

.contact__copy {
  font-family: var(--font-mono);
  font-size: var(--step-meta-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  padding: var(--space-1) 0;
  transition: color var(--dur-ui) var(--ease-ui);
}

.contact__copy:hover {
  color: var(--ink);
}

.contact__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
}

.contact__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-9);
  padding-top: var(--space-4);
  border-top: 1px solid var(--rule);
}

.contact__top {
  color: var(--ink-muted);
  transition: color var(--dur-ui) var(--ease-ui);
}

.contact__top:hover {
  color: var(--accent);
}
</style>
