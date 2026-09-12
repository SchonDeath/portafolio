# Dirección de arte — Portafolio Sebastián González

Documento de decisión. Se aprueba antes de implementar.

---

## 1. Concepto

> **Expediente técnico.** El portafolio se compone como un documento
> institucional que alguien diseñó con criterio: numerado, tabulado, con
> tipografía enorme y márgenes generosos — la estética de un informe que
> importa, no la de una agencia creativa.

Por qué este y no otro: el trabajo real de Sebastián es Banco Central,
Consorcio y SII. Un portafolio con estética de estudio creativo pelea contra
su propio contenido. Uno con estética de documento oficial *bien hecho* usa
la misma ambición formal de Awwwards —escala tipográfica, rejilla visible,
metadatos monoespaciados— pero apuntando a donde el contenido ya es fuerte.

La rejilla, la numeración de secciones y las etiquetas monoespaciadas dejan
de ser adorno: son el lenguaje nativo de un formulario tributario y de una
póliza. Es el único portafolio donde ese lenguaje es honesto.

---

## 2. Veredictos de estructura

### Preloader + PortalGate: **se eliminan**

1.251 líneas y un vídeo de 3,1 MB descargado por completo, sin techo de
tiempo, antes de que se vea nada. Con mínimo forzado de 1.400 ms y el portal
mostrándose **en cada carga**, incluida cada recarga.

El presupuesto del prompt son 1,2 s hasta contenido real. Esto no cabe ni
optimizado: el cuello es la descarga del vídeo, no la animación.

Qué lo sustituye: el hero **es** la entrada. Un revelado tipográfico de
~700 ms sobre contenido que ya está en el DOM — se lee aunque el JS falle.
La ambición se traslada del preámbulo al material.

Se van: `Preloader.vue`, `PortalGate.vue`, `usePortalScene.ts`,
`useIntroBand.ts`, y los tres vídeos (3,1 MB + 11,7 MB + 55 MB huérfanos).

### Three.js: **se elimina**

`CinemaBackdrop` + `useCinemaScene` + `FluidImage` + `useFluidImage` son el
principal responsable de los 767 kB. Un fondo animado que la audiencia no
mira y una distorsión WebGL sobre capturas de pantalla que las hace menos
legibles — justo lo que el prompt prohíbe.

Qué lo sustituye: la profundidad la da la rejilla y el papel, no una escena.
Ganancia estimada: **~600 kB de bundle**.

### Tailwind v4: **se elimina**

No por ideología: el sitio ya tiene 641 líneas de CSS nativo entre
`style.css` y `creative.css` haciendo el trabajo real, con Tailwind
sobreviviendo en `@apply` y en unas pocas utilidades. Mantener el motor
completo para eso no se paga.

Y hay un argumento de contenido: el design system del SII lo construyó **con
CSS nativo, minimizando dependencias**. Que el portafolio se construya con el
mismo criterio que el trabajo que exhibe no es coherencia decorativa — es la
demostración.

Queda: CSS nativo con custom properties, `@layer` y una capa de utilidades
propia y corta.

### Las tres capas de estilo: **se funden en una**

Hoy compiten `style.css` (azul petróleo), el bloque «profesional» al final
del mismo archivo, y `creative.css` (hueso/rojo bajo `.portfolio-v2`). Tres
direcciones de arte en un sitio. Es el defecto más grave del diseño actual.

Resultado: **un** `src/styles/` con tokens, base, utilidades y componentes.

---

## 3. Paleta

Gana la dirección **cálida** de `creative.css`, corregida. Motivo: el papel
hueso pertenece al mundo del documento y separa el sitio del mar de
portafolios en azul oscuro. El azul petróleo de `style.css` es competente y
anónimo.

Corrección necesaria: el rojo `#b23924` sobre hueso `#eeeae3` da 5.00:1 —
pasa AA, pero sin margen para las superficies hundidas. Se oscurece a
`#9e2f1c` (6.09:1) para texto, y el tono vivo queda solo para filetes.

**Todos los valores de abajo están medidos**, no estimados, contra las tres
superficies de su tema (script en el scratchpad de la sesión). El par más
ajustado es `ink-faint` sobre `paper-sunk`: 4.65:1.

### Tema claro (por defecto)

