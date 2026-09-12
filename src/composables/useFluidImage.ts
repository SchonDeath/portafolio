import * as THREE from 'three'
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Distorsión tipo líquido sobre una imagen, al estilo de las galerías de
 * fromanother.love: el cursor empuja la textura como si fuera la
 * superficie de agua, con una estela que se disipa en vez de seguir el
 * puntero al instante.
 *
 * La técnica: un plano con la imagen como textura, desplazado en el
 * fragment shader por un mapa de "ondas" que vive en un render target
 * aparte. Cada frame, ese mapa se atenúa un poco (el agua se calma) y se
 * le suma la posición actual del cursor (la perturbación). El resultado
 * se usa como un mapa de normales improvisado para refractar la imagen.
 *
 * Un shader por imagen sería correcto pero caro si hay muchas tarjetas
 * en pantalla a la vez; aquí cada instancia trae su propio renderer
 * pequeño y se limita a redibujar solo mientras el cursor está encima,
 * así que el coste real es casi cero salvo cuando se está interactuando.
 */

const WAVE_DECAY = 0.965
const WAVE_RADIUS = 0.12

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** Deposita una perturbación puntual en el mapa de ondas y atenúa el resto. */
const waveFragmentShader = /* glsl */ `
  uniform sampler2D uPrev;
  uniform vec2 uPointer;
  uniform float uStrength;
  uniform float uAspect;
  uniform float uDecay;
  uniform float uRadius;
  varying vec2 vUv;

  void main() {
    vec4 prev = texture2D(uPrev, vUv) * uDecay;

    vec2 diff = vUv - uPointer;
    diff.x *= uAspect;
    float dist = length(diff);
    float falloff = smoothstep(uRadius, 0.0, dist);

    // La dirección de la perturbación es radial desde el punto de
    // impacto: es lo que hace que la imagen parezca abombarse y no solo
    // desplazarse en bloque.
    vec2 dir = dist > 0.0001 ? normalize(vUv - uPointer) : vec2(0.0);
    vec2 delta = dir * falloff * uStrength;

    gl_FragColor = prev + vec4(delta, 0.0, falloff);
  }
`

const displayFragmentShader = /* glsl */ `
  uniform sampler2D uImage;
  uniform sampler2D uWave;
  uniform vec2 uCover;
  varying vec2 vUv;

  void main() {
    vec4 wave = texture2D(uWave, vUv);
    // El desplazamiento de la textura es el propio vector de onda: así
    // la imagen se "arruga" hacia donde viajó la perturbación, en vez de
    // solo aclararse u oscurecerse en el punto de contacto.
    vec2 uv = vUv + wave.rg;

    // Equivalente a object-fit: cover. Sin esto la textura se estira
    // hasta llenar el plano y las portadas salen deformadas cuando su
    // proporción no coincide con la del contenedor.
    uv = (uv - 0.5) * uCover + 0.5;

    gl_FragColor = texture2D(uImage, uv);
  }
`

export interface FluidImageOptions {
  /** Cuánto empuja el cursor por frame; sube para un efecto más líquido. */
  strength?: number
}

/**
 * Aplica el efecto a un `<img>` existente: lo sustituye visualmente por
 * un `<canvas>` del mismo tamaño (la imagen original queda oculta pero
 * en el DOM, para SEO, lectores de pantalla y como respaldo si WebGL
 * falla al crear el contexto).
 */
