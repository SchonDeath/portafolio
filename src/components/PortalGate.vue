<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/composables/useEditorial'
import { useTheme } from '@/composables/useTheme'
import { profile } from '@/data/profile'
import {
  BAND_HEIGHT_PX,
  OPENING_WIDTH,
  OPEN_DELAY_S,
  OPEN_HEIGHT_S,
  OPEN_WIDTH_S,
  STAGE_SCALE,
} from '@/composables/useIntroBand'

const emit = defineEmits<{ enter: [] }>()

const props = withDefaults(
  defineProps<{
    /**
     * Segundos que espera la entrada. Cuando el portal se monta debajo del
     * preloader conviene arrancar mientras el negro aún se está yendo: así
     * una pantalla releva a la otra sin un instante muerto en medio.
     */
    introDelay?: number
  }>(),
  { introDelay: 0.35 },
)

const { theme } = useTheme()

const gate = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
/** Envoltorio de la imagen: lleva el zoom, mientras la caja lleva la apertura. */
const media = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const overlay = ref<HTMLElement | null>(null)
const entering = ref(false)
/** El primer fotograma ya está pintado: podemos fundir el póster. */
const videoReady = ref(false)

/**
 * El plano es de tren de día y el sitio es azul de medianoche. En vez de
 * elegir uno, el metraje se lleva a la hora del sitio: se le baja el
 * brillo, se le sube el contraste y se le quita casi todo el color, y
 * encima van las capas de tinte que hacen el resto. Sin esto el vídeo
 * entra gris y luminoso y rompe la continuidad con lo que viene después.
 */
const videoGrade = computed(() =>
  theme.value === 'dark'
    ? 'brightness(0.42) contrast(1.26) saturate(0.38)'
    : 'brightness(0.78) contrast(1.08) saturate(0.7)',
)

/**
 * Tinte de color sobre el metraje. Va en `color` — el modo que conserva
 * la luminancia original y sustituye solo el matiz — para que el azul
 * caiga sobre el plano sin aplastar el modelado de la cara ni el punto
 * de luz de la ventana.
 */
const tint = computed(() =>
  theme.value === 'dark'
    ? 'linear-gradient(180deg, #0d1a3a 0%, #101c38 45%, #0a1226 100%)'
    : 'linear-gradient(180deg, #35486e 0%, #3c4f74 45%, #2c3a5a 100%)',
)

/**
 * Velo de legibilidad. El texto va a la derecha, siguiendo la mirada del
 * plano, así que el oscurecimiento pesa en ese lado en vez de repartirse:
 * un velo parejo apagaría también la cara, que es lo único que el
 * encuadre tiene que conservar intacto.
 */
const veil = computed(() => {
  const rgb = theme.value === 'dark' ? '4, 8, 20' : '18, 26, 44'
  return (
    `linear-gradient(100deg, rgba(${rgb}, 0.55) 0%, rgba(${rgb}, 0.18) 26%, ` +
    `rgba(${rgb}, 0.30) 48%, rgba(${rgb}, 0.78) 78%, rgba(${rgb}, 0.92) 100%)`
  )
})

/** El titular se parte para poder escalonar la entrada línea a línea. */
const roleParts = computed(() => {
  const [first, second] = profile.role.split('&').map((s) => s.trim())
  return { first, second }
})

/**
 * El nombre partido en palabras, para escalonar la entrada una a una.
 *
 * Cada palabra lleva su propia máscara de recorte. Partirlo más fino —por
 * letra— obligaba a un recorte por carácter que cortaba los acentos de
 * «Sebastián» y «González» y dejaba huecos entre glifos.
 */
const nameWords = computed(() => profile.name.split(' '))

/* ── Bucle continuo ───────────────────────────────────────── */

/**
 * El clip no cierra donde abre: en bucle normal se vería un corte duro
 * cada vuelta, justo la costura que delata que el fondo es un archivo que
 * se repite. Se resuelve con dos copias del mismo vídeo desfasadas:
 * mientras una se acerca a su final, la otra ya está corriendo desde el
 * principio, y el relevo se hace fundiendo una en otra. El plano nunca
 * frena ni retrocede — no hay final que ver.
 *
 * El relevo se calcula contra `duration`, leída del propio archivo, así que
 * no hay que tocar nada al cambiar el clip: el vídeo se ve entero y el
 * cruce cae siempre en sus últimos segundos.
 *
 * Es preferible a invertir la reproducción: la marcha atrás obliga a
 * mover `currentTime` frame a frame, y en el punto de giro el
 * movimiento se detiene y se nota.
 */
