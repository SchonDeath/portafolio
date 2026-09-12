# Portafolio — Sebastián González

Sitio personal de una sola página. Vue 3 + TypeScript + Vite, CSS nativo,
sin dependencias de runtime más allá de Vue.

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # vue-tsc + build de producción
npm run preview  # sirve dist/ en localhost:4173
```

## Concepto

**Expediente técnico.** La página se compone como un documento
institucional bien diseñado: numerada, tabulada, con tipografía grande y
márgenes amplios. La rejilla visible, los metadatos monoespaciados y la
numeración de secciones no son adorno — son el lenguaje nativo de un
formulario tributario y de una póliza, que es de lo que trata el trabajo
que el sitio expone.

La dirección de arte completa, con las decisiones y su porqué, está en
[`design-review/direccion-arte.md`](design-review/direccion-arte.md).

## Dónde está cada cosa

```
src/
  data/profile.ts        TODO el texto del sitio y sus interfaces
  styles/
    tokens.css           única capa de variables (colores, escala, ritmo)
    base.css             reset, tipografía, accesibilidad
    layout.css           rejilla de 12 columnas y estructura de sección
    components.css       lo que comparten varias secciones
    motion.css           los cuatro gestos, como transiciones CSS
  composables/
    useEditorial.ts      dispara los gestos con IntersectionObserver
    useTheme.ts          tema claro/oscuro
    useProjectOverlay.ts estado de la ficha de proyecto
  components/
    SiteNav.vue          índice del documento
    ProjectOverlay.vue   ficha de proyecto a pantalla completa
    ClientWorkOverlay.vue  anexo con los proyectos de un cliente
    sections/            las siete secciones, en orden de aparición
```

### Contenido

`src/data/profile.ts` es la única fuente de texto. Ningún componente
lleva copia dentro. Los datos son la trayectoria real; si falta un dato
—una métrica, un enlace— se deja el hueco y se pregunta, no se rellena.

### Estilos

Una sola capa de variables en `tokens.css`, con nombres de documento
(`--paper`, `--ink`, `--rule`) y no de interfaz. Nada de hex sueltos en
los componentes.

**Los contrastes están medidos, no estimados.** Cada tono de tinta se
comprobó contra las tres superficies de su tema; el par más ajustado es
`--ink-faint` sobre `--paper-sunk`, 4.65:1. Si tocas un color, vuelve a
medir: el gris de metadatos elegido a ojo daba 2.85:1 y fallaba AA.

### Movimiento

Cuatro gestos y no hay un quinto: revelado por líneas, bloques que suben,
cortina sobre imágenes y filetes que se dibujan. Son transiciones CSS;
`useEditorial` solo decide cuándo disparar.

El estado inicial oculto vive bajo `[data-animate]`, que el JS pone en
`<html>` al montar. **Sin JS el atributo no existe y la página se lee
entera.** Además hay un plazo de 3 s tras el cual se revela lo que quede
pendiente, para quien fotografía la página sin recorrerla.

## Rendimiento

| | Antes del rediseño | Ahora |
|---|---|---|
| JS minificado | 767 kB | 113 kB |
| JS gzip | 224 kB | 41 kB |
| Imágenes | 12 MB | 1,1 MB |
| Vídeo | 14,8 MB | ninguno |
| Dependencias runtime | vue, gsap, three, tailwind | vue |

Las portadas son WebP. Eran fotografías guardadas como PNG de 2 MB cada
una; si añades una nueva, conviértela antes:

```bash
ffmpeg -i entrada.png -vf "scale='min(1600,iw)':-2" -quality 82 salida.webp
```

## Verificación

`_shot.mjs` toma capturas en cuatro tamaños y detecta desbordes
horizontales y errores de consola. `_a11y.mjs` comprueba foco, Escape,
`inert`, `reduce-motion`, jerarquía de encabezados y textos alternativos.
Ambos necesitan `npm run preview` corriendo en el puerto 4173.

```bash
npm run build && npm run preview &
node _shot.mjs
node _a11y.mjs
```

No sustituyen una auditoría WCAG completa ni una medición en dispositivo
físico.

## Pendiente de contenido

Huecos que el diseño deja preparados y que solo se llenan con datos
reales:

1. **GitHub y LinkedIn** están comentados en `socials` de `profile.ts`.
   El bloque de contacto los espera.
2. **`profile.resume` está vacío** — sin CV, el botón de descarga no
   aparece.
3. **`profile.portrait` apunta a un SVG marcador**, no a una foto.
4. **Ningún proyecto tiene métricas.** No se inventaron: un número real
   por ficha (páginas migradas, formularios cubiertos, tiempo de carga)
   haría el relato más creíble.
5. **Tres portadas son ilustraciones conceptuales**, no capturas, y así
   se declaran en su pie.
