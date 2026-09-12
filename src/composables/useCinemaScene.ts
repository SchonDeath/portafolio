import * as THREE from 'three'

/**
 * Escena continua que atraviesa toda la página.
 *
 * La idea central: no hay una animación por sección, hay **una sola
 * cámara** que recorre un espacio 3D y el scroll es su posición en ese
 * recorrido. Las secciones no son bloques que aparecen: son estaciones
 * del viaje, y el HTML va sincronizado encima como sobreimpresión.
 *
 * Eso cambia lo que se siente al bajar. Un portafolio normal apila
 * pantallas y las anima al entrar; aquí el usuario se desplaza por un
 * lugar, y lo que estaba delante queda detrás. Es la diferencia entre
 * pasar páginas y caminar.
 *
 * Está escrito como fábrica y no como componente para que el ciclo de
 * vida de WebGL no dependa del re-render de Vue: el componente llama a
 * `mount`, `setProgress` y `dispose`, nada más.
 */

/* ── Ajustes del recorrido ──────────────────────────────────── */

/** Longitud del viaje en unidades de escena, de principio a fin. */
const TRACK_LENGTH = 260

/**
 * Densidad del campo. Bajarla respecto del original es deliberado: un
 * cielo saturado se lee como espacio exterior, y a esta cantidad los
 * puntos funcionan como profundidad de campo — dan volumen al viaje sin
 * anunciar un tema de ciencia ficción.
 */
const STAR_COUNT = 850
/** Partículas de polvo cercanas: dan sensación de velocidad al avanzar. */
const DUST_COUNT = 260

/* ── Shaders ────────────────────────────────────────────────── */

/**
 * Nebulosa de fondo. Es el telón del viaje: un degradado profundo con
 * ruido que deriva muy despacio, para que el fondo nunca esté del todo
 * quieto pero tampoco compita con el contenido.
 */
const nebulaVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      total += noise(p) * amp;
      p *= 2.03;
      amp *= 0.5;
    }
    return total;
  }

  void main() {
    vec2 uv = vUv;

    // El degradado gira lentamente con el avance: al final del recorrido
    // el fondo no es el mismo que al principio, aunque nadie sabría
    // decir cuándo cambió. Es lo que hace que el viaje se sienta largo.
    float shift = uProgress * 0.35;
    float grad = smoothstep(0.0, 1.0, uv.y + shift * 0.3);

    vec3 color = mix(uDeep, uMid, grad);

    // Bancos de nebulosa. Muy sutiles: su trabajo es romper el plano,
    // no dibujarse. El exponente alto y la mezcla baja los dejan como
    // una veladura — con valores más altos el fondo se lee como una
    // portada de ciencia ficción, que no es lo que este perfil vende.
    vec2 np = uv * vec2(2.2, 1.4);
    np += vec2(uTime * 0.006, shift);
    float clouds = fbm(np + fbm(np * 1.7) * 0.6);
    color += uAccent * pow(clouds, 3.2) * 0.16;

    // Halo hacia el centro: concentra la mirada donde va el contenido.
    float centre = 1.0 - length(uv - 0.5) * 1.35;
    color += uAccent * max(centre, 0.0) * 0.04;

    gl_FragColor = vec4(color, 1.0);
  }
`

/** Estrellas: puntos con titileo propio para que el campo no sea estático. */
const starVertex = /* glsl */ `
  attribute float aScale;
  attribute float aPhase;
  uniform float uTime;
  uniform float uSize;
  varying float vTwinkle;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Cada estrella late a su ritmo; sin la fase todas parpadearían a la
    // vez y se leería como un fallo de render.
    vTwinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aPhase);
    gl_PointSize = uSize * aScale * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const starFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTwinkle;

  void main() {
    // Punto redondo con borde suave: un cuadrado se nota de inmediato.
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uColor, alpha * vTwinkle * uOpacity);
  }