/** Segundos de solape entre una copia y la siguiente. */
const CROSSFADE = 1.1

/**
 * Punto de entrada del clip, en segundos.
 *
 * El arranque del archivo tarda en tener movimiento y esa espera se come el
 * momento en que el recuadro se abre —justo cuando el plano tiene que estar
 * vivo—. Entrando algo más adelante, el vídeo ya está en marcha cuando se
 * ve por primera vez.
 *
 * Vale también para cada vuelta del bucle: la copia que releva arranca
 * igualmente aquí, así que el plano nunca vuelve al tramo muerto.
 */
const VIDEO_START = 0.05

const videoB = ref<HTMLVideoElement | null>(null)
/** Cuál de las dos copias está al frente. */
const front = ref<'a' | 'b'>('a')
let swapping = false
let rafId = 0

/**
 * El clip, preferentemente desde el blob que ya bajó el preloader: es el
 * mismo archivo cuyos bytes midieron la barra de carga, así que reproducirlo
 * desde memoria evita descargarlo por segunda vez. Sin preloader —o si
 * aquella descarga falló— cae a la ruta pública de siempre.
 *
 * Es un `ref` que se rellena en el montaje, no una constante leída al crear
 * el componente: el portal se monta cuando el preloader ya terminó, pero
 * este módulo se importa al arrancar la app, con el blob todavía sin
 * existir. Leyéndolo entonces quedaba fijado en la ruta de red y el vídeo
 * se descargaba una segunda vez entero.
 *
 * Arranca vacío y no como la ruta pública: con un `src` de red puesto desde
 * el primer render, el navegador empieza esa descarga antes de que el
 * montaje alcance a sustituirla por el blob.
 */
const videoSrc = ref('')

/** Referencias a la copia visible y a la que espera turno. */
const layers = () => {
  const a = video.value
  const b = videoB.value
  return front.value === 'a' ? { on: a, off: b } : { on: b, off: a }
}

/**
 * Vigila el final de la copia visible. Cuando entra en la ventana de
 * solape, arranca la de detrás desde cero y cruza la opacidad: el corte
 * cae dentro del fundido, donde el ojo no lo encuentra.
 */
const watchLoop = () => {
  rafId = requestAnimationFrame(watchLoop)

  const { on, off } = layers()
  if (!on || !off || !on.duration || swapping) return

  if (on.currentTime >= on.duration - CROSSFADE) {
    swapping = true
    off.currentTime = VIDEO_START
    void off.play().catch(() => {})
    front.value = front.value === 'a' ? 'b' : 'a'

    // Pasado el fundido, la que quedó atrás se detiene: dos vídeos
    // decodificando a la vez todo el rato es gasto puro, y solo hacen
    // falta juntos durante el solape.
    window.setTimeout(() => {
      on.pause()
      swapping = false
    }, CROSSFADE * 1000)
  }
}

/**
 * Pone el clip en marcha. Se llama en el montaje y otra vez desde
 * `loadeddata`, y es idempotente a propósito: cuál de los dos llega
 * primero depende de si el vídeo venía del blob del preloader —ya en
 * memoria, listo en el mismo frame— o de la red.
 *
 * Importa que sea el montaje quien mande cuando puede: la apertura del
 * plano empieza en ese instante, y esperar a `loadeddata` dejaba el primer
 * tramo del crecimiento mostrando un fotograma congelado.
 */
const startVideo = () => {
  const el = video.value
  if (!el) return

  el.playbackRate = 0.85
  if (videoB.value) videoB.value.playbackRate = 0.85

  // Entra por el punto de partida, no por el cero del archivo. Se comprueba
  // que siga al principio para no dar un salto atrás si esto se llama otra
  // vez con el clip ya corriendo —`startVideo` es idempotente a propósito y
  // lo llaman tanto el montaje como `loadeddata`.
  if (el.currentTime < VIDEO_START) el.currentTime = VIDEO_START

  // Autoplay puede rechazarse pese a `muted` (ahorro de batería, ajustes
  // del navegador). Si pasa, el póster se queda: el portal sigue siendo
  // legible porque el texto nunca dependió del movimiento.
  void el.play().catch(() => {})

  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(watchLoop)
}

