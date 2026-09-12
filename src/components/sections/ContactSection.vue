<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { profile, socials } from '@/data/profile'

/**
 * Cierre del documento.
 *
 * El email va a tamaño display porque es la única acción que importa
 * aquí; todo lo demás es pie de página. Va sobre superficie hundida para
 * que se lea como el reverso de la hoja y no como una sección más.
 */

const root = ref<HTMLElement | null>(null)
const year = new Date().getFullYear()

useEditorial(root)
</script>

<template>
  <footer id="contacto" ref="root" class="contact">
    <div class="shell">
      <div class="contact__head">
        <p class="meta">
          <span class="contact__number">06</span>
          <span aria-hidden="true"> / </span>
          <span>Contacto</span>
        </p>
        <p v-if="profile.available" class="contact__status">
          <span class="status-dot" aria-hidden="true" />
          <span class="meta-xs">{{ profile.availableLabel }}</span>
        </p>
      </div>

      <div class="rule rule--accent" data-rule />

      <p class="lead contact__intro" data-rise="0">
        ¿Una idea, un desafío o un equipo al que sumarse?
      </p>

      <a :href="`mailto:${profile.email}`" class="contact__mail" data-rise="0.05">
        <span class="display-xl contact__mail-text">Hablemos</span>
        <span class="contact__arrow" aria-hidden="true">↗</span>
      </a>

      <div class="contact__details">
        <div>
          <p class="meta-xs contact__label">Correo</p>
          <a :href="`mailto:${profile.email}`" class="contact__email">
            <span class="underline-grow">{{ profile.email }}</span>
          </a>
        </div>

        <div>
          <p class="meta-xs contact__label">Ubicación</p>
          <p>{{ profile.location }}</p>
        </div>

        <div v-if="socials.length > 1">
          <p class="meta-xs contact__label">Enlaces</p>
          <ul class="contact__socials">
            <li v-for="social in socials" :key="social.label">
              <a
                :href="social.url"
                :target="social.url.startsWith('mailto:') ? undefined : '_blank'"
                rel="noopener"
              >
                <span class="underline-grow">{{ social.label }}</span>
                <span aria-hidden="true"> ↗</span>
              </a>
            </li>
          </ul>
        </div>
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
  padding-block: var(--section-gap);
  background: var(--paper-sunk);
  border-top: 1px solid var(--rule-strong);
}

.contact__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.contact__number {
  color: var(--accent);
}

.contact__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.contact__intro {
  margin-top: var(--space-7);
  max-width: 34ch;
  color: var(--ink-muted);
}

.contact__mail {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  margin-block: var(--space-5) var(--space-9);
  color: var(--ink);
}

.contact__mail-text {
  transition: color var(--dur-ui) var(--ease-ui);
}

.contact__mail:hover .contact__mail-text {
  color: var(--accent);
}

.contact__arrow {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1;
  color: var(--accent);
  transition: transform var(--dur-ui) var(--ease-ui);
}

.contact__mail:hover .contact__arrow {
  transform: translate(4px, -4px);
}

.contact__details {
  display: grid;
  gap: var(--space-5);
  padding-top: var(--space-6);
  border-top: 1px solid var(--rule);
}

@media (min-width: 48rem) {
  .contact__details {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }
}

.contact__label {
  margin-bottom: var(--space-2);
}

.contact__email {
  color: var(--ink);
  /* El correo tiene que caber en 360px sin desbordar la caja. */
  word-break: break-word;
}

.contact__socials {
  display: grid;
  gap: var(--space-2);
  color: var(--ink);
}

.contact__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-8);
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
