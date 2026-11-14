<script setup lang="ts">
import { ref } from 'vue'
import { useEditorial } from '@/composables/useEditorial'
import { profile, skills } from '@/data/profile'
import cieloAndes from '@/assets/collage/cielo.webp'

/**
 * Perfil.
 *
 * Va después de clientes, proyectos y trayectoria: la biografía interesa
 * cuando ya se sabe qué ha hecho, no antes.
 *
 * Se eliminó la fila de estadísticas que había («03 etapas profesionales»,
 * «07 proyectos con contexto»): son recuentos de lo que la propia página
 * ya lista, presentados con el tamaño de una métrica de impacto. Un
 * número que el lector puede contar solo no es un dato, es relleno.
 *
 * Bajo el titular, un recorte fijo del cielo andino de la portada: el
 * mismo horizonte, sin vídeo, para que la página siga siendo una sola.
 */

const root = ref<HTMLElement | null>(null)
useEditorial(root)
</script>

<template>
  <section id="perfil" ref="root" class="section ruled about">
    <!-- El cielo andino de la portada como fondo de toda la sección; el
         contenido va encima con la tinta clara de la noche. -->
    <img class="about__bg" :src="cieloAndes" alt="" aria-hidden="true" loading="lazy" decoding="async" />
    <div class="about__veil" aria-hidden="true" />

    <div class="shell">
      <header class="section-head">
        <p class="meta">
          <span class="section-number">03</span>
          <span aria-hidden="true"> / </span>
          <span>Perfil</span>
        </p>
        <p class="meta-xs">{{ profile.location }}</p>
      </header>

      <div class="about__grid">
        <div class="about__intro">
          <h2 class="display-l" data-line>
            Lo complejo,<br />
            <span class="serif-accent">bien resuelto.</span>
          </h2>

          <a v-if="profile.resume" :href="profile.resume" download class="action action--ghost about__cv">
            Descargar CV
            <span class="action__arrow" aria-hidden="true">↓</span>
          </a>
        </div>

        <div class="about__prose" data-rise="0.05">
          <p v-for="(paragraph, i) in profile.bio" :key="i" :class="{ lead: i === 0 }">
            {{ paragraph }}
          </p>
        </div>
      </div>

      <!-- Stack. Tabla de campos, no nube de etiquetas: cada grupo es una
           fila con su rótulo al margen, como el índice de materias de un
           expediente. -->
      <div class="about__stack">
        <div class="about__stack-head">
          <p class="meta">Herramientas</p>
          <p class="meta-xs">{{ skills.length }} áreas</p>
        </div>

        <dl class="about__stack-list">
          <div v-for="(group, i) in skills" :key="group.label" data-rise="0">
            <dt>
              <span class="meta-xs about__stack-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="about__stack-label">{{ group.label }}</span>
            </dt>
            <dd>
              <ul class="tag-list">
                <li v-for="item in group.items" :key="item">{{ item }}</li>
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Tinta clara en toda la sección: redefinir los tokens deja resueltos
   titular, párrafos, tabla y botón sin repetir cada color. */
.about {
  --ink: #ffffff;
  --ink-body: #ffffff;
  --ink-muted: #ffffff;
  --ink-faint: #ffffff;
  --accent: #ffffff;
  --rule: rgb(255 255 255 / 0.18);
  --rule-strong: rgb(255 255 255 / 0.32);

  isolation: isolate;
  overflow: hidden;
  background: #0e1626;
  color: var(--ink-body);
}

.about__bg {
  position: absolute;
  z-index: -2;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* El horizonte encendido queda en la parte baja de la sección. */
  object-position: center 70%;
  pointer-events: none;
}

/* Velo: oscuro arriba, donde está el texto largo, y más abierto al pie
   para que se vea el naranja del horizonte detrás de la tabla. */
.about__veil {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgb(10 16 30 / 0.8) 0%,
    rgb(10 16 30 / 0.65) 50%,
    rgb(10 16 30 / 0.55) 100%
  );
  pointer-events: none;
}

.about__grid {
  display: grid;
  gap: var(--space-6);
}

@media (min-width: 62rem) {
  .about__grid {
    grid-template-columns: 1fr 1.3fr;
    gap: var(--space-8);
    align-items: start;
  }
}

.about__grid .display-l {
  text-shadow: 0 2px 24px rgb(0 0 0 / 0.35);
}

.about__cv {
  margin-top: var(--space-6);
}

/* Columna estrecha a propósito: 68 caracteres es donde el ojo deja de
   perder la línea al volver al margen izquierdo. */
.about__prose {
  max-width: 68ch;
  display: grid;
  gap: var(--space-5);
}

.about__prose p {
  color: var(--ink-body);
}

.about__stack {
  margin-top: var(--space-9);
  padding-top: var(--space-5);
  border-top: 1px solid var(--rule-strong);
}

.about__stack-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.about__stack-list > div {
  display: grid;
  gap: var(--space-3);
  padding-block: var(--space-4);
  border-bottom: 1px solid var(--rule);
}

@media (min-width: 48rem) {
  .about__stack-list > div {
    grid-template-columns: 14rem 1fr;
    gap: var(--space-5);
    align-items: baseline;
  }
}

.about__stack-list dt {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.about__stack-num {
  color: var(--accent);
}

.about__stack-label {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}
</style>
