# Prompt: rediseño total del portafolio con lenguaje Awwwards

> Copia todo lo que sigue (desde «ROL» hasta el final) y pégalo como primer
> mensaje en una sesión nueva de Claude Code, abierta en la raíz del proyecto.

---

## ROL

Eres director de arte digital y desarrollador frontend senior. Has dirigido
sitios que ganan *Site of the Day* en Awwwards y también has trabajado para
banca y sector público, así que sabes exactamente dónde termina el
espectáculo y dónde empieza la credibilidad.

Vas a **rediseñar este portafolio de cero**. No es un lavado de cara: si un
componente, una animación o una decisión cromática no sirve a la nueva
dirección, se tira y se rehace. El dueño del proyecto lo ha dicho
explícitamente — prefiere rehacerlo entero antes que arrastrar decisiones
viejas. No conserves nada por respeto al trabajo previo; consérvalo solo si
lo eliges tú, con un motivo.

## CONTEXTO DEL PROYECTO

Portafolio personal de **Sebastián González**, desarrollador full-stack con
foco frontend, Santiago de Chile.

**Lo único que se mantiene fijo:**
- Vue 3 + TypeScript + Vite (proyecto ya configurado)
- Una sola página con secciones ancladas, sin router
- El contenido factual de la sección «CONTENIDO REAL» de este prompt

**Todo lo demás está sobre la mesa**, incluido: Tailwind (puedes quedarte con
v4, reducirlo a CSS nativo o cambiar de enfoque), GSAP, Three.js, la
estructura de componentes, la paleta, las tipografías, el preloader, la
animación de entrada, el orden de las secciones y el sistema de overlays.

### Estado actual, para que sepas qué estás reemplazando

- `src/data/profile.ts` (524 líneas) — **toda** la copia del sitio más las
  interfaces `Project`, `SkillGroup`, `ExperienceItem`, `ClientWork`,
  `Certification`. Los datos son correctos y están verificados; el modelo de
  datos puedes rediseñarlo si tu dirección lo pide. Mantén la idea de una
  fuente única de contenido: ningún texto suelto en los componentes.
- `src/style.css` (375 líneas) — tokens semánticos (`--surface-*`,
  `--content-*`, `--accent-*`, `--line*`) en `:root` y `[data-theme='light']`,
  expuestos a Tailwind con `@theme inline`. Paleta azul petróleo.
- `src/creative.css` (266 líneas) — segunda capa de dirección bajo
  `.portfolio-v2` que sobreescribe esos mismos tokens con una paleta cálida
  hueso/rojo y tipografías Space Grotesk + Manrope.
  **Hay dos direcciones de arte compitiendo en el mismo sitio. Elige una y
  borra la otra.** Es probablemente el problema más grave del diseño actual.
- `src/App.vue` — orquesta `Preloader` → `PortalGate` → sitio.
- `src/components/Preloader.vue` (458 líneas) — preloader de terminal en
  negro, con barra de progreso que espera a que se descargue un vídeo de
  3,1 MB antes de dejar entrar. Mínimo forzado de 1400 ms.
- `src/components/PortalGate.vue` (793 líneas) — portal de entrada con vídeo
  a pantalla completa, gradación de color por tema y animación de apertura.
  Se muestra en **cada carga**, también al recargar.
  Juntos son 1.251 líneas y varios segundos antes de ver contenido. Evalúa
  sin sentimentalismo si eso sirve al objetivo o si estorba.
- `src/components/sections/` — Hero, About, Projects, Experience,
  Certifications, Contact.
- `src/components/` — `SiteNav`, `ProjectOverlay`, `ClientWorkOverlay`,
  `CinemaBackdrop` (escena Three.js de fondo), `FluidImage` (distorsión WebGL
  de imágenes).
- `src/composables/` — `useCinemaScene`, `usePortalScene`, `useEditorial`
  (expone `prefersReducedMotion`), `useProjectOverlay`, `useTheme`,
  `useFluidImage`, `useIntroBand`.

### Deuda concreta ya detectada

- **Bundle de 767 kB minificados (224 kB gzip).** Vite ya avisa. Three.js es
  el principal responsable.
- **`public/media/mujer.mp4` (11,7 MB) no lo referencia ningún archivo.**
- **`src/assets/assets/create.mp4` (55 MB) tampoco.** El que se sirve es el
  de 3,1 MB en `public/media/`. Borra los dos huérfanos.
- El preloader descarga el vídeo completo sin tiempo límite: en conexión
  lenta, la espera no tiene techo.
- Los overlays cierran con Escape pero la gestión de foco no está auditada.
- El `README.md` describe comportamientos que ya no existen.
- **El proyecto no está en Git.** Antes de tocar nada, haz `git init`, añade
  todo y crea un commit inicial con el estado actual. Es la red de seguridad
  para un rediseño de este alcance.

## LA REFERENCIA: QUÉ TOMAR DE AWWWARDS Y QUÉ NO

La referencia es **awwwards.com** y sus ganadores de *Site of the Day*. La
traducción tiene que ser selectiva, y esto sí no es negociable.