/**
 * Espera a que el clip tenga fotograma que pintar, con un tope.
 *
 * Tener los bytes en memoria no es tener imagen: asignar el blob y
 * decodificarlo cuesta medio segundo largo, y ese tramo caía justo encima
 * de la apertura del plano. Quien la abre la espera antes de empezar, para
 * que el rectángulo crezca ya con vídeo dentro en vez de con el póster.
 *
 * `readyState >= 3` es HAVE_FUTURE_DATA: hay fotograma actual y algo más
 * por delante, que es lo que hace falta para que arranque sin tirones.
 */
const videoPlayable = () =>
  new Promise<void>((resolve) => {
    const el = video.value
    if (!el || el.readyState >= 3) return resolve()

    // Tope de seguridad: si la decodificación se atasca, el portal entra
    // igual con el póster. Vale más una entrada a tiempo que una espera
    // indefinida.
    //
    // Lo normal es no llegar aquí: el preloader ya esperó a que el blob
    // fuera reproducible, así que al montarse el portal el fotograma suele
    // estar. Esto cubre el caso en que aquella espera venció por su cuenta.
    const timer = window.setTimeout(finish, 3000)
    function finish() {
      window.clearTimeout(timer)
      el?.removeEventListener('canplay', finish)
      el?.removeEventListener('error', finish)
      resolve()
    }
    el.addEventListener('canplay', finish, { once: true })
    el.addEventListener('error', finish, { once: true })
  })

/**
 * Hay imagen que mostrar: se puede apagar el póster.
 *
 * `readyState >= 2` es HAVE_CURRENT_DATA — el fotograma actual ya está
 * decodificado. Con el blob del preloader eso suele cumplirse desde el
 * primer frame, y comprobarlo evita esperar un evento que ya pasó.
 */
const onLoaded = () => {
  videoReady.value = true
  startVideo()
}

/* ── Paralaje ─────────────────────────────────────────────── */

/**
 * El puntero mueve el plano y el texto en sentidos opuestos y a distinta
 * amplitud. Es poco recorrido a propósito: lo justo para que la pantalla
 * respire y se lea como profundidad, sin convertirse en un efecto.
 */
let quickStageX: gsap.QuickToFunc | null = null
let quickStageY: gsap.QuickToFunc | null = null
let quickTextX: gsap.QuickToFunc | null = null

const onPointerMove = (e: PointerEvent) => {
  if (entering.value || !quickStageX) return

  const x = (e.clientX / window.innerWidth) * 2 - 1
  const y = (e.clientY / window.innerHeight) * 2 - 1

  quickStageX(-x * 18)
  quickStageY?.(-y * 12)
  quickTextX?.(x * 8)
}

/* ── Entrada y salida ─────────────────────────────────────── */

/** Atraviesa el umbral y avisa al padre para que revele el sitio. */
const enter = () => {
  if (entering.value) return
  entering.value = true

  if (prefersReducedMotion()) {
    emit('enter')
    return
  }

  const tl = gsap.timeline({ onComplete: () => emit('enter') })

  // El texto se retira primero: si sale a la vez que la cámara empuja,
  // no da tiempo de leer nada y el cruce se siente sucio.
  tl.to(overlay.value, { opacity: 0, y: -28, duration: 0.5, ease: 'power2.in' })
    // La cámara entra en el plano —zoom y desenfoque a la vez, como una
    // óptica que se abre— y el conjunto se va a blanco de luz. Es el
    // gesto que traduce «atravesar»: no se corta a la siguiente
    // pantalla, se pasa a través de esta.
    .to(
      // La cámara empuja sobre la imagen, no sobre la ventana: escalando la
      // caja crecería el marco y se vería asomar el fondo por los bordes.
      media.value,
      // Empuja desde el zoom de reposo, no desde 1: es un avance sobre el
      // encuadre que ya hay, no un reencuadre.
      { scale: STAGE_SCALE * 1.09, filter: 'blur(14px)', duration: 1.5, ease: 'power3.inOut' },
      '-=0.25',
    )
    .to('[data-flash]', { opacity: 1, duration: 0.5, ease: 'power2.in' }, '-=0.75')
    .to(gate.value, { opacity: 0, duration: 0.45, ease: 'power2.out' }, '-=0.2')
}