`

/* ── Paleta ─────────────────────────────────────────────────── */

export interface CinemaPalette {
  deep: number
  mid: number
  accent: number
  star: number
  starOpacity: number
  fog: number
}

export const cinemaPalettes: Record<'dark' | 'light', CinemaPalette> = {
  dark: {
    deep: 0x05080d,
    mid: 0x0c1620,
    // Azul petróleo, no cian. El cian anterior tiraba a ciencia
    // ficción; este lee como instrumental técnico, que es el registro
    // del trabajo que acompaña.
    accent: 0x2b7f9e,
    star: 0xc8d4e2,
    starOpacity: 0.72,
    fog: 0x05080d,
  },
  /**
   * El tema claro invierte de verdad la escena: cielo alto de día, no un
   * espacio nocturno atenuado. Es la única versión coherente — los
   * tokens de texto del sitio son oscuros en claro, y sobre un fondo
   * nocturno el titular se volvía ilegible. Aquí las estrellas se apagan
   * casi del todo, como corresponde a la hora.
   */
  light: {
    deep: 0xe4ebf2,
    mid: 0xb9c9d8,
    accent: 0x5c8299,
    star: 0x6b8299,
    starOpacity: 0.12,
    fog: 0xeef2f6,
  },
}

/* ── API ────────────────────────────────────────────────────── */

export interface CinemaScene {
  mount: (canvas: HTMLCanvasElement) => void
  /** Avance 0→1 del recorrido completo. Lo conduce ScrollTrigger. */
  setProgress: (t: number) => void
  /** Influencia del puntero, normalizada -1→1. */
  setPointer: (x: number, y: number) => void
  setPalette: (palette: CinemaPalette) => void
  dispose: () => void
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function createCinemaScene(palette: CinemaPalette): CinemaScene {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400)

  let renderer: THREE.WebGLRenderer | null = null
  let raf = 0
  let disposed = false
  let time = 0

  /** Avance objetivo (lo fija el scroll) y avance suavizado (lo sigue). */
  let progress = 0
  let smoothProgress = 0
  const pointer = new THREE.Vector2()
  const smoothPointer = new THREE.Vector2()

  /* ── Fondo ──────────────────────────────────────────────── */

  // El telón viaja con la cámara: es un fondo infinito, no un objeto que
  // se pueda alcanzar. Por eso se reposiciona cada frame en vez de
  // quedarse fijo en el mundo.
  const nebulaMaterial = new THREE.ShaderMaterial({
    vertexShader: nebulaVertex,
    fragmentShader: nebulaFragment,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uDeep: { value: new THREE.Color(palette.deep) },
      uMid: { value: new THREE.Color(palette.mid) },
      uAccent: { value: new THREE.Color(palette.accent) },
    },
    depthWrite: false,
  })

  const nebulaGeometry = new THREE.PlaneGeometry(360, 220)
  const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial)
  nebula.renderOrder = -10
  scene.add(nebula)

  /* ── Estrellas ──────────────────────────────────────────── */

  const rand = seededRandom(20260904)

  const starGeometry = new THREE.BufferGeometry()
  const starPos = new Float32Array(STAR_COUNT * 3)
  const starScale = new Float32Array(STAR_COUNT)
  const starPhase = new Float32Array(STAR_COUNT)

  for (let i = 0; i < STAR_COUNT; i++) {
    // Distribuidas a lo largo de todo el recorrido y algo más allá, para
    // que nunca se acabe el campo al llegar al final.
    //
    // En X e Y se empujan hacia afuera con una potencia: elevar un
    // aleatorio uniforme concentra los valores en los extremos, así que
    // el centro del encuadre —por donde pasa el texto— queda despejado
    // y los bordes densos. Repartidas por igual, las estrellas caían
    // justo encima del titular y competían con la lectura.
    const ax = rand() - 0.5
    const ay = rand() - 0.5
    starPos[i * 3] = Math.sign(ax) * Math.pow(Math.abs(ax) * 2, 0.45) * 165
    starPos[i * 3 + 1] = Math.sign(ay) * Math.pow(Math.abs(ay) * 2, 0.5) * 100
    // El campo se extiende bastante más allá del final del recorrido: si
    // termina donde termina el viaje, la última sección queda en un vacío
    // negro y el cierre parece un fallo de carga en vez de un destino.
    starPos[i * 3 + 2] = -rand() * (TRACK_LENGTH + 260) + 40
    starScale[i] = 0.4 + rand() * 1.6
    starPhase[i] = rand() * Math.PI * 2
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeometry.setAttribute('aScale', new THREE.BufferAttribute(starScale, 1))
  starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(starPhase, 1))

  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 2.6 },
      uColor: { value: new THREE.Color(palette.star) },
      uOpacity: { value: palette.starOpacity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)

  /* ── Polvo cercano ──────────────────────────────────────── */

  /**
   * Partículas próximas a la cámara. No se ven como objetos: se ven como
   * velocidad. Sin ellas el avance por un campo de estrellas lejano se
   * percibe casi estático, porque nada pasa lo bastante cerca como para
   * dar paralaje.
   */
  const dustGeometry = new THREE.BufferGeometry()
  const dustPos = new Float32Array(DUST_COUNT * 3)
  const dustScale = new Float32Array(DUST_COUNT)
  const dustPhase = new Float32Array(DUST_COUNT)

  for (let i = 0; i < DUST_COUNT; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 90
    dustPos[i * 3 + 1] = (rand() - 0.5) * 60
    dustPos[i * 3 + 2] = -rand() * (TRACK_LENGTH + 120) + 20
    dustScale[i] = 0.3 + rand() * 0.9
    dustPhase[i] = rand() * Math.PI * 2
  }

  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeometry.setAttribute('aScale', new THREE.BufferAttribute(dustScale, 1))
  dustGeometry.setAttribute('aPhase', new THREE.BufferAttribute(dustPhase, 1))

  const dustMaterial = new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 2.0 },
      uColor: { value: new THREE.Color(palette.accent) },
      uOpacity: { value: 0.5 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const dust = new THREE.Points(dustGeometry, dustMaterial)
  scene.add(dust)

  /* ── Niebla ─────────────────────────────────────────────── */

  // La niebla es lo que da profundidad legible: sin ella el campo de
  // estrellas se ve igual de nítido a cualquier distancia y el espacio
  // se aplana.
  scene.fog = new THREE.Fog(palette.fog, 30, 130)

  /* ── Bucle ──────────────────────────────────────────────── */

  const clock = new THREE.Clock()

  const render = () => {
    if (disposed) return
    raf = requestAnimationFrame(render)

    const dt = Math.min(clock.getDelta(), 0.05)
    time += dt

    // Suavizado exponencial del scroll. El valor crudo de ScrollTrigger
    // llega a saltos —sobre todo con rueda de ratón— y la cámara heredaría
    // ese temblor; siguiéndolo con retardo, el movimiento se lee como
    // inercia de cámara real.
    smoothProgress += (progress - smoothProgress) * Math.min(dt * 3.4, 1)
    smoothPointer.x += (pointer.x - smoothPointer.x) * Math.min(dt * 2.6, 1)
    smoothPointer.y += (pointer.y - smoothPointer.y) * Math.min(dt * 2.6, 1)

    const z = -smoothProgress * TRACK_LENGTH

    // La cámara no va recta: describe una curva muy abierta a lo largo
    // del recorrido. Un raíl recto se lee como un zoom; la curva hace
    // que los monolitos entren y salgan de encuadre por los lados.
    camera.position.set(
      Math.sin(smoothProgress * Math.PI * 1.6) * 6 + smoothPointer.x * 2.4,
      Math.cos(smoothProgress * Math.PI * 1.2) * 3 + smoothPointer.y * 1.6,
      z + 26,
    )
    // Mira siempre algo por delante, no al infinito: es lo que hace que
    // el giro de la curva se perciba.
    camera.lookAt(
      Math.sin((smoothProgress + 0.08) * Math.PI * 1.6) * 6,
      Math.cos((smoothProgress + 0.08) * Math.PI * 1.2) * 3,
      z - 20,
    )
    // Alabeo leve en las curvas, como el de un avión al virar.
    camera.rotation.z = Math.sin(smoothProgress * Math.PI * 1.6) * 0.05

    // El telón se mantiene a distancia fija por delante de la cámara.
    nebula.position.set(camera.position.x, camera.position.y, camera.position.z - 150)

    nebulaMaterial.uniforms.uTime.value = time
    nebulaMaterial.uniforms.uProgress.value = smoothProgress
    starMaterial.uniforms.uTime.value = time
    dustMaterial.uniforms.uTime.value = time

    renderer?.render(scene, camera)
  }

  /* ── Redimensionado ─────────────────────────────────────── */

  const resize = () => {
    if (!renderer) return
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    // El techo de 2 evita que una pantalla 3x multiplique el coste de
    // fragmento sin diferencia visible a esta escala.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  return {
    mount(canvas) {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
      renderer.setClearColor(palette.fog, 1)
      resize()
      window.addEventListener('resize', resize)
      clock.start()
      render()
    },

    setProgress(t) {
      progress = Math.min(Math.max(t, 0), 1)
    },

    setPointer(x, y) {
      pointer.set(x, y)
    },

    setPalette(next) {
      nebulaMaterial.uniforms.uDeep.value.set(next.deep)
      nebulaMaterial.uniforms.uMid.value.set(next.mid)
      nebulaMaterial.uniforms.uAccent.value.set(next.accent)
      starMaterial.uniforms.uColor.value.set(next.star)
      starMaterial.uniforms.uOpacity.value = next.starOpacity
      dustMaterial.uniforms.uColor.value.set(next.accent)
      renderer?.setClearColor(next.fog, 1)
      if (scene.fog) (scene.fog as THREE.Fog).color.set(next.fog)
    },

    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)

      nebulaGeometry.dispose()
      nebulaMaterial.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      dustGeometry.dispose()
      dustMaterial.dispose()

      renderer?.dispose()
      renderer = null
    },
  }
}
