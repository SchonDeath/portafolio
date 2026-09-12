# Portafolio

Portafolio personal de una sola página con un portal de entrada en WebGL y
un interior de estética editorial. Construido con **Vue 3**, **TypeScript**,
**Tailwind CSS v4**, **Three.js** y **GSAP**.

## Cómo funciona

Al abrir el sitio se muestra un **portal de bienvenida** a pantalla completa: un campo
de partículas frías atravesado por anillos concéntricos. Al pulsar «Entrar al perfil»,
la cámara cruza el umbral y GSAP revela el portafolio.

Las partículas reaccionan al cursor: las cercanas se encienden, crecen y se
apartan a su paso.

El portal se muestra **una vez por sesión** (`sessionStorage`): quien recarga la página
entra directo al perfil, pero quien vuelve otro día ve la bienvenida de nuevo.

El interior usa un vocabulario de animación editorial —titulares que entran por
líneas desde una máscara, imágenes reveladas por cortina, paralaje y cifras que
cuentan— definido en `src/composables/useEditorial.ts` y activado por atributos
en el marcado:

| Atributo         | Gesto                                          |
| ---------------- | ---------------------------------------------- |
| `data-line`      | titular que entra por líneas desde una máscara  |
| `data-word`      | titular que entra palabra a palabra             |
| `data-rise`      | bloque que sube al entrar (el valor es retardo) |
| `data-curtain`   | imagen revelada por una cortina                 |
| `data-parallax`  | desplazamiento lento durante el scroll          |
| `data-count`     | cifra que cuenta hasta su valor                 |
| `data-rule`      | línea divisoria que se dibuja                   |

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo
npm run build      # comprobar tipos y compilar a dist/
npm run preview    # previsualizar la compilación
```

## Personalización

### 1. Tus datos

Todo el contenido está en un solo archivo: **`src/data/profile.ts`**.
Ahí editas nombre, rol, bio, redes, stack, proyectos y trayectoria.
Los datos de ejemplo están marcados con `TODO`.

Detalles útiles:

- Un proyecto con `featured: true` ocupa el ancho completo de la grilla.
- Si `live` o `repo` quedan vacíos, el botón correspondiente no se dibuja.
- Si `experience` queda como array vacío, la sección desaparece.
- Si `resume` queda vacío, el botón «Descargar CV» no aparece.

### 2. Tus imágenes

Las imágenes viven en `public/img/`. Los `.svg` actuales son placeholders
generados en la paleta del sitio; reemplázalos por los tuyos y actualiza las
rutas en `src/data/profile.ts` (y el `og:image` en `index.html`).
Ver `public/img/README.md` para los tamaños recomendados.

### 3. Título y metadatos

En `index.html`: `<title>`, la descripción y las etiquetas Open Graph.

### 4. Colores y temas

El sitio tiene **tema claro y oscuro**, con un botón en la navegación. Arranca
siguiendo la preferencia del sistema y recuerda la elección en `localStorage`.

Los tokens son **semánticos**, no una escala fija: el mismo marcado sirve a
ambos temas sin condicionales. Se definen en `src/style.css`:

| Token             | Uso                                    |
| ----------------- | -------------------------------------- |
| `surface-deep`    | Fondo de página                        |
| `surface`         | Fondo de sección                       |
| `surface-raised`  | Tarjetas y superficies elevadas        |
| `content-strong`  | Titulares                              |
| `content`         | Texto corrido                          |
| `content-muted`   | Texto secundario                       |
| `content-subtle`  | Etiquetas y detalles                   |
| `accent`          | Acento principal (cian)                |
| `accent-alt`      | Acento secundario (índigo)             |
| `line`            | Bordes y divisorias                    |

Se usan como clases normales de Tailwind: `bg-surface-deep`, `text-content`,
`border-line`. Para cambiar la identidad del sitio basta editar los valores en
`:root` (oscuro) y `[data-theme='light']` (claro).

La escena 3D tiene su propia paleta por tema en `portalPalettes`, dentro de
`src/composables/usePortalScene.ts`. El tema claro no solo cambia de color:
también pasa de blending aditivo a normal, porque sumar luz sobre un fondo
claro no puede oscurecer y el campo de partículas desaparecería.

### 5. Tipografía

**Fira Sans** para todo el texto y **Fira Code** para las etiquetas
monoespaciadas, cargadas desde Google Fonts en `index.html`. Los tokens
`--font-sans`, `--font-display` y `--font-mono` están en `src/style.css`.

## Estructura

```
src/
├── data/profile.ts              ← tu contenido (edita esto)
├── composables/
│   ├── usePortalScene.ts        ← escena Three.js del portal
│   ├── useEditorial.ts          ← vocabulario de animación editorial
│   └── useTheme.ts              ← tema claro/oscuro
├── components/
│   ├── PortalGate.vue           ← pantalla de bienvenida
│   ├── SiteNav.vue              ← navegación con sección activa
│   └── sections/                ← Hero, Sobre mí, Proyectos, Stack…
├── App.vue                      ← orquesta portal → sitio
└── style.css                    ← tokens de ambos temas
```

## Accesibilidad

El sitio respeta `prefers-reduced-motion`: con esa preferencia activa se omiten
todas las animaciones de entrada y el cruce del portal es inmediato. El contenido
nunca depende del JS de animación para ser visible — el marcado ya es su propio
estado final.

El contraste de texto cumple **WCAG AA** en ambos temas.
