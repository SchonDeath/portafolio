import * as THREE from 'three'

/**
 * Escena del portal de entrada: un cielo nocturno recreado por completo en
 * shader, según la fotografía de referencia — luna creciente, azul de
 * crepúsculo tardío, nubes teñidas de salmón por abajo y ramas negras en
 * silueta enmarcando el encuadre.
 *
 * Nada de esto es una textura: el cielo, las nubes y el halo de la luna se
 * calculan por píxel, y las estrellas y las ramas son geometría. Es más
 * trabajo que proyectar la foto, pero a cambio el cielo se mueve — las
 * nubes derivan y se deshacen, las estrellas titilan cada una a su ritmo —
 * y el conjunto pesa unos pocos kilobytes en vez de un megabyte de imagen.
 *
 * Está escrito como una fábrica en vez de un componente para que el ciclo
 * de vida de WebGL (contexto, geometrías, RAF) no dependa del re-render de
 * Vue: el componente solo llama a `mount`, `setTravel` y `dispose`.
 */

const STAR_COUNT = 1400
/** Mitad del ancho del plano de cielo, en unidades de escena. */
const SKY_HALF = 60
/** Profundidad a la que se sitúa el telón de cielo. */
const SKY_Z = -70

/* ── Cielo ────────────────────────────────────────────────── */

const skyVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * El cielo entero en un fragment shader. El orden importa y es el de la
 * fotografía: primero el degradado de fondo, encima las nubes, y la luna
 * al final porque su halo tiene que iluminar la nube que tenga delante.
 */
const skyFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uMoon;
  uniform float uMoonPhase;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyHorizon;
  uniform vec3 uCloudDark;
  uniform vec3 uCloudLit;
  uniform vec3 uMoonColor;
  uniform float uExposure;
  varying vec2 vUv;

  /* Ruido de valor con interpolación suave. Barato y suficiente: las
     nubes no necesitan la calidad de un simplex porque van apiladas en
     varias octavas y desenfocadas por el propio FBM. */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Hermite: suaviza la malla del ruido y evita el aspecto de rejilla.
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  /* Seis octavas: las primeras dan la masa de la nube, las últimas el
     deshilachado de los bordes. Cada una se mueve a distinta velocidad y
     en distinta dirección, que es lo que impide que el conjunto se lea
     como una sola imagen desplazándose. */
  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 6; i++) {
      total += noise(p) * amplitude;
      p = p * 2.02 + vec2(uTime * 0.008, uTime * -0.004);
      amplitude *= 0.5;
    }

    return total;
  }

  void main() {
    vec2 uv = vUv;

    // ── Degradado de fondo ───────────────────────────────────
    // En la referencia el azul no se aclara hacia arriba sino hacia
    // abajo: es luz residual del sol ya puesto, no cielo diurno. La
    // potencia curva el degradado para que el tramo claro se concentre
    // cerca del horizonte en vez de repartirse por todo el encuadre.
    float horizon = pow(1.0 - uv.y, 1.7);
    vec3 color = mix(uSkyTop, uSkyHorizon, horizon);

    // ── Nubes ────────────────────────────────────────────────
    // Estiradas en X: las nubes de la foto son bancos horizontales, y
    // sin esa anisotropía el FBM produce manchas redondas que se leen
    // como humo.
    vec2 cloudUv = vec2(uv.x * 2.6, uv.y * 4.2);
    cloudUv += vec2(uTime * 0.012, uTime * 0.003);

    // Deformación del dominio: en vez de evaluar el ruido en la posición
    // directa, se evalúa en una posición que a su vez desplaza otro
    // ruido. Es la diferencia entre una niebla homogénea y una nube con
    // volutas — apilar octavas a secas da una manta gris uniforme, que
    // es justo lo que se veía plano.
    vec2 q = vec2(fbm(cloudUv), fbm(cloudUv + vec2(5.2, 1.3)));
    vec2 r = vec2(
      fbm(cloudUv + 3.0 * q + vec2(1.7, 9.2) + uTime * 0.02),
      fbm(cloudUv + 3.0 * q + vec2(8.3, 2.8) + uTime * 0.015)
    );
    float clouds = fbm(cloudUv + 3.2 * r);

    // La cobertura crece hacia abajo: arriba el cielo queda despejado
    // para que respiren las estrellas y la luna, como en la foto.
    float coverage = smoothstep(0.8, 0.02, uv.y);

    // El umbral está medido, no elegido a ojo: replicando este mismo FBM
    // fuera del shader, su salida se reparte entre 0.26 y 0.77, con la
    // mediana en 0.52. Un umbral en 0.48 dejaba pasar dos tercios del
    // cielo con densidad intermedia — neblina uniforme, justo lo que se
    // veía plano. Arrancando por encima de la mediana solo cuaja el
    // tercio superior del ruido: hay nube donde la hay y cielo limpio
    // alrededor, que es como se ve en la fotografía.
    float density = smoothstep(0.545, 0.70, clouds) * coverage;

    // El vector de deformación mide cuánto se desplazó el dominio en este
    // punto, así que sirve de mapa de relieve gratuito: donde la
    // deformación es alta están los pliegues de la voluta.
    float relief = clamp(length(r) * 0.7, 0.0, 1.0);

    // ── Color de las nubes ───────────────────────────────────
    // Una nube nocturna es gris azulada, no naranja. El salmón de la
    // referencia está solo donde la nube es *delgada* y la luz del sol
    // ya puesto la atraviesa por detrás — es transiluminación, no un
    // tinte general. Pintar la masa entera de naranja, que es lo que
    // hacía antes este bloque, es lo que más delataba la escena.
    // La caída con la altura es suave: en la referencia el salmón aún se
    // aprecia a media altura, no solo pegado al borde inferior.
    float litFromBelow = pow(1.0 - uv.y, 1.5);

    // Grosor óptico: el centro macizo de la nube bloquea la luz, el
    // borde deshilachado la deja pasar. Se deriva de la densidad del
    // ruido, no de la altura en pantalla.
    float thickness = smoothstep(0.545, 0.73, clouds);

    // El cuerpo de la nube: gris azulado, con los pliegues marcados por
    // el relieve que la deformación del dominio ya calculó.
    vec3 cloudColor = uCloudDark * (0.82 + relief * 0.45);

    // La transiluminación se concentra donde la nube es fina. La cuarta
    // potencia la restringe de verdad al borde: con una caída suave el
    // naranja se derrama por toda la masa.
    float translucent = pow(1.0 - thickness, 2.6) * litFromBelow;
    cloudColor = mix(cloudColor, uCloudLit, clamp(translucent * 1.6, 0.0, 1.0));

    // Las nubes cercanas a la luna reciben su luz fría, también solo
    // donde son delgadas.
    float moonDist = length((uv - uMoon) * vec2(1.6, 1.0));
    float moonLight = smoothstep(0.42, 0.0, moonDist) * (1.0 - thickness * 0.6);
    cloudColor += uMoonColor * moonLight * 0.28;

    color = mix(color, cloudColor, density);

    // ── Luna ─────────────────────────────────────────────────
    // El aspecto se corrige para que el disco sea redondo con
    // independencia de la relación de aspecto del plano.
    vec2 moonVec = (uv - uMoon) * vec2(1.6, 1.0);
    float d = length(moonVec);

    // Halo en tres capas. Una sola caída exponencial da un disco difuso
    // que se lee como una mancha pintada; la realidad es un brillo muy
    // ceñido al limbo, más un velo amplio y débil de aire iluminado.
    float haloCore = exp(-d * 70.0) * 0.30;
    float haloMid = exp(-d * 26.0) * 0.12;
    float haloWide = exp(-d * 8.0) * 0.05;
    color += uMoonColor * (haloCore + haloMid + haloWide);

    // Radio pequeño: en la foto la luna ocupa una fracción mínima del
    // encuadre, y agrandarla es de lo que más rápido convierte un cielo
    // en una ilustración.
    float radius = 0.030;

    // El creciente se obtiene restando un disco desplazado del disco
    // lleno, que es literalmente la sombra de la propia Luna.
    float disc = smoothstep(radius, radius - 0.0025, d);
    vec2 shadowCenter = uMoon + vec2(0.0150, 0.0092);
    float shadowD = length((uv - shadowCenter) * vec2(1.6, 1.0));
    // El terminador va algo más difuso que el limbo exterior: en la Luna
    // real el borde de la sombra cae sobre relieve y no es una línea
    // limpia, mientras que el canto contra el cielo sí es nítido.
    float shadow = smoothstep(radius * 0.98, radius * 0.98 - 0.010, shadowD);
    float crescent = clamp(disc - shadow, 0.0, 1.0);

    // ── Superficie ───────────────────────────────────────────
    // Un creciente de color liso es lo que delataba la luna: parecía un
    // logotipo. Lo que la vuelve un cuerpo es que la superficie tenga
    // manchas — los mares — y que el brillo caiga hacia el borde.
    vec2 lunar = (uv - uMoon) / radius;
    float mare = fbm(lunar * 1.6 + 4.0);
    // Contraste bajo: los mares oscurecen alrededor de un 12%, no más;
    // a simple vista la Luna es bastante uniforme.
    float surface = 1.0 - smoothstep(0.35, 0.72, mare) * 0.14;

    // Oscurecimiento del limbo: el borde del disco recibe la luz muy
    // rasante y se apaga. Es sutil pero es lo que da esfericidad.
    float limb = 1.0 - pow(clamp(d / radius, 0.0, 1.0), 2.5) * 0.30;

    vec3 moonSurface = uMoonColor * surface * limb;

    // Luz cenicienta: la parte en sombra no es negra del todo, la
    // ilumina la luz que la Tierra le devuelve. Va mezclada *sobre el
    // cielo* con una opacidad mínima, no pintada como un color sólido:
    // al pintarla se veía un disco lleno con una mordida negra, como un
    // eclipse, en vez de un creciente.
    float darkSide = clamp(disc - crescent, 0.0, 1.0);
    color += uMoonColor * darkSide * uMoonPhase * 0.035;

    color = mix(color, moonSurface, crescent * uMoonPhase);

    // ── Grano ────────────────────────────────────────────────
    // Un grano muy leve, animado. Cumple una función técnica además de
    // estética: rompe las bandas que el degradado produce en pantallas
    // de 8 bits, sobre todo en los azules oscuros donde más se notan.
    float grain = (hash(uv * 900.0 + fract(uTime) * 100.0) - 0.5) * 0.022;
    color += grain;

    gl_FragColor = vec4(color * uExposure, 1.0);
  }