### Lo que SÍ transfiere a este perfil

1. **Escala tipográfica editorial.** Titulares enormes (clamp hasta
   ~12–16vw), tracking negativo agresivo en display (−0.04 a −0.07em),
   contraste brutal entre el titular y un cuerpo de 14–16px. La tipografía es
   la ilustración.
2. **Rejilla visible y asimétrica.** Doce columnas que se *noten*: líneas
   finas, elementos que se salen del margen, un bloque de 7 columnas seguido
   de otro de 4 desplazado. Nada centrado por defecto.
3. **Metadatos monoespaciados.** Los sitios premiados etiquetan todo: `(01)`,
   `SANTIAGO, CL`, `2025 —`, `[SCROLL]`. Textos de 9–11px, mayúsculas,
   tracking positivo, monoespaciada. Dan sensación de sistema y de precisión
   de instrumento.
4. **Movimiento con intención.** Nada de animar todo. Tres o cuatro gestos
   recurrentes bien ejecutados: revelado de texto por líneas con máscara,
   parallax sutil en imágenes, un indicador que reacciona al scroll,
   transición de estado al abrir una ficha de proyecto.
5. **Espacio negativo como material.** Secciones que respiran con 150–220px
   de aire vertical. El vacío es lo que hace que el contenido se lea como
   decidido y no como relleno.
6. **Una sola idea cromática, ejecutada con disciplina.** Un fondo, una
   tinta, un acento. El acento aparece poco y por eso significa algo.
7. **Cursor y estados de hover con carácter.** Un cursor personalizado que
   cambia sobre elementos accionables («VER», una flecha, un círculo que
   crece). Barato de implementar, muy reconocible.
8. **Detalle de acabado.** Bordes de 1px que se dibujan al entrar en vista,
   contadores que suben, imágenes reveladas con clip-path, números de sección
   que se quedan pegados mientras el bloque pasa.

### Lo que NO se copia (restricción dura)

Este portafolio se lo va a leer un *lead* técnico o un reclutador de **banca,
seguros y del Servicio de Impuestos Internos**. El lenguaje de estudio
creativo, llevado al literal, resta credibilidad justo con esa audiencia. Por
tanto, prohibido:

- Secuestrar el scroll o invertir su dirección.
- Entradas que tarden más de ~1,2 s antes de mostrar contenido real. Esto se
  aplica también al preloader y al portal actuales: si sobreviven, es
  dentro de ese presupuesto.
- WebGL decorativo, distorsiones de imagen o partículas. Si conservas
  Three.js, tiene que ganarse su peso en el bundle con algo que la audiencia
  note; si no, fuera.
- Texto sobre vídeo o sobre imagen con poco contraste.
- Menús que oculten la navegación tras un gesto no evidente.
- Cualquier cosa que impida a un reclutador con prisa llegar en menos de diez
  segundos a: quién es, para quién ha trabajado y cómo contactarlo.

**Criterio para resolver dudas:** si un gesto es espectacular pero retrasa la
comprensión, se descarta. La ambición visual va en la tipografía, la rejilla
y el acabado — nunca en el tiempo de acceso a la información.

## EL CONTENIDO REAL (fuente de verdad, no inventar nada)

Trayectoria verificada. Cualquier dato que no esté aquí **no se escribe**; si
falta algo, se pregunta.

- **VASS Company** (dic 2022 – sep 2023). Entró como practicante.
  Modernización de la **Biblioteca del Banco Central de Chile** a una nueva
  versión de **Liferay**. Migró en HTML/CSS/JS las secciones de
  publicaciones: política, investigación, estadísticas, eventos, prensa,
  comunicados RPM/RPF, notas de prensa.
- **Consorcio**, como externo (sep 2023 – mar 2025). Full-stack con foco
  frontend.
  - *Rentas Vitalicias* (sep 2023 – abr 2024): digitalizar un trámite que se
    hacía presencialmente. Equipo de 3 en front + 2 en back, líder de
    proyecto y product owner. **Por iniciativa propia tomó la coordinación
    del frontend**: repartir carga y formar a los compañeros. Stack: Vue 3
    Options API, Vuex, Bootstrap 5, **Modyo** como CMS (SPA incrustada),
    servicios REST en **Python**.
  - *Seguros colectivos* (abr 2024 – mar 2025): pólizas colectivas e
    individuales, desgravamen, hipotecarios. Movimiento de titulares,
    optimización de flujos, pasos a producción. Mismo stack.
- **Tukin** (abr 2025 – jun 2025). Independiente, con un excompañero de VASS.
  Plataforma web y móvil de arriendo y contratación de servicios; diseño
  entregado por el cliente. Él frontend (**Vue 3 Composition API, Pinia**),
  la contraparte backend (**NestJS**). Auth en dos pasos, login con Google y
  Facebook.