onMounted(async () => {
  // El `src` se resuelve aquí, con el preloader ya terminado y el blob —si
  // lo hay— puesto en `window`. Ver arriba por qué no puede leerse antes.
  videoSrc.value = window.__portalVideoUrl ?? '/media/create.mp4'
  // Vue aplica el `src` en el siguiente ciclo; sin esperarlo, `startVideo`
  // llamaría a `play()` sobre un elemento que todavía no tiene fuente.
  await nextTick()

  // El clip arranca aquí, no en `loadeddata`: viene del blob que ya bajó el
  // preloader, así que suele estar reproducible en este mismo frame y la
  // apertura del plano empieza justo ahora. Si aún no lo está, `loadeddata`
  // vuelve a llamar y no pasa nada — `startVideo` puede repetirse.
  //
  // Va antes de la guarda de movimiento reducido: quien la tenga activada
  // no ve la animación de entrada, pero el fondo sigue siendo el vídeo.
  startVideo()

  // El zoom de reposo va siempre, con o sin animación: no es un gesto sino
  // el encuadre del plano —lo que deja la marca de agua del clip fuera de
  // cuadro—. Por eso se aplica antes de la guarda de movimiento reducido.
  gsap.set(media.value, { scale: STAGE_SCALE })

  if (prefersReducedMotion()) return

  // El estado de partida se fija ya, en el montaje, y no cuando arranca el
  // timeline: entre una cosa y la otra se espera al vídeo, y si esa espera
  // se alarga más que el negro del preloader el plano asomaría entero un
  // instante antes de encogerse para volver a abrirse.
  //
  // El recuadro nace con la altura y el nivel exactos de la barra de carga
  // llena, pero corto de ancho y centrado. Así la barra no desaparece para
  // que entre el vídeo: se convierte en él y se abre desde ahí.
  //
  // Se hace recortando con `clip-path`, no escalando la caja. Escalar era lo
  // inmediato, pero obliga a devolverle la forma al vídeo con la inversa de
  // la escala, y en la banda inicial esa inversa es un factor de 37: el
  // plano tendría que pintarse a 40.000 píxeles de alto, una capa de 96
  // megapíxeles que ningún navegador rasteriza. El primer frame del gesto
  // —justo el que hay que cuidar— saldría en blanco o a tirones.
  //
  // Recortando, el vídeo se pinta siempre a su tamaño real y lo único que
  // se mueve es la ventana por la que se ve. `clip-path` corre en el
  // compositor igual que `transform`, así que no se pierde fluidez, y como
  // la imagen nunca se deforma tampoco hay contra-escala que sincronizar.
  // El recuadro nace centrado, a la altura de la barra de carga y con un
  // ancho corto —no cruzando la pantalla—, con el vídeo ya corriendo dentro.
  const insetY = (100 - (BAND_HEIGHT_PX / window.innerHeight) * 100) / 2
  const insetX = (100 - OPENING_WIDTH * 100) / 2
  gsap.set(stage.value, {
    clipPath: `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}%)`,
    force3D: true,
  })
  gsap.set(media.value, { scale: STAGE_SCALE })

  // Estado de partida del nombre: las letras encimadas —espaciado negativo,
  // más cerrado que el `-0.04em` de reposo— y en transparente. Desde ahí se
  // abren hasta su tracking normal.
  //
  // `letter-spacing` aplica el hueco también después de la última letra, así
  // que al cerrarlo la palabra se iría hacia la derecha. El margen cancela
  // ese faltante y la mantiene centrada durante toda la apertura.
  const NAME_FROM = { letterSpacing: '-0.5em', marginRight: '0.5em', opacity: 0 }

  // El paralaje mueve la imagen, no la ventana: desplazando la caja se
  // despegaría de los bordes de la pantalla y asomaría el fondo.
  quickStageX = gsap.quickTo(media.value, 'x', { duration: 1.1, ease: 'power3.out' })
  quickStageY = gsap.quickTo(media.value, 'y', { duration: 1.1, ease: 'power3.out' })
  quickTextX = gsap.quickTo(overlay.value, 'x', { duration: 1.4, ease: 'power3.out' })
  window.addEventListener('pointermove', onPointerMove)

  // El nombre se deja ya en su estado de partida —letras encimadas y
  // transparente— antes de esperar al vídeo.
  //
  // El `.from()` de más abajo no basta por sí solo: no escribe nada hasta
  // que el timeline llega a él, y hasta ese momento el nombre queda pintado
  // en su sitio y a plena opacidad. Con la espera al vídeo de por medio eso
  // son cientos de milisegundos con el título ya puesto, que es justo lo que
  // se veía aparecer de golpe al terminar la carga.
  gsap.set('[data-name-word] > *', NAME_FROM)

  // La apertura no empieza hasta que hay imagen. Mientras se espera, el
  // preloader sigue en pantalla tapando esto: lo que el visitante ve es la
  // barra llena un instante más, no un plano negro.
  await videoPlayable()
  // Fuera el póster sólo si de verdad hay fotograma decodificado. Apagarlo
  // por haber salido de la espera —que también termina por tope— lo fundía
  // sobre un vídeo aún negro, y ese hueco caía en mitad del zoom de entrada.
  // Si no lo hay, el póster se queda y lo releva `onLoaded` cuando llegue.
  if ((video.value?.readyState ?? 0) >= 2) videoReady.value = true
  startVideo()

  const tl = gsap.timeline({ delay: props.introDelay })

  // Entrada en dos tiempos. Primero el plano se abre, y solo después
  // entra el texto: primero la escena, luego quien la habla.
  //
  // La apertura no parte de un recuadro cualquiera: parte de la barra de
  // carga. Cuando el preloader se retira, lo que queda en pantalla es un
  // recuadro a la altura y el nivel exactos que tenía la barra —36 píxeles,
  // centrado— pero corto de ancho y con el vídeo ya corriendo dentro. La
  // barra no se va: se convierte en el plano y se abre.
  //
  // El `gate` no se funde: aparece opaco desde el primer frame y lo único
  // que se mueve es el plano. Con un fundido encima, la apertura pasaba a
  // través de un velo semitransparente y el arranque se perdía.
  //
  // Los dos ejes se abren a la vez pero no al mismo ritmo: el ancho cierra
  // antes que el alto. Es lo que hace que el gesto se lea como algo que se
  // despliega —gana campo a los lados y termina de abrirse en vertical— en
  // vez de como una caja que se agranda en bloque.
  //
  // `clip-path` es una sola propiedad, así que sus dos ejes no pueden llevar
  // duraciones distintas animándola directamente. Se animan por separado los
  // insets sobre este objeto y se recompone la cadena en cada frame.
  const band = { x: insetX, y: insetY }
  const drawBand = () => {
    gsap.set(stage.value, {
      clipPath: `inset(${band.y}% ${band.x}% ${band.y}% ${band.x}%)`,
    })
  }

  tl.to(
    band,
    {
      x: 0,
      duration: OPEN_WIDTH_S,
      // `power2.inOut` en los dos ejes: entra sin tirón, sostiene el centro
      // del recorrido y se asienta sin frenazo. La misma curva en ambos —lo
      // que los separa es la duración, no el carácter— para que el recuadro
      // crezca como una sola forma y no como dos bordes sueltos.
      ease: 'power2.inOut',
      onUpdate: drawBand,
    },
    OPEN_DELAY_S,
  ).to(
    band,
    {
      y: 0,
      duration: OPEN_HEIGHT_S,
      ease: 'power2.inOut',
      onUpdate: drawBand,
      // El recorte deja de costar en cuanto termina: mantenerlo fijaría una
      // capa de composición durante toda la vida del portal.
      onComplete: () => gsap.set(stage.value, { clearProps: 'clipPath' }),
    },
    // Arranca en el mismo instante que el ancho. Lo que los separa es
    // cuánto tarda cada uno, no cuándo empieza.
    OPEN_DELAY_S,
  )
    // El texto espera a que el rectángulo termine de encajar. No se solapa
    // con la apertura: el recorte del vídeo cortaría también el titular, y
    // el orden —primero la escena, después quien la habla— es el que hace
    // que las dos cosas se lean.
    //
    // El nombre entra abriendo el espaciado: las letras arrancan encimadas
    // y se separan hasta su tracking de reposo. Es un gesto de título —la
    // palabra se despliega ante el ojo en vez de aparecer hecha— y funciona
    // aquí porque el nombre va en una sola línea y a gran tamaño, donde esa
    // apertura se ve.
    //
    // Se separa del gesto del rol y el resto del titular, que entran por
    // máscara: el nombre es lo único que esta pantalla tiene que decir.
    // `fromTo` y no `from`: el estado de partida ya está puesto más arriba
    // —hace falta, o el nombre se veía en su sitio hasta que el timeline
    // llegaba aquí— y un `from` toma como destino el valor que encuentra al
    // arrancar, que es justo ese mismo. El nombre se quedaba congelado
    // encimado y transparente, animándose de `-0.5em` a `-0.5em`. Declarando
    // los dos extremos no hay ambigüedad.
    .fromTo(
      '[data-name-word] > *',
      NAME_FROM,
      {
        // El tracking de reposo del `h1`, al que las letras se abren.
        letterSpacing: '-0.04em',
        marginRight: '0em',
        opacity: 1,
        duration: 0.7,
        // El `easeOutCubic` de la referencia: sale rápido y frena al abrir,
        // que es lo que hace que el texto se asiente en vez de golpear su
        // posición final.
        ease: 'power3.out',
        // Escalonado corto: las dos palabras abren casi a la vez y el nombre
        // se lee como una línea, no como dos entradas separadas.
        stagger: 0.09,
      },
      // Respiración mínima con el plano ya completo. El rectángulo asienta
      // y el nombre entra encima.
      '+=0.1',
    )
    // El resto del titular —rol y demás— entra igual, por línea completa,
    // pisando el final del nombre para que la entrada se lea como un solo
    // movimiento en cascada y no como bloques por turnos.
    .from(
      '[data-mask-line] > *',
      { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: 0.1 },
      '-=0.75',
    )
    .from(
      '[data-gate-in]',
      { y: 18, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.11 },
      '-=0.8',
    )
    // La regla vertical se traza al final, cuando ya hay algo que separar.
    .from('[data-rule]', { scaleY: 0, duration: 1, ease: 'expo.out' }, '-=0.9')
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <!-- Negro puro, el mismo del preloader. El corte entre una pantalla y
       otra no debe verse: si este fondo tirara a azul, el relevo dejaría un
       cambio de tono justo cuando el recuadro empieza a abrirse, y ese
       parpadeo delata el montaje. Es también el negro sobre el que se recorta
       el recuadro del vídeo mientras crece. -->
  <div ref="gate" class="fixed inset-0 z-50 overflow-hidden bg-black">
    <!-- ── Plano de fondo ──────────────────────────────────────
         El vídeo y sus capas de color van juntos en el mismo
         contenedor: al empujar la cámara en la salida tienen que
         escalar como una sola imagen, no por separado.

         La escala no se declara aquí: la pone GSAP en el montaje, porque
         el plano arranca por debajo de su tamaño de reposo y crece durante
         la apertura. El valor de reposo —y por qué no es 1— vive en
         `STAGE_SCALE`.

         No hace falta nada que lo centre: la caja ocupa la pantalla entera
         y `scale` la encoge desde su propio centro —`origin-center`, que es
         el valor por defecto pero se declara para que se lea—. El recuadro
         queda centrado en los dos ejes por construcción, sin `translate`
         que GSAP pudiera pisar al animar la escala.

         Dentro, las capas de imagen llenan la caja y se encogen con ella:
         lo que se ve en el recuadro inicial es el plano entero reducido, no
         un recorte de uno grande. -->
    <div
      ref="stage"
      class="absolute inset-0 origin-center overflow-hidden will-change-transform"
    >
      <!-- Todo lo que es imagen va aquí dentro, llenando la caja y
           creciendo con ella. Así el `object-cover` del vídeo lo reencuadra
           a cada tamaño y en el cuadrado inicial se ve el plano entero,
           como una miniatura. Midiendo la ventana en vez de la caja, del
           cuadrado solo asomaba un recorte del centro de un plano gigante
           y no se leía como imagen.

           La escala del zoom la lleva este envoltorio y no la caja:
           escalando la caja se agrandaría la ventana —el recuadro que se
           abre— en vez de lo que se ve por ella, y el gesto dejaría de
           leerse como un acercamiento. -->
      <div ref="media" class="absolute inset-0 will-change-transform">
      <!-- Póster: cubre el hueco mientras el vídeo carga y queda debajo
           como respaldo si el navegador rechaza la reproducción. -->
      <img
        src="/media/create-poster.jpg"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full object-cover object-[30%_center] transition-opacity duration-700"
        :class="videoReady ? 'opacity-0' : 'opacity-100'"
        :style="{ filter: videoGrade }"
      />

      <!-- Las dos copias del clip. Se relevan fundiéndose una en otra al
           llegar al final, de modo que el plano no tiene vuelta visible:
           una sola etiqueta con `loop` mostraría el salto del último
           fotograma al primero cada cinco segundos. -->
      <video
        ref="video"
        class="absolute inset-0 h-full w-full object-cover object-[30%_center] transition-opacity ease-linear"
        :class="front === 'a' ? 'opacity-100' : 'opacity-0'"
        :style="{ filter: videoGrade, transitionDuration: `${CROSSFADE * 1000}ms` }"
        :src="videoSrc || undefined"
        poster="/media/create-poster.jpg"
        muted
        playsinline
        autoplay
        preload="auto"
        aria-hidden="true"
        @loadeddata="onLoaded"
      ></video>

      <video
        ref="videoB"
        class="absolute inset-0 h-full w-full object-cover object-[30%_center] transition-opacity ease-linear"
        :class="front === 'b' ? 'opacity-100' : 'opacity-0'"
        :style="{ filter: videoGrade, transitionDuration: `${CROSSFADE * 1000}ms` }"
        :src="videoSrc || undefined"
        muted
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>

      <!-- Tinte de hora: lleva el metraje al azul del sitio conservando
           la luminancia, para no aplastar el modelado de la cara. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 mix-blend-color"
        :style="{ background: tint, opacity: theme === 'dark' ? 0.82 : 0.55 }"
      ></div>
      </div>

      <!-- ── Capas de tratamiento ────────────────────────────────
           Dentro de la caja, no fuera: son el tratamiento de lo que se ve
           por la ventana, así que tienen que recortarse con ella. Colgadas
           del `gate` cubrían la pantalla entera, y mientras la caja medía
           la franja el velo y el viñeteado le caían encima — la imagen se
           veía turbia y apagada justo en el momento en que tenía que
           entrar limpia.

           Van fuera de `media` y no dentro: son del objetivo, no de la
           escena, así que no escalan ni se desplazan con el paralaje. -->

      <!-- Velo de legibilidad, cargado al lado del texto -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0"
        :style="{ background: veil }"
      ></div>

      <!-- Viñeteado: cierra las esquinas y empuja la mirada al centro -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0"
        style="
          background: radial-gradient(ellipse 80% 70% at 42% 50%, transparent 40%, rgba(2, 5, 12, 0.62) 100%);
        "
      ></div>

      <!-- Grano: rompe el bandeado de los degradados sobre el cielo, que
           en pantallas grandes se ve a franjas. -->
      <div aria-hidden="true" class="portal-grain pointer-events-none absolute inset-0"></div>

    </div>

    <!-- Fogonazo del cruce: arranca invisible y sube al atravesar -->
    <div
      data-flash
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-0"
      style="background: radial-gradient(circle at 42% 50%, #dff3fb 0%, #8fd9ee 35%, #04070f 100%)"
    ></div>

    <!-- ── Contenido ───────────────────────────────────────────
         A la derecha, siguiendo la dirección de la mirada del plano:
         puesto a la izquierda quedaría encima de la cara y contra el
         sentido del encuadre. -->
    <div
      ref="overlay"
      class="pointer-events-none absolute inset-0 flex items-center justify-center px-7 sm:px-12 lg:px-20"
    >
      <!-- Sin ancho máximo: el nombre va en una sola línea y un contenedor
           estrecho lo obligaría a partirse. Lo que necesita medida es el
           texto de apoyo, y ese la lleva en su propio bloque. -->
      <div class="flex w-full flex-col items-center text-center">
        <p data-gate-in class="eyebrow mb-7 flex items-center gap-3 text-white/60">
          <span class="bg-accent-bright/70 inline-block h-px w-8"></span>
          {{ profile.greeting }}
        </p>

        <!-- El cielo es oscuro en ambos temas, así que el texto va en
             claro siempre: heredar el color del tema lo dejaba azul
             marino sobre azul marino. -->
        <!-- El nombre, por palabras: cada una sube desde detrás de su
             propia máscara, que es lo que hace que se lea como impresa y no
             como superpuesta. Es el mismo gesto del rol y del resto del
             titular, a propósito — el nombre no necesita una entrada
             distinta para ser lo primero que se lee, ya lo es por tamaño.

             Sin `text-shadow`: la sombra difusa que llevaba antes se leía
             como una mancha oscura detrás del texto en vez de como sombra.
             La legibilidad ya la da el velo del plano. -->
        <h1
          class="flex flex-nowrap justify-center gap-x-[0.24em] text-[min(8.6vw,6.6rem)] leading-[1.02] font-semibold tracking-[-0.04em] whitespace-nowrap text-white"
        >
          <!-- Sin `overflow-hidden`: el nombre entra abriendo el espaciado,
               no subiendo desde detrás de un recorte, y un recorte aquí le
               cortaría las letras mientras están encimadas. El `pb` se queda
               por las colas de la «g» y la «z». -->
          <span
            v-for="(word, w) in nameWords"
            :key="w"
            data-name-word
            class="block pb-[0.12em]"
          >
            <span class="block">{{ word }}</span>
          </span>
        </h1>

        <!-- Regla vertical: separa nombre de rol sin una línea horizontal
             más, que aquí competiría con las barras del encuadre. -->
        <div class="mt-8 flex items-stretch gap-6">
          <span
            data-rule
            aria-hidden="true"
            class="w-px shrink-0 origin-top bg-linear-to-b from-transparent via-white/45 to-transparent"
          ></span>

          <div class="flex flex-col">
            <span data-mask-line class="block overflow-hidden pb-[0.1em]">
              <span
                class="block text-[clamp(1.15rem,2.4vw,1.9rem)] leading-tight font-light text-white/90"
              >
                {{ roleParts.first }}
              </span>
            </span>
            <span v-if="roleParts.second" data-mask-line class="block overflow-hidden pb-[0.1em]">
              <span
                class="from-accent-bright to-accent-alt block bg-linear-to-r bg-clip-text text-[clamp(1.15rem,2.4vw,1.9rem)] leading-tight font-light text-transparent italic"
              >
                {{ roleParts.second }}
              </span>
            </span>
          </div>
        </div>

        <button
          data-gate-in
          type="button"
          class="group bg-accent text-surface-deep hover:bg-accent-bright focus-visible:ring-accent-bright pointer-events-auto mt-14 inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-semibold tracking-wide shadow-[0_0_40px_-8px_rgba(67,196,227,0.7)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_55px_-6px_rgba(127,219,239,0.9)] active:translate-y-0 active:duration-75 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          :disabled="entering"
          @click="enter"
        >
          Entrar al perfil
          <!-- La flecha acompaña al empuje del botón: mismo tiempo y misma
               curva, para que las dos cosas se lean como un solo gesto. -->
          <span
            aria-hidden="true"
            class="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none"
          >
            →
          </span>
        </button>

        <!-- Pie de metadatos. Envuelve por líneas enteras en vez de
             partir cada dato: en pantallas estrechas los dos rótulos
             caían uno sobre otro y se leían superpuestos. El guion solo
             aparece cuando de verdad separa dos cosas en la misma
             línea. -->
        <p
          data-gate-in
          class="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs tracking-widest text-white/45 uppercase"
        >
          <span class="whitespace-nowrap">{{ profile.location }}</span>
          <span
            aria-hidden="true"
            class="hidden h-px w-6 bg-white/25 sm:inline-block"
          ></span>
          <span v-if="profile.available" class="text-accent-bright/80 whitespace-nowrap">
            {{ profile.availableLabel }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/**
 * Grano en SVG en vez de una textura: unos cientos de bytes en el CSS y
 * nada que pedir a la red. La opacidad es baja a propósito — tiene que
 * notarse como material del plano, no como suciedad encima.
 */
.portal-grain {
  opacity: 0.16;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