`

/* ── Estrellas ────────────────────────────────────────────── */

const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTwinkle;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    // Cada estrella titila a su propio ritmo y fase. El titileo no baja
    // de 0.45 para que ninguna llegue a desaparecer del todo: parpadear
    // a negro se lee como un fallo de render, no como atmósfera.
    float twinkle = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * aTwinkle + aPhase));
    vAlpha = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // El tamaño decae con la distancia, como cualquier punto en
    // perspectiva; sin esto las estrellas del fondo se ven igual de
    // grandes que las cercanas y la profundidad se pierde.
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z) * twinkle;
  }
`

const starFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    // Punto redondo con caída suave: un cuadrado duro delataría de
    // inmediato que son sprites.
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    // La cuarta potencia concentra el brillo en el centro y deja un
    // halo tenue alrededor, que es como se ve una estrella a simple
    // vista.
    float alpha = pow(core, 4.0) * vAlpha * uOpacity;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`

/* ── Escena ───────────────────────────────────────────────── */

/** Paleta de la escena, para que el portal siga al tema del sitio. */
export interface PortalPalette {
  background: number
  /** Azul profundo de la parte alta del cielo. */
  skyTop: number
  /** Tono claro cerca del horizonte, donde queda luz del sol puesto. */
  skyHorizon: number
  /** Nube en sombra. */
  cloudDark: number
  /** Nube iluminada por debajo: el salmón de la referencia. */
  cloudLit: number
  moon: number
  star: number
  starOpacity: number
  /** Silueta de las ramas del primer plano. */
  branch: number
  /** Multiplicador global de exposición del cielo. */
  exposure: number
}

export const portalPalettes: Record<'dark' | 'light', PortalPalette> = {
  dark: {
    background: 0x080d1a,
    // Muestreados de la fotografía de referencia: arriba un azul de
    // medianoche casi sin luz, y hacia el horizonte un azul acero que
    // nunca llega a ser claro. El error anterior era aclararlo
    // demasiado, lo que daba un cielo de tarde en vez de de noche.
    skyTop: 0x101832,
    skyHorizon: 0x4a5878,
    // La nube en sombra es azul grisácea, apenas más clara que el cielo:
    // en la foto las nubes se distinguen por forma, no por color.
    cloudDark: 0x39415c,
    // El salmón solo aparece en los bordes finos, así que puede ser
    // intenso sin teñir la escena entera.
    cloudLit: 0xd99a7a,
    moon: 0xfff6e3,
    star: 0xdce6f5,
    starOpacity: 1,
    branch: 0x04060c,
    exposure: 1,
  },
  // El sitio tiene tema claro, pero un cielo nocturno no puede volverse
  // diurno sin dejar de ser lo que es. En vez de invertirlo se adelanta
  // la hora: el mismo cielo poco antes, con más luz en el horizonte y
  // las estrellas apenas insinuadas.
  light: {
    background: 0x2c3a5a,
    skyTop: 0x41527a,
    skyHorizon: 0x9aa6bd,
    cloudDark: 0x6b7089,
    cloudLit: 0xe8b79c,
    moon: 0xfff9ec,
    star: 0xf0f4ff,
    starOpacity: 0.35,
    branch: 0x141a28,
    exposure: 1.15,
  },
}

export interface PortalScene {
  mount: (canvas: HTMLCanvasElement) => void
  /** Repinta la escena con la paleta del tema indicado. */
  setPalette: (palette: PortalPalette) => void
  /** Progreso 0→1 del cruce del umbral. Lo conduce GSAP. */
  setTravel: (t: number) => void
  /** Influencia del puntero, en coordenadas normalizadas -1→1. */
  setPointer: (x: number, y: number) => void
  /** Apaga el realce cuando el puntero sale de la ventana. */
  setCursorActive: (active: boolean) => void
  dispose: () => void
}

/**
 * Dibuja una rama en un `Shape`, para la silueta del primer plano.
 *
 * La primera versión de esto trazaba cuadriláteros rectos y el resultado
 * se leía como un wireframe de baja poligonización, no como vegetación.
 * Lo que lo arregla es que ningún tramo sea recto: cada segmento se traza
 * como una curva cuadrática con el punto de control desviado, y las
 * bifurcaciones salen a lo largo del tramo en vez de solo en su punta.
 * Una rama real se curva y va soltando ramitas por el camino.
 */
function growBranch(
  shapes: THREE.Shape[],
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  depth: number,
  rand: () => number,
): void {
  if (depth <= 0 || length < 0.22) return

  // La curvatura se acentúa en las ramas finas: los troncos son casi
  // rectos, las ramitas del extremo se arquean mucho más.
  const bend = (rand() - 0.5) * (0.5 + (6 - depth) * 0.16)
  const endAngle = angle + bend
  const ex = x + Math.cos(endAngle) * length
  const ey = y + Math.sin(endAngle) * length

  // Punto de control desplazado lateralmente: es lo que arquea el
  // segmento en lugar de dejarlo como un palo.
  const midAngle = angle + bend * 0.5
  const cx = x + Math.cos(midAngle) * length * 0.5 - Math.sin(midAngle) * length * bend * 0.6
  const cy = y + Math.sin(midAngle) * length * 0.5 + Math.cos(midAngle) * length * bend * 0.6

  const tip = width * 0.62
  const nx = Math.cos(endAngle + Math.PI / 2)
  const ny = Math.sin(endAngle + Math.PI / 2)
  const bnx = Math.cos(angle + Math.PI / 2)
  const bny = Math.sin(angle + Math.PI / 2)

  // El contorno se recorre por un lado y se vuelve por el otro, con las
  // dos curvas paralelas, de modo que el segmento se estrecha hacia la
  // punta como una rama de verdad.
  // Cada segmento es su propia forma cerrada. Acumularlos todos en un
  // único `Shape` parecía más eficiente, pero earcut entiende los
  // subpaths de una misma forma como un solo contorno y los une: el
  // resultado eran largas rectas atravesando el follaje, como cables
  // tendidos entre las ramas.
  const seg = new THREE.Shape()
  seg.moveTo(x + bnx * width, y + bny * width)
  seg.quadraticCurveTo(cx + bnx * width * 0.8, cy + bny * width * 0.8, ex + nx * tip, ey + ny * tip)
  seg.lineTo(ex - nx * tip, ey - ny * tip)
  seg.quadraticCurveTo(cx - bnx * width * 0.8, cy - bny * width * 0.8, x - bnx * width, y - bny * width)
  seg.closePath()
  shapes.push(seg)

  // Hojas: pequeñas elipses en las puntas finas. Son la diferencia entre
  // leerse como un arbusto o como un esqueleto de alambre.
  if (depth <= 2 && rand() > 0.25) {
    const leafCount = 1 + Math.floor(rand() * 2)

    for (let i = 0; i < leafCount; i++) {
      const t = 0.35 + rand() * 0.65
      const lx = x + Math.cos(endAngle) * length * t
      const ly = y + Math.sin(endAngle) * length * t
      const la = endAngle + (rand() - 0.5) * 2.4
      // El tamaño se sesga con un cuadrado: muchas hojas pequeñas y unas
      // pocas grandes. Un reparto uniforme las hacía todas del mismo
      // tamaño aparente y se notaba el patrón repetido.
      const sizeBias = rand() * rand()
      const len = 0.32 + sizeBias * 1.15
      // La esbeltez también varía: unas lanceoladas, otras casi redondas.
      const wid = len * (0.22 + rand() * 0.34)

      const dx = Math.cos(la)
      const dy = Math.sin(la)
      const px = -dy * wid
      const py = dx * wid

      // Hoja lanceolada: dos arcos que se encuentran en punta a ambos
      // extremos, que es la forma de una hoja vista a contraluz.
      const leaf = new THREE.Shape()
      leaf.moveTo(lx, ly)
      leaf.quadraticCurveTo(lx + dx * len * 0.5 + px, ly + dy * len * 0.5 + py, lx + dx * len, ly + dy * len)
      leaf.quadraticCurveTo(lx + dx * len * 0.5 - px, ly + dy * len * 0.5 - py, lx, ly)
      leaf.closePath()
      shapes.push(leaf)
    }
  }

  // Bifurcaciones a lo largo del tramo, no solo en la punta. Es la
  // diferencia entre un árbol binario de manual y una rama real.
  //
  // El número se mantiene bajo a propósito: con tres por nivel la
  // recursión llegaba a ~850 segmentos por rama y la triangulación de
  // `ShapeGeometry` — que es earcut sobre todos los contornos a la vez —
  // colgaba el hilo al montar la escena.
  const forks = depth > 3 ? 2 : 1

  for (let i = 0; i < forks; i++) {
    // Repartidas por el segmento, sesgadas hacia el extremo.
    const t = 0.45 + (i / forks) * 0.55 + rand() * 0.12
    const bx = x + Math.cos(endAngle) * length * t
    const by = y + Math.sin(endAngle) * length * t

    // Alternan de lado, con apertura irregular.
    const side = i % 2 === 0 ? 1 : -1
    const spread = (0.35 + rand() * 0.55) * side
    growBranch(shapes, bx, by, endAngle + spread, length * (0.45 + rand() * 0.28), tip * 0.85, depth - 1, rand)
  }

  // Continuación del eje principal, más corta y algo desviada: el tallo
  // sigue más allá de la última bifurcación.
  growBranch(shapes, ex, ey, endAngle + (rand() - 0.5) * 0.45, length * 0.6, tip, depth - 1, rand)
}

/** Generador reproducible: la misma semilla da siempre el mismo árbol. */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function createPortalScene(palette: PortalPalette): PortalScene {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300)
  camera.position.set(0, 0, 24)

  let renderer: THREE.WebGLRenderer | null = null
  let frame = 0
  let disposed = false
  let travel = 0
  let starOpacity = palette.starOpacity

  const clock = new THREE.Clock()
  const pointer = new THREE.Vector2()
  const smoothedPointer = new THREE.Vector2()

  /* Cielo: un plano que cubre el fondo por completo */

  const skyGeometry = new THREE.PlaneGeometry(SKY_HALF * 2, SKY_HALF * 1.5, 1, 1)
  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    uniforms: {
      uTime: { value: 0 },
      // La luna arriba y a la izquierda: en el tercio superior izquierdo,
      // libre del bloque de texto que ocupa la banda central. Antes
      // estaba en el centro y el título la tapaba por completo.
      uMoon: { value: new THREE.Vector2(0.3, 0.74) },
      uMoonPhase: { value: 1 },
      uSkyTop: { value: new THREE.Color(palette.skyTop) },
      uSkyHorizon: { value: new THREE.Color(palette.skyHorizon) },
      uCloudDark: { value: new THREE.Color(palette.cloudDark) },
      uCloudLit: { value: new THREE.Color(palette.cloudLit) },
      uMoonColor: { value: new THREE.Color(palette.moon) },
      uExposure: { value: palette.exposure },
    },
    depthWrite: false,
  })

  const sky = new THREE.Mesh(skyGeometry, skyMaterial)
  sky.position.z = SKY_Z
  scene.add(sky)

  /* Estrellas */

  const starGeometry = new THREE.BufferGeometry()
  const starPositions = new Float32Array(STAR_COUNT * 3)
  const starSizes = new Float32Array(STAR_COUNT)
  const starPhases = new Float32Array(STAR_COUNT)
  const starTwinkles = new Float32Array(STAR_COUNT)

  for (let i = 0; i < STAR_COUNT; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 150
    // Sesgadas hacia arriba: abajo están las nubes, y una estrella
    // brillando a través de una nube densa se lee como un error.
    starPositions[i * 3 + 1] = (Math.random() - 0.35) * 90
    // Repartidas en profundidad para que el paralaje las separe.
    starPositions[i * 3 + 2] = SKY_Z + 4 + Math.random() * 40

    // Muchas pequeñas y unas pocas grandes: la cuarta potencia sesga el
    // reparto hacia abajo y deja unas pocas destacadas, como el cielo
    // real, donde las estrellas brillantes se cuentan con la mano.
    const r = Math.random()
    // Más finas que antes: a simple vista una estrella es un punto casi
    // sin superficie, y agrandarlas las convierte en copos de nieve.
    starSizes[i] = 0.35 + r * r * r * r * 3.2
    starPhases[i] = Math.random() * Math.PI * 2
    // Ritmos dispares: si todas titilaran igual se vería el pulso común.
    starTwinkles[i] = 0.4 + Math.random() * 1.9
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1))
  starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1))
  starGeometry.setAttribute('aTwinkle', new THREE.BufferAttribute(starTwinkles, 1))

  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color(palette.star) },
      uOpacity: { value: palette.starOpacity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)

  /* Ramas en silueta */

  const branchGeometries: THREE.ShapeGeometry[] = []
  const branchMaterials: THREE.MeshBasicMaterial[] = []
  const branchGroup = new THREE.Group()

  /**
   * Cuatro matorrales entrando desde las esquinas, a dos profundidades.
   * Los más cercanos se mueven más con el puntero: ese diferencial es
   * todo el efecto de profundidad del primer plano.
   */
  //
  // Las coordenadas están atadas al encuadre real de la cámara, no
  // elegidas a ojo: a z=-4 el frustum abarca unos ±23 de ancho y ±15 de
  // alto, y a z=-18 unos ±35 por ±22. Cada arranque se sitúa justo fuera
  // de ese borde — lo justo para que el tronco nazca fuera de plano y
  // solo entren las ramas — y no más allá, porque entonces el matorral
  // entero queda fuera de cuadro y no se ve nada.
  const branchSpecs = [
    // Inferior izquierda: la más cercana y frondosa, como en la
    // referencia, donde el matorral ocupa toda esa esquina.
    { x: -22, y: -17, angle: 0.75, length: 7.5, depth: 6, z: -4, seed: 7 },
    // Inferior derecha: entra en diagonal y sube más alto.
    { x: 21, y: -18, angle: 2.25, length: 8, depth: 6, z: -2, seed: 23 },
    // Superior derecha: rama suelta descolgándose, más al fondo.
    { x: 32, y: 21, angle: 3.6, length: 8, depth: 5, z: -16, seed: 41 },
    // Superior izquierda: apenas asoma, para cerrar el encuadre sin
    // competir con la luna, que está en ese lado.
    { x: -34, y: 23, angle: -0.5, length: 6, depth: 4, z: -18, seed: 89 },
  ]

  for (const spec of branchSpecs) {
    const shapes: THREE.Shape[] = []
    const rand = seededRandom(spec.seed)
    growBranch(shapes, spec.x, spec.y, spec.angle, spec.length, 0.42, spec.depth, rand)

    // `ShapeGeometry` acepta un array y triangula cada forma por
    // separado, que es justo lo que hace falta aquí.
    const geometry = new THREE.ShapeGeometry(shapes)
    branchGeometries.push(geometry)

    // ── Desenfoque de primer plano ──────────────────────────────────
    // La fotografía de referencia está tomada con teleobjetivo enfocado
    // a la luna, así que las ramas cercanas salen desenfocadas. Que aquí
    // estuviera todo igual de nítido — ramas a cuatro unidades y
    // estrellas en el infinito — era de lo que más delataba la escena:
    // ninguna cámara real da esa profundidad de campo.
    //
    // Un desenfoque exacto exigiría post-proceso. Esto lo aproxima
    // apilando copias con desplazamientos repartidos en disco y opacidad
    // muy baja. La clave es el número: con tres o cuatro copias se ven
    // siluetas fantasma sueltas, y a partir de una docena el ojo las
    // integra como un borde continuo. Son mallas que comparten la misma
    // geometría, así que el coste es de dibujado, no de memoria.
    // El desenfoque es sutil a propósito. Con un radio grande y muchas
    // copias las ramas se disolvían en manchas de humo y perdían la
    // forma: en la referencia siguen siendo reconocibles como hojas,
    // solo que con el canto blando.
    const blurStrength = Math.max(0, (spec.z + 22) / 22)
    const copies = spec.z > -8 ? 8 : 5
    const spread = blurStrength * 0.16

    for (let i = 0; i < copies; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: palette.branch,
        transparent: true,
        // Repartida entre todas las copias. La suma se acerca a opaco en
        // el centro, donde todas se solapan, y se desvanece en el borde,
        // donde solo llegan las más desplazadas: justo el perfil de un
        // desenfoque.
        opacity: 0.99 / copies,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)

      if (i > 0) {
        // Espiral áurea: reparte los puntos por el disco de forma
        // uniforme, sin los anillos concéntricos que deja un reparto
        // angular regular ni los grumos de uno aleatorio.
        const golden = 2.399963
        const a = i * golden
        // La raíz hace que la densidad sea pareja por área en vez de
        // acumularse en el centro.
        const r = Math.sqrt(i / copies) * spread
        mesh.position.x = Math.cos(a) * r
        mesh.position.y = Math.sin(a) * r
      }

      mesh.position.z = spec.z
      // El bucle de render necesita saber a qué profundidad está cada
      // copia y de qué opacidad partió: hay varias mallas por rama, así
      // que ya no vale indexar por la posición en el grupo.
      mesh.userData.depth = spec.z
      mesh.userData.baseOpacity = material.opacity
      mesh.userData.offset = new THREE.Vector2(mesh.position.x, mesh.position.y)

      branchMaterials.push(material)
      branchGroup.add(mesh)
    }
  }

  scene.add(branchGroup)

  /* Bucle de render */

  const render = () => {
    if (disposed) return
    frame = requestAnimationFrame(render)

    const elapsed = clock.getElapsedTime()
    skyMaterial.uniforms.uTime.value = elapsed
    starMaterial.uniforms.uTime.value = elapsed

    // El puntero se persigue con interpolación para que el paralaje
    // llegue con inercia en lugar de saltar con cada mousemove.
    smoothedPointer.lerp(pointer, 0.045)

    // La cámara se desplaza muy poco: es un cielo, no un objeto que se
    // orbita, y un recorrido amplio delataría que las estrellas están
    // en un volumen finito.
    camera.position.x = smoothedPointer.x * 1.8
    camera.position.y = smoothedPointer.y * 1.2
    // Al entrar, la cámara avanza hacia el cielo y lo atraviesa.
    camera.position.z = 24 - travel * 46
    camera.lookAt(0, 0, SKY_Z)

    // Las ramas se mueven más que la cámara y en sentido contrario, cada
    // una según su profundidad: eso es el paralaje, y es lo que las
    // despega del fondo.
    // Al cruzar, las ramas se apagan: quedan fuera de encuadre antes de
    // que la cámara llegue al cielo.
    const branchFade = 1 - travel

    branchGroup.children.forEach((branch) => {
      const depth = branch.userData.depth as number
      const offset = branch.userData.offset as THREE.Vector2
      // Las cercanas (z alto) reaccionan más.
      const factor = (depth + 20) * 0.055

      // El paralaje se *suma* al desplazamiento del bokeh en vez de
      // sustituirlo: si se asignara directamente, las copias
      // desenfocadas se apilarían sobre el original y el borde difuso
      // desaparecería en cuanto se moviera el ratón.
      branch.position.x = offset.x - smoothedPointer.x * factor
      branch.position.y = offset.y - smoothedPointer.y * factor * 0.7

      // Balanceo lento, como ramas con algo de brisa. La fase depende de
      // la profundidad y no del índice, para que las copias de una misma
      // rama oscilen juntas en lugar de separarse unas de otras.
      branch.rotation.z = Math.sin(elapsed * 0.22 + depth * 0.9) * 0.012

      // Cada copia conserva su propia opacidad base — la del núcleo y la
      // de las de desenfoque son distintas — y solo se escala por el
      // desvanecimiento del cruce.
      const material = (branch as THREE.Mesh).material as THREE.MeshBasicMaterial
      material.opacity = (branch.userData.baseOpacity as number) * branchFade
    })

    // Las estrellas se intensifican levemente durante el viaje, como si
    // nos acercáramos a ellas.
    starMaterial.uniforms.uOpacity.value = starOpacity * (1 + travel * 0.4)

    renderer?.render(scene, camera)
  }

  /* Redimensionado */

  let observer: ResizeObserver | null = null

  const resize = (canvas: HTMLCanvasElement) => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h || !renderer) return

    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    const ratio = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(ratio)
    starMaterial.uniforms.uPixelRatio.value = ratio

    // El plano de cielo se reescala para cubrir el encuadre en cualquier
    // proporción. Sin esto, en pantallas muy anchas asoman los bordes.
    const vFov = (camera.fov * Math.PI) / 180
    const distance = camera.position.z - SKY_Z
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance
    const visibleWidth = visibleHeight * camera.aspect
    sky.scale.set((visibleWidth * 1.15) / (SKY_HALF * 2), (visibleHeight * 1.15) / (SKY_HALF * 1.5), 1)
  }

  return {
    mount(canvas) {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
      renderer.setClearColor(palette.background, 1)
      resize(canvas)

      observer = new ResizeObserver(() => resize(canvas))
      observer.observe(canvas)

      render()
    },

    setPalette(next) {
      skyMaterial.uniforms.uSkyTop.value.set(next.skyTop)
      skyMaterial.uniforms.uSkyHorizon.value.set(next.skyHorizon)
      skyMaterial.uniforms.uCloudDark.value.set(next.cloudDark)
      skyMaterial.uniforms.uCloudLit.value.set(next.cloudLit)
      skyMaterial.uniforms.uMoonColor.value.set(next.moon)
      skyMaterial.uniforms.uExposure.value = next.exposure

      starMaterial.uniforms.uColor.value.set(next.star)
      starOpacity = next.starOpacity

      branchMaterials.forEach((m) => m.color.set(next.branch))
      renderer?.setClearColor(next.background, 1)
    },

    setTravel(t) {
      travel = t
    },

    setPointer(x, y) {
      pointer.set(x, y)
    },

    setCursorActive(active) {
      // Sin puntero el cielo vuelve a su encuadre en reposo, en lugar de
      // quedarse congelado en la última posición visitada. El paralaje
      // no necesita más estado que eso: la interpolación del bucle se
      // encarga de que la vuelta al centro sea gradual.
      if (!active) pointer.set(0, 0)
    },

    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer?.disconnect()

      skyGeometry.dispose()
      skyMaterial.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      branchGeometries.forEach((g) => g.dispose())
      branchMaterials.forEach((m) => m.dispose())

      renderer?.dispose()
      renderer = null
    },
  }
}