| Token | Hex | Uso | Contraste sobre paper |
|---|---|---|---|
| `--paper` | `#eeeae3` | Fondo base | — |
| `--paper-sunk` | `#e5e0d7` | Bloques hundidos, tablas alternas | — |
| `--paper-raised` | `#f6f3ee` | Tarjetas sobre el fondo | — |
| `--ink` | `#1a1b19` | Titulares | 14.42 |
| `--ink-body` | `#33352f` | Cuerpo | 10.36 |
| `--ink-muted` | `#5f6159` | Secundario | 5.24 |
| `--ink-faint` | `#616359` | Metadatos | 5.10 |
| `--accent` | `#9e2f1c` | Texto y enlaces con acento | 6.09 |
| `--accent-vivid` | `#c4441f` | Filetes y subrayados (no texto) | 4.18 |
| `--rule` | `#1a1b1922` | Líneas de rejilla | — |
| `--rule-strong` | `#1a1b1940` | Bordes de bloque | — |

### Tema oscuro

| Token | Hex | Uso | Contraste sobre paper |
|---|---|---|---|
| `--paper` | `#161917` | Fondo base | — |
| `--paper-sunk` | `#111412` | Bloques hundidos | — |
| `--paper-raised` | `#1f2320` | Tarjetas | — |
| `--ink` | `#efebe4` | Titulares | 14.91 |
| `--ink-body` | `#d3d3ca` | Cuerpo | 11.76 |
| `--ink-muted` | `#a4a89d` | Secundario | 7.31 |
| `--ink-faint` | `#8d9287` | Metadatos | 5.56 |
| `--accent` | `#f28f74` | Texto con acento | 7.55 |
| `--accent-vivid` | `#f7a184` | Filetes y subrayados | 8.76 |
| `--rule` | `#efebe420` | Líneas de rejilla | — |
| `--rule-strong` | `#efebe440` | Bordes | — |

Nota sobre `--ink-faint`: es el token de los metadatos monoespaciados, el
elemento firma del concepto. El gris apagado que pedía el diseño (`#8a8c82`)
daba 2.85:1 y fallaba. Va más oscuro de lo que la referencia sugiere, a
cambio de que las etiquetas se lean de verdad.

Regla de uso del acento: **nunca en superficies grandes**. Solo filete de
1–2px, número de sección, subrayado en hover y el punto de estado. Si aparece
en más de tres sitios por pantalla, se ha perdido.

---

## 4. Tipografía

Dos familias, ambas ya cargadas — sin peticiones nuevas.

- **Display: Space Grotesk.** Grotesca con detalles mecánicos; a tamaño
  enorme muestra carácter sin volverse decorativa.
- **Texto y metadatos: Fira Sans / Fira Code.** Fira nació para interfaces
  técnicas y su monoespaciada es de la misma familia, así que la etiqueta
  `(01)` y el párrafo son parientes visibles.

Se elimina **Manrope**: solapa con Fira Sans sin aportar. Menos peso de
fuentes.

| Rol | Familia | Tamaño | Peso | Tracking | Line-height |
|---|---|---|---|---|---|
| `display-xl` (nombre en hero) | Space Grotesk | `clamp(3.5rem, 13vw, 11rem)` | 700 | `-0.055em` | `0.86` |
| `display-l` (títulos sección) | Space Grotesk | `clamp(2.25rem, 6vw, 4.75rem)` | 700 | `-0.04em` | `0.94` |
| `display-m` (títulos ficha) | Space Grotesk | `clamp(1.5rem, 3vw, 2.25rem)` | 600 | `-0.025em` | `1.06` |
| `lead` (entradilla) | Fira Sans | `clamp(1.05rem, 1.9vw, 1.35rem)` | 400 | `-0.01em` | `1.55` |
| `body` | Fira Sans | `1rem` | 400 | `0` | `1.68` |
| `body-s` | Fira Sans | `0.875rem` | 400 | `0` | `1.6` |
| `meta` | Fira Code | `0.6875rem` | 400 | `0.14em` | `1.4` |
| `meta-xs` | Fira Code | `0.625rem` | 400 | `0.18em` | `1.4` |

`meta` y `meta-xs` siempre en mayúsculas. `display-*` con `text-wrap:
balance`; los párrafos con `text-wrap: pretty`.

Un recurso puntual: **una palabra en cursiva serif** (Georgia) por sección
como máximo, heredado de `creative.css`, donde ya funciona. Rompe la
uniformidad justo lo suficiente.

---

## 5. Rejilla y espaciado

**12 columnas**, contenedor `min(100% - 2 * var(--gutter), 1440px)`, canal de
24px. Márgenes: 20px en móvil, 40px en tablet, 64px en escritorio.