export function useFluidImage(
  containerRef: Ref<HTMLElement | null>,
  imgRef: Ref<HTMLImageElement | null>,
  options: FluidImageOptions = {},
) {
  const { strength = 0.045 } = options

  let renderer: THREE.WebGLRenderer | null = null
  let waveTargetA: THREE.WebGLRenderTarget | null = null
  let waveTargetB: THREE.WebGLRenderTarget | null = null
  let observer: ResizeObserver | null = null
  let frame = 0
  let active = false
  let disposed = false

  const pointer = new THREE.Vector2(0.5, 0.5)
  const pointerStrength = { value: 0 }

  onMounted(() => {
    const container = containerRef.value
    const img = imgRef.value
    if (!container || !img) return

    // Sin WebGL (contexto perdido, navegador restringido) la imagen de
    // respaldo ya está en el DOM: no hay nada más que hacer.
    if (!window.WebGLRenderingContext) return

    const waveScene = new THREE.Scene()
    const displayScene = new THREE.Scene()
    // Cámara de "fullscreen quad": el frustum va de -1 a 1 y el plano
    // mide 2×2, así que el plano cubre exactamente el viewport sea cual
    // sea su proporción. Con un frustum de 1×1 sobre un canvas
    // rectangular, la proyección se deforma y el plano acaba ocupando
    // solo parte del área.
    // La cámara se separa del plano en Z: con `near = 0` y el plano en
    // z = 0, la geometría queda justo sobre el plano de recorte cercano
    // y puede descartarse parcialmente.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1
    camera.updateProjectionMatrix()

    const waveUniforms = {
      uPrev: { value: null as THREE.Texture | null },
      uPointer: { value: pointer },
      uStrength: { value: 0 },
      uAspect: { value: 1 },
      uDecay: { value: WAVE_DECAY },
      uRadius: { value: WAVE_RADIUS },
    }
    const waveMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: waveFragmentShader,
      uniforms: waveUniforms,
    })
    const wavePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), waveMaterial)
    waveScene.add(wavePlane)

    const texture = new THREE.Texture(img)
    texture.colorSpace = THREE.SRGBColorSpace

    // Subir la imagen a la GPU antes de que termine de decodificar deja
    // la textura en un estado incompleto (WebGL la rechaza y advierte
    // "image is incomplete"), lo que se vería como un canvas
    // transparente. Por eso el intercambio de visibilidad img → canvas
    // ocurre aquí, no en el momento de montar.
    let textureReady = false
    // `resize` se declara más abajo pero necesita correr también al
    // cargar la imagen: hasta ese momento `naturalWidth` es 0 y el
    // factor de recorte no se puede calcular.
    let onSized: (() => void) | null = null

    const markReady = () => {
      texture.needsUpdate = true
      textureReady = true
      onSized?.()
    }
    if (img.complete && img.naturalWidth > 0) {
      markReady()
    } else {
      img.addEventListener('load', markReady, { once: true })
    }

    const displayUniforms = {
      uImage: { value: texture },
      uWave: { value: null as THREE.Texture | null },
      uCover: { value: new THREE.Vector2(1, 1) },
    }
    const displayMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: displayFragmentShader,
      uniforms: displayUniforms,
    })
    const displayPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), displayMaterial)
    displayScene.add(displayPlane)

    const canvas = document.createElement('canvas')
    // Empieza invisible: se revela recién cuando pinta un frame con la
    // textura ya cargada. Si el <img> se ocultara de inmediato en vez de
    // esto, habría una ventana en blanco entre ambos — ni la imagen
    // nativa (ya oculta) ni el canvas (todavía sin textura) mostrarían
    // nada.
    canvas.className = 'absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300'
    canvas.setAttribute('aria-hidden', 'true')
    // El buffer se dimensiona ANTES de crear el renderer. Un <canvas>
    // recién creado mide 300×150 por defecto, y Three toma ese tamaño
    // como referencia del viewport al inicializarse: el resultado es un
    // dibujo a escala reducida y anclado abajo a la izquierda (el origen
    // de coordenadas de WebGL), por mucho que el CSS lo estire después.
    canvas.width = container.clientWidth || 1
    canvas.height = container.clientHeight || 1
    container.appendChild(canvas)

    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      canvas.remove()
      return
    }

    let waveSize = 0

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container
      // El primer resize puede llegar antes de que el contenedor tenga
      // layout (por ejemplo, dentro de un overlay que aún se está
      // animando a pantalla completa): crear render targets de tamaño 0
      // es lo que produce el "Offset overflows texture dimensions" de
      // WebGL. Se reintenta en el siguiente resize real.
      if (!w || !h || !renderer) return

      // Three deriva el viewport del tamaño que se le pasa aquí, así que
      // el estilo del canvas no se toca después: pisarlo desincroniza el
      // buffer del área visible y el dibujo acaba comprimido en una
      // esquina. El canvas ya llena el contenedor por CSS (inset-0).
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h, false)
      waveUniforms.uAspect.value = w / h

      // Factor de recorte: se comprime el eje que sobra para que la
      // imagen llene el contenedor sin deformarse. Solo se puede
      // calcular con la imagen ya cargada; si aún no lo está, `markReady`
      // vuelve a llamar aquí.
      if (img.naturalWidth && img.naturalHeight) {
        const imageAspect = img.naturalWidth / img.naturalHeight
        const boxAspect = w / h
        if (imageAspect > boxAspect) {
          // La imagen es más ancha que la caja: se muestrea un rango
          // horizontal mayor que 0..1, lo que recorta los lados.
          displayUniforms.uCover.value.set(imageAspect / boxAspect, 1)
        } else {
          displayUniforms.uCover.value.set(1, boxAspect / imageAspect)
        }
      }

      // El mapa de ondas no necesita más resolución que el lado corto, y
      // solo se recrea si ese lado cambió: destruirlo en cada resize deja
      // al bucle de render apuntando a una textura ya liberada.
      const size = Math.min(w, h)
      if (size === waveSize) return

      waveSize = size
      waveTargetA?.dispose()
      waveTargetB?.dispose()
      waveTargetA = new THREE.WebGLRenderTarget(size, size)
      waveTargetB = new THREE.WebGLRenderTarget(size, size)
    }

    onSized = resize
    resize()
    observer = new ResizeObserver(resize)
    observer.observe(container)

    // Cuenta cuadros sin cursor activo, para saber cuándo la onda ya se
    // aplanó y el redibujado puede detenerse sin dejar un residuo visible.
    let idleFrames = 0
    const FRAMES_TO_SETTLE = 90

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.set((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height)
      pointerStrength.value = strength
      idleFrames = 0
      if (!active) {
        active = true
        render()
      }
    }
    const onPointerLeave = () => {
      pointerStrength.value = 0
    }

    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)

    let revealed = false

    const render = () => {
      if (disposed || !renderer) return

      // El layout del contenedor (overlay animándose a pantalla completa,
      // tarjeta todavía fuera de vista) o la imagen misma pueden llegar
      // después del primer frame. Mientras falte alguno de los dos, se
      // sigue pidiendo el siguiente frame en vez de quedarse pintando un
      // canvas vacío o abandonar el bucle antes de tiempo.
      if (!waveTargetA || !waveTargetB || !textureReady) {
        frame = requestAnimationFrame(render)
        return
      }

      waveUniforms.uStrength.value = pointerStrength.value
      waveUniforms.uPrev.value = waveTargetA.texture

      renderer.setRenderTarget(waveTargetB)
      renderer.render(waveScene, camera)
      ;[waveTargetA, waveTargetB] = [waveTargetB, waveTargetA]

      displayUniforms.uWave.value = waveTargetA.texture
      renderer.setRenderTarget(null)
      // El viewport se fija a mano en cada frame: al volver de un render
      // target, Three lo restaura a partir de su tamaño interno, que no
      // coincide con el área real del canvas y deja el dibujo en un
      // cuadrante. Se pasa en píxeles CSS porque `setViewport` ya aplica
      // el pixel ratio por dentro.
      renderer.setViewport(0, 0, container.clientWidth, container.clientHeight)
      renderer.render(displayScene, camera)

      if (!revealed) {
        revealed = true
        canvas.classList.remove('opacity-0')
        img.classList.add('opacity-0')
      }

      // Una vez que el cursor se fue, se cuentan cuadros hasta que la
      // onda decae por debajo del umbral visible (0.965^90 ≈ 0.02) y
      // recién ahí se deja de redibujar: el efecto es reactivo, no una
      // animación continua que consuma batería de fondo.
      if (pointerStrength.value === 0) {
        idleFrames += 1
        if (idleFrames > FRAMES_TO_SETTLE) {
          active = false
          return
        }
      }
      frame = requestAnimationFrame(render)
    }

    active = true
    render()

    onBeforeUnmount(() => {
      disposed = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)

      waveTargetA?.dispose()
      waveTargetB?.dispose()
      waveMaterial.dispose()
      displayMaterial.dispose()
      texture.dispose()
      renderer?.dispose()
      canvas.remove()
      img.classList.remove('opacity-0')
    })
  })
}