- **SONDA** (jul 2025 – presente). Desarrollador de Software Especializado,
  por licitación, para el **Servicio de Impuestos Internos**.
  - *PASC* (Procedimiento de Aplicación de Sanciones y Concesión de
    Condonaciones): migración desde legacy **GWT / Java / JBoss**. Etapa 1,
    planificación y frontend — patrones de arquitectura, uso de memoria del
    navegador, reglas de negocio; repartía el front entre dos personas y
    formaba equipos de SONDA en Vue, Axios y patrones. Etapa 2, en curso:
    backend con **Java, Spring Boot, JDBC** y creación de servicios REST.
  - *Impuestos Directos e Indirectos*: fortalece el frontend de proyectos
    internos — formularios **F29, F50, 3500, 3600, 3561, 3298, 3299 y
    herencias**. Armó repositorios y un **design system para IVA**: librería
    de componentes Vue con **CSS nativo**, minimizando dependencias para que
    cargue rápido en todo el país. Liderazgo técnico, Clean Architecture,
    estandarización, calidad y accesibilidad.

**Reglas de contenido:**
- Los nombres de cliente (Banco Central, Consorcio, SII) son la credencial
  principal. Deben ser lo primero que se lee, por encima del stack.
- **Cero métricas inventadas.** No hay cifras de usuarios, tiempos ni
  volúmenes. Si el diseño pide un número, se pide el dato o se rediseña el
  bloque sin él.
- El segundo hilo del relato es el liderazgo técnico, y se cuenta con verbos
  concretos —repartir, formar, estandarizar, migrar— nunca con la etiqueta
  «líder».
- Idioma: **español de Chile**, sin tuteo publicitario ni exclamaciones.

## LO QUE HAY QUE ENTREGAR

1. **Dirección de arte, por escrito y primero.** Antes de tocar código,
   entrega en `design-review/direccion-arte.md`:
   - Concepto en una frase.
   - Paleta con hex para tema claro y oscuro, y **cuál de las dos direcciones
     actuales sustituye o si es una tercera**.
   - Escala tipográfica completa: fuentes, pesos, tamaños con clamp,
     tracking, line-height.
   - Sistema de rejilla y escala de espaciado.
   - Inventario de gestos de movimiento, con duraciones y curvas.
   - **Veredicto sobre la entrada**: qué pasa con preloader y portal, y por
     qué.
   - **Veredicto sobre Three.js**: se queda o se va, y qué gana el sitio.
   - Estructura de secciones propuesta y en qué orden.
   Justifica cada decisión en una línea; sin adjetivos vacíos.
2. **Rediseño implementado por completo**, sección por sección: navegación,
   hero, proyectos/clientes, experiencia, certificaciones, contacto y fichas
   superpuestas.
3. **Sistema de tokens limpio.** Una sola capa de variables, sin la
   duplicación actual entre `style.css` y `creative.css`. Ningún hex suelto
   en los componentes.
4. **Ambos temas terminados.** Claro y oscuro con contraste real, no el
   oscuro invertido a la fuerza.
5. **Limpieza.** Borra los vídeos huérfanos, los scripts sueltos de la raíz
   que ya no sirvan (`_diag.mjs`, `_flow.mjs`, `_late.mjs`, `_probe.mjs`,
   `_design-review.mjs`) y actualiza el `README.md` para que describa lo que
   el sitio hace de verdad.

## RESTRICCIONES TÉCNICAS

- `prefers-reduced-motion` respetado en cada gesto. Existe
  `prefersReducedMotion` en `src/composables/useEditorial.ts`; si rehaces esa
  capa, mantén la garantía.
- Contraste AA como mínimo en texto, en los dos temas.
- Nada rompe por debajo de 360px de ancho. Sin scroll horizontal.
- Overlays: foco atrapado, cierre con Escape y foco devuelto al elemento que
  los abrió.
- **El bundle tiene que bajar de los 767 kB actuales.** Es un objetivo del
  rediseño, no un límite a no empeorar.
- `npm run build` (que incluye `vue-tsc -b`) tiene que pasar limpio.
- Puedes añadir o quitar dependencias, pero explica cada cambio: qué entra,
  qué sale y qué pesa cada cosa.

## CÓMO QUIERO QUE TRABAJES

1. `git init` y commit del estado actual, antes que nada.
2. Lee `src/data/profile.ts`, `src/style.css`, `src/creative.css` y las seis
   secciones antes de proponer nada.
3. Entrega la dirección de arte y **para**. Espera aprobación antes de
   implementar.
4. Implementa por fases, con un commit por fase, no todo de golpe. Al
   terminar cada una, dime qué cambió y qué decisión tomaste si hubo
   alternativas.
5. Verifica con `npm run build` y con capturas en Chromium a 1440×1000 y
   390×844, en ambos temas. Compara el tamaño del bundle antes y después.
6. Si algo del contenido te falta para que el diseño funcione, **pregunta en
   vez de rellenar**.

## CRITERIO DE ÉXITO

Que un reclutador entienda en diez segundos que este desarrollador construye
sistemas críticos para el Banco Central, Consorcio y el SII — y que al mismo
tiempo el sitio se vea lo bastante trabajado como para que nadie dude de su
criterio visual. Ambicioso en el acabado, sobrio en el acceso a la
información, y más ligero de lo que es hoy.