La rejilla **se ve**: filetes verticales de 1px en `--rule` a lo largo de las
secciones estructurales. Es el gesto que convierte el layout en documento.

Reparto por defecto, asimétrico:
- Título de sección: columnas 1–5
- Cuerpo: columnas 6–12
- Fichas de proyecto destacado: 1–7, alternando con 6–12

Escala de espaciado, base 4px: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 176`.
Aire vertical entre secciones: **176px** en escritorio, 96px en móvil.

---

## 6. Inventario de movimiento

Cuatro gestos. No hay un quinto.

| Gesto | Dónde | Duración | Curva |
|---|---|---|---|
| **Revelado por líneas** | Titulares al entrar en vista | 700 ms, stagger 60 ms | `cubic-bezier(.16,1,.3,1)` |
| **Trazado de filete** | Bordes de sección y de tarjeta | 500 ms | `cubic-bezier(.65,0,.35,1)` |
| **Desvelado de imagen** | Capturas, con `clip-path` | 800 ms | `cubic-bezier(.16,1,.3,1)` |
| **Subrayado en hover** | Enlaces y tarjetas, `scaleX` desde la izquierda | 280 ms | `cubic-bezier(.4,0,.2,1)` |

Fuera: parallax, contadores animados, cursor personalizado. El cursor lo
descarto pese a estar en la lista de recursos válidos — es el rasgo más
reconocible de portafolio-de-agencia y contradice el concepto de expediente.

Todo bajo `prefers-reduced-motion`: sin excepción, el marcado ya es su estado
final.

---

## 7. Estructura de secciones

| # | Sección | Cambio respecto a hoy |
|---|---|---|
| 00 | **Hero** | Es la entrada. Nombre a 13vw, rol, ubicación, cuatro clientes como texto, un enlace a contacto. Sin vídeo. |
| 01 | **Clientes** | Se mantiene como puerta al trabajo: SII, Consorcio, Banco Central, Tukiin. Cuatro bloques en rejilla, no tarjetas con placa de logo. |
| 02 | **Proyectos** | Siete proyectos en lista tabular numerada, con los destacados expandidos. Reemplaza la grilla de tarjetas. |
| 03 | **Trayectoria** | Tabla de tres periodos. El formato tabla es del concepto y ahorra el timeline decorativo. |
| 04 | **Perfil** | Los tres párrafos de bio, en columna estrecha con el stack al lado. |
| 05 | **Formación** | Once certificaciones en tabla densa, agrupadas por área, con enlace de verificación. |
| 06 | **Contacto** | Email a tamaño display. Cierre del documento. |

Cambio de orden respecto a hoy: **Clientes antes que Proyectos**, y Perfil
después de Trayectoria. La credencial primero, la biografía cuando ya
interesa quién es.

---

## 8. Lo que hay que resolver con contenido, no con diseño

Estos huecos existen hoy y el rediseño no los tapa:

1. **`socials` solo tiene email.** GitHub y LinkedIn están comentados. En el
   diseño nuevo el bloque de contacto los espera.
2. **`profile.resume` está vacío** — sin CV que enlazar.
3. **`profile.portrait` apunta a un SVG marcador**, no a una foto.
4. **Ningún proyecto tiene métricas.** El diseño no pide ninguna, así que no
   bloquea; pero un número real en cada ficha la haría más creíble.
5. **Tres portadas son ilustraciones conceptuales**, no capturas.

Nada de esto se inventa. Se deja el hueco preparado y se pregunta.

---

## 9. Presupuesto

| | Hoy | Objetivo |
|---|---|---|
| JS minificado | 767 kB | **< 120 kB** |
| JS gzip | 224 kB | **< 45 kB** |
| Media | 14,8 MB servidos | 0 vídeos |
| Tiempo a contenido | vídeo + 1,4 s mínimo | < 1 s |
| Dependencias runtime | vue, gsap, three, tailwind | **vue, gsap** |

GSAP se queda: los cuatro gestos con ScrollTrigger son su caso de uso, pesa
~70 kB y sustituirlo por IntersectionObserver a mano cuesta más código del
que ahorra.

---

## Aprobación

Si esto va, implemento en cinco fases, con commit por fase:

1. Sistema de tokens y base CSS. Borrado de Three.js, Tailwind, preloader,
   portal y vídeos.
2. Rejilla, navegación y hero.
3. Clientes y proyectos, con sus fichas.
4. Trayectoria, perfil y formación.
5. Contacto, pasada de accesibilidad, medición de bundle y README.
