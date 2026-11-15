/**
 * ─────────────────────────────────────────────────────────────
 *  CONTENIDO DEL SITIO
 * ─────────────────────────────────────────────────────────────
 *  Todo el texto del portafolio vive aquí. Las capturas y logos
 *  se importan desde /src/assets/img (ver bloque de imágenes más
 *  abajo); en /public/img sólo quedan los marcadores SVG para los
 *  proyectos internos que no se pueden mostrar.
 *
 *  El posicionamiento es «sistemas críticos»: banca, seguros y
 *  sector público. No es una etiqueta de estilo — decide qué se
 *  cuenta de cada proyecto. Lo que vende aquí no es la técnica
 *  usada sino el riesgo administrado: quién depende del sistema,
 *  qué pasa si falla, qué había antes. La tecnología es el cómo,
 *  y va después.
 *
 *  El segundo hilo, que aparece a partir de 2023, es el de
 *  liderazgo técnico: repartir carga entre desarrolladores,
 *  enseñar el stack a quien llega, fijar el estándar. Se cuenta
 *  con verbos concretos —distribuir, formar, estandarizar— y no
 *  con la palabra «líder», que no dice qué se hizo.
 */

/* ── Imágenes ─────────────────────────────────────────────
 * Se importan en vez de escribirse como ruta de texto: así Vite
 * las versiona, las comprime y —sobre todo— falla en compilación
 * si una se borra o se renombra. Una ruta suelta en /public sólo
 * se descubre rota cuando alguien abre la página.
 *
 * Además `FluidImage` las sube a una textura WebGL, y eso exige
 * mismo origen; servidas por el bundle siempre lo cumplen.
 */
import bibliotecaBancoCentral from '@/assets/img/bibloteca_banco_central.webp'
import consorcioRentas from '@/assets/img/consorcio_rentas.webp'
import consorcioPolizas from '@/assets/img/consorcio_polizas.webp'
import consorcioSiniestros from '@/assets/img/consorcio_movimiento_siniestros.webp'

import logoBancoCentral from '@/assets/img/layout_set_logo.png'
import logoConsorcio from '@/assets/img/logo_consorcio_2024.webp'
import logoSii from '@/assets/img/logosii.png'
import logoSonda from '@/assets/img/sonda_logo.jpg'
import logoVass from '@/assets/img/vass_latam_logo.jpg'
import bancoCentralCover from '@/assets/complement/edificio_banco_central.webp'
import rentasCover from '@/assets/complement/consorcio_rentas_vitalicias.webp'
import segurosCover from '@/assets/complement/consorcio_seguros.webp'
import titularesCover from '@/assets/complement/consorcio_movimiento_titular.webp'
import impuestosCover from '@/assets/complement/impuestos_indirectos_sii.webp'
import pascCover from '@/assets/complement/sii_pasc.webp'
import cert_python from '@/assets/certs/python.webp'
import cert_fastapi from '@/assets/certs/fastapi.webp'
import cert_serverless from '@/assets/certs/serverless.webp'
import cert_sql from '@/assets/certs/sql.webp'
import cert_gtm from '@/assets/certs/gtm.webp'
import cert_js from '@/assets/certs/js.webp'
import cert_vue from '@/assets/certs/vue.webp'
import cert_patrones from '@/assets/certs/patrones.webp'
import cert_postman from '@/assets/certs/postman.webp'
import cert_vuex from '@/assets/certs/vuex.webp'


export interface Project {
  id: string
  title: string
  /** Una línea. Aparece bajo el título en la tarjeta. */
  tagline: string
  description: string
  /**
   * Organización para la que se construyó. En este perfil es media
   * credencial: «Banco Central de Chile» dice del proyecto más que
   * cualquier lista de tecnologías.
   */
  client: string
  /** Dominio, para agrupar de un vistazo: Banca, Seguros, Sector público. */
  sector: string
  /** Etiquetas cortas de tecnología. Máx. recomendado: 5. */
  stack: string[]
  /** Imagen de portada, importada desde `@/assets/img`. */
  image: string
  imageKind?: 'illustration' | 'capture' | 'brand'
  capture?: string
  year: string
  /** Enlaces opcionales: si están vacíos, el botón no se renderiza. */
  live?: string
  repo?: string
  /** Destaca la tarjeta a doble ancho en la grilla. */
  featured?: boolean
}

export interface SkillGroup {
  label: string
  items: string[]
}

/**
 * Un cliente dentro de una etapa, con los proyectos que se hicieron
 * para él. En consultoría la empresa que contrata y aquella para la
 * que se trabaja no son la misma, y el trabajo real se reconoce por la
 * segunda: perder ese nivel deja la trayectoria en una lista de
 * consultoras, que no dice nada.
 */
export interface ExperienceClient {
  name: string
  /** En orden cronológico, como se recorrieron. */
  projects: string[]
  /** Logotipo del cliente, importado desde `@/assets/img`. */
  logo?: string
  /**
   * El `id` del mismo cliente en `clientWork`. Es lo que hace que su
   * logotipo se vea igual aquí que en la grilla de proyectos: la placa
   * de marca —el azul del SII, el blanco de Consorcio— se resuelve por
   * `id` en CSS, así que ambas secciones leen del mismo sitio en vez de
   * repetir el color.
   */
  id?: string
}

export interface ExperienceItem {
  period: string
  role: string
  company: string
  description: string
  /**
   * Logotipo de la empresa. Opcional: la sección debe seguir cuadrando
   * sin él.
   */
  logo?: string
  /** Opcional: una etapa puede no ser de consultoría. */
  clients?: ExperienceClient[]
  /** Color de fondo exacto del logo, para que el panel lo continúe sin borde. */
  logoPlate?: string
}

/* ── Identidad ────────────────────────────────────────────── */

export const profile = {
  name: 'Sebastián González',
  // El titular nombra el dominio, no la herramienta. «Frontend
  // Developer» a secas lo dice cualquiera; el sector es lo escaso.
  role: 'Desarrollador de software',
  introduction: 'Diseño y desarrollo interfaces para sistemas de banca, seguros y sector público. Conecto experiencia de usuario, arquitectura y desarrollo para llevar procesos complejos a la web.',
  location: 'Santiago, Chile',
  // Frase corta que aparece en el portal de entrada.
  greeting: 'Bienvenido',
  // De dónde viene y bajo qué exigencia trabaja. Sin adjetivos de
  // marketing: los nombres de los clientes hacen ese trabajo solos.
  bio: [
    'Construyo la capa que la gente toca en sistemas donde equivocarse cuesta caro: pólizas de rentas vitalicias, seguros colectivos, formularios de declaración de impuestos. Software que administra el dinero y los datos de otras personas, y que se juzga por cómo se comporta el peor día del año, no en una captura de pantalla.',
    'Empecé en 2022 migrando las publicaciones de la Biblioteca del Banco Central de Chile, seguí en Consorcio llevando rentas vitalicias y seguros colectivos del papel a lo digital, y desde 2025 trabajo en el Servicio de Impuestos Internos. Ahí el usuario es el país entero: un formulario que tarda en cargar o que un lector de pantalla no puede recorrer deja gente fuera de un trámite obligatorio, así que accesibilidad y peso de la página son requisitos, no mejoras.',
    'Con el tiempo el trabajo dejó de ser sólo escribir código. Reparto la carga del frontend en el equipo, enseño Vue y patrones de arquitectura a quien llega sin saberlos, y defino el estándar de diseño y calidad con el que se construye — porque un sistema que va a durar diez años lo sostiene el equipo, no una persona.',
  ],
  // TODO: ruta a tu foto. Recomendado: 800×1000px, retrato.
  portrait: `${import.meta.env.BASE_URL}img/portrait.svg`,
  email: 'xxx',
  // TODO: ruta a tu CV en /public, o déjalo vacío para ocultar el botón.
  resume: '',
  // Estado que se muestra como píldora en el hero.
  available: false,
  availableLabel: 'Disponible para proyectos',
}

/* ── Redes ────────────────────────────────────────────────── */
// TODO (Sebastián): pon tus URL reales de GitHub y LinkedIn. Están
// comentadas a propósito: un enlace roto en un portafolio es peor que
// no tener el enlace, y `tu-usuario` era exactamente eso. Descoméntalas
// cuando les pongas tu usuario, o bórralas si no las usas.

export const socials = [
  // { label: 'GitHub', url: 'https://github.com/TU-USUARIO', handle: '@TU-USUARIO' },
  // { label: 'LinkedIn', url: 'https://linkedin.com/in/TU-USUARIO', handle: '/in/TU-USUARIO' },
  { label: 'Email', url: `mailto:${profile.email}`, handle: profile.email },
]

/* ── Stack ────────────────────────────────────────────────── */
// Lo que efectivamente aparece en los proyectos de abajo. Vue va
// primero porque es donde está la profundidad real; el backend se
// declara como lo que es —integración y servicios— sin inflarlo.

export const skills: SkillGroup[] = [
  {
    label: 'Frontend',
    items: [
      'HTML · CSS',
      'JavaScript / TypeScript',
      'Vue 3 · Options y Composition API',
      'Pinia · Vuex',
      'React · nivel base',
      'Tailwind · Bootstrap 5 · CSS nativo',
    ],
  },
  {
    label: 'Herramientas',
    items: [
      'Vite · esbuild',
      'npm · pnpm',
      'ESLint · Prettier',
      'Git · GitHub · GitLab',
      'Axios · consumo de API REST',
      'Postman · pruebas de API',
      'Google Analytics 4 · Google Tag Manager',
      'IA asistida · Claude Code · Copilot · Cursor',
    ],
  },
  {
    label: 'Testing',
    items: ['Vitest · Jest', 'Playwright · Cypress', 'Verificación de accesibilidad'],
  },
  {
    label: 'Rendimiento y seguridad web',
    items: [
      'Lighthouse · Core Web Vitals',
      'Cache-Control · Service Workers',
      'CORS · HTTPS · CSP',
    ],
  },
  {
    label: 'Backend',
    items: [
      'Java / Spring Boot',
      'Python · Django · FastAPI',
      'JavaScript · Node.js / NestJS',
      'API REST · SOAP · JSON APIs',
      'Autenticación con JWT',
      'Caché',
      'Microservicios · Serverless',
    ],
  },
  {
    label: 'Datos',
    items: [
      'Bases de datos relacionales',
      'PostgreSQL · MySQL · MariaDB',
      'OracleDB · SQL Server · SQLite',
      'JDBC · SQLAlchemy',
      'MongoDB',
    ],
  },
  {
    label: 'Arquitectura y calidad',
    items: [
      'Clean Architecture',
      'Design systems',
      'Accesibilidad',
      'Responsive',
      'Optimización de carga',
    ],
  },
  {
    label: 'Plataforma y despliegue',
    items: ['Modyo', 'Liferay', 'GitHub Pages · Vercel · Netlify'],
  },
]

/* ── Proyectos ────────────────────────────────────────────── */
/**
 * Los proyectos reales, en orden cronológico inverso.
 *
 * Cada ficha responde a tres preguntas en este orden: para quién,
 * qué problema había, qué cambió. La lista de tecnologías va al
 * final porque es lo menos distintivo — media industria usa lo
 * mismo; lo que no se repite es haber llevado la contratación de
 * rentas vitalicias de la oficina a la web.
 *
 * TODO (Sebastián): las descripciones salen de lo que contaste, pero
 * les faltan las cifras que las vuelven creíbles — cuántas páginas
 * migraste, cuántos formularios cubre la librería, cuánto bajó el
 * tiempo de carga, cuánta gente usa el sistema. Añade lo que puedas
 * decir sin romper confidencialidad: un número concreto vale más que
 * tres adjetivos.
 */

export const projects: Project[] = [
  {
    id: 'sii-design-system-iva',
    title: 'Fortalecimiento de Impuestos Indirectos y Directos',
    tagline: 'Estándares, un core de diseño y equipos que escalan',
    client: 'Servicio de Impuestos Internos',
    sector: 'Sector público',
    description:
      'Un rol que va más allá de los formularios tributarios (F29, F50, 3500, 3600, 3561, 3298, 3299, herencias, entre otros). Estandaricé los procesos de desarrollo frontend del área y creé un core de diseño: una librería de componentes en Vue con CSS nativo que comparten todos los proyectos. Definí cómo se resuelven las integraciones con los servicios, sostuve el estándar de accesibilidad y diseñé pensando en escalabilidad, para que cada sistema nuevo parta de una base común. También enseñé a los equipos Clean Architecture, patrones de diseño y buenas prácticas en Vue.',
    stack: ['Vue 3', 'CSS nativo', 'Design system', 'Integraciones', 'Accesibilidad', 'Escalabilidad'],
    image: impuestosCover,
    imageKind: 'illustration',
    year: '2025 — Presente',
    live: '',
    repo: '',
    featured: true,
  },
  {
    id: 'sii-pasc',
    title: 'PASC — Sanciones y condonaciones tributarias',
    tagline: 'De GWT sobre JBoss a un stack moderno, sin apagar el sistema',
    client: 'Servicio de Impuestos Internos',
    sector: 'Sector público',
    description:
      'Migración del sistema de Procedimiento de Aplicación de Sanciones y Concesión de Condonaciones, que corría sobre GWT, Java y JBoss. La primera etapa fue planificar el traslado a un stack escalable y llevar el frontend: patrones de arquitectura, uso de la memoria del navegador y reglas de negocio tributarias implementadas donde correspondía. En la segunda etapa entré también al backend, con Java y Spring Boot sobre JDBC y servicios API REST.',
    stack: ['Vue 3', 'Java', 'Spring Boot', 'API REST', 'JDBC'],
    image: pascCover,
    imageKind: 'illustration',
    year: '2025',
    live: '',
    repo: '',
    featured: true,
  },
  {
    id: 'consorcio-siniestros',
    title: 'Seguimiento de siniestros',
    tagline: 'Consultar el estado de una denuncia sin llamar por teléfono',
    client: 'Consorcio',
    sector: 'Seguros y banca',
    description:
      'Un siniestro se denuncia en el peor momento posible, y hasta entonces saber en qué iba el trámite exigía llamar y preguntar. El flujo de seguimiento —vida y auto— deja esa consulta disponible a cualquier hora y en dos clics. Es la clase de pantalla que se juzga por lo que no hace: no perder el estado al recargar, no dejar al usuario sin saber qué pasó cuando el servicio no responde.',
    stack: ['Vue 3', 'Vuex', 'Bootstrap 5', 'Modyo', 'API REST'],
    image: segurosCover,
    imageKind: 'illustration',
    capture: consorcioSiniestros,
    year: '2024 — 2025',
    live: '',
    repo: '',
  },
  {
    id: 'consorcio-seguros-colectivos',
    title: 'Pólizas colectivas e individuales',
    tagline: 'Desgravamen, hipotecarios y movimiento de titulares',
    client: 'Consorcio',
    sector: 'Seguros y banca',
    description:
      'Después de Rentas Vitalicias me pidieron seguir en Consorcio con el resto del mundo de seguros: pólizas colectivas e individuales, seguro de desgravamen e hipotecarios. El trabajo fue de evolución continua —actualizar repositorios, analizar y optimizar flujos existentes, construir nuevos, aplicar diseños como el movimiento de titulares— y de ejecución: pasos a producción sobre sistemas en uso, donde el margen de error es el que tolera un cliente que necesita su póliza hoy.',
    stack: ['Vue 3', 'Vuex', 'Bootstrap 5', 'Modyo', 'API REST'],
    image: titularesCover,
    imageKind: 'illustration',
    capture: consorcioPolizas,
    year: '2024 — 2025',
    live: '',
    repo: '',
  },
  {
    id: 'consorcio-rentas-vitalicias',
    title: 'Rentas Vitalicias',
    tagline: 'El salto digital de un proceso que vivía en la oficina',
    client: 'Consorcio',
    sector: 'Seguros y banca',
    description:
      'La contratación de rentas vitalicias —la pensión que alguien cobra hasta el final de su vida— se hacía presencialmente, llenando informes en oficina. El proyecto fue llevarla a la web. Entré como desarrollador full-stack con foco en frontend, en un equipo de tres en front y dos en back, y por iniciativa propia terminé coordinando la parte frontend: distribuir la carga entre mis compañeros y ponerlos al día en el stack. Trabajé la maqueta junto a la persona de UI y al product owner, revisando cada pantalla contra la lógica de negocio antes de darla por viable. Vue 3 con Option API y Vuex, Bootstrap 5, servicios REST en Python, todo montado como SPA dentro de Modyo.',
    stack: ['Vue 3', 'Vuex', 'Bootstrap 5', 'Modyo', 'Python'],
    image: rentasCover,
    imageKind: 'illustration',
    capture: consorcioRentas,
    year: '2023 — 2024',
    live: '',
    repo: '',
    featured: true,
  },
  {
    id: 'bcch-biblioteca',
    title: 'Biblioteca del Banco Central',
    tagline: 'Migración de las publicaciones a una nueva versión de Liferay',
    client: 'Banco Central de Chile',
    sector: 'Sector público',
    description:
      'Mi primer proyecto, como practicante: la modernización de la Biblioteca del Banco Central de Chile hacia una nueva versión de Liferay. Migré en HTML, CSS y JavaScript las páginas de todas las secciones de publicaciones —política monetaria, investigación, estadísticas, eventos, prensa, comunicados, RPM y RPF, notas de prensa—, cada una con su propio diseño. Fue donde aprendí que adaptarse al diseño que llega, y no al que a uno le gustaría, es parte del oficio.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Liferay'],
    image: bancoCentralCover,
    imageKind: 'illustration',
    capture: bibliotecaBancoCentral,
    year: '2022 — 2023',
    live: '',
    repo: '',
  },
]

/* ── Experiencia ──────────────────────────────────────────── */
// Deja el array vacío para ocultar la sección.

export const experience: ExperienceItem[] = [
  {
    period: '2022 — 2025',
    role: 'Desarrollador de software',
    company: 'VASS',
    logo: logoVass,
    logoPlate: '#141414',
    description: 'En VASS inicié mi trayectoria profesional como Trainee, participando en el proyecto de modernización de la Biblioteca del Banco Central de Chile. Posteriormente, me incorporé a Consorcio, donde me desempeñé como desarrollador Full Stack, participando en diversos proyectos internos relacionados con Rentas Vitalicias, gestión de pólizas, movimientos de titulares y seguimiento de siniestros, contribuyendo al desarrollo y mantenimiento de soluciones tanto en frontend como en backend.',
    clients: [
      { id: 'banco-central', name: 'Banco Central de Chile', logo: logoBancoCentral, projects: ['Biblioteca — Migración a Liferay'] },
      { id: 'consorcio', name: 'Consorcio', logo: logoConsorcio, projects: ['Rentas Vitalicias', 'Pólizas y movimientos de titulares', 'Seguimiento de siniestros'] },
    ],
  },
  {
    period: '2025 — Presente',
    role: 'Desarrollador de Software Especializado',
    company: 'SONDA',
    logo: logoSonda,
    logoPlate: '#000000',
    description: 'Me incorporé a SONDA para participar en proyectos de modernización tecnológica del Servicio de Impuestos Internos (SII). Inicialmente, trabajé en la modernización del sistema PASC (Procedimiento de Aplicación de Sanciones y Concesión de Condonaciones). Posteriormente, me integré al Departamento de Sistemas de Impuestos Directos e Indirectos, donde he contribuido al desarrollo de componentes reutilizables, la implementación y modernización de formularios tributarios, la definición de estándares de desarrollo frontend y el apoyo técnico al equipo, promoviendo buenas prácticas y soluciones escalables y mantenibles.',
    clients: [{ id: 'sii', name: 'Servicio de Impuestos Internos', logo: logoSii, projects: ['PASC — Sanciones y condonaciones', 'Fortalecimiento de Impuestos Indirectos y Directos — Design system y formularios'] }],
  },
]

export interface ClientWork {
  id: string
  name: string
  logo: string
  company: string
  companyLogo?: string
  period: string
  sector: string
  summary: string
  /** Cargo en el cliente; encabeza su anexo bajo el nombre. */
  role: string
  /**
   * Fondo de la placa del logo en el tríptico de clientes. Tiene que ser
   * el del propio logo: el SII y Consorcio van sobre blanco, el Banco
   * Central sobre su azul marino porque sus letras son blancas.
   * Opcional: un cliente sin placa se lista en una línea bajo el
   * tríptico, sin imagen.
   */
  logoPlate?: string
  projects: Project[]
}

const selectProjects = (...ids: string[]) => ids.map(id => {
  const project = projects.find(item => item.id === id)
  if (!project) throw new Error('Proyecto desconocido: ' + id)
  return project
})

/**
 * Orden de la grilla de clientes: SII, Consorcio, Banco Central.
 *
 * No es cronológico —el recorrido en el tiempo ya lo cuenta la sección de
 * trayectoria— sino por peso del trabajo: el cliente actual primero y el
 * más largo después.
 */
export const clientWork: ClientWork[] = [
  {
    id: 'sii', name: 'Servicio de Impuestos Internos', logo: logoSii,
    company: 'SONDA', companyLogo: logoSonda, period: '2025 — Presente', sector: 'Sector público',
    role: 'Desarrollador Full Stack',
    summary: 'Primero PASC; después, Fortalecimiento de Impuestos Indirectos y Directos.',
    logoPlate: '#ffffff',
    projects: selectProjects('sii-pasc', 'sii-design-system-iva'),
  },
  {
    id: 'consorcio', name: 'Consorcio', logo: logoConsorcio,
    company: 'VASS', companyLogo: logoVass, period: '2023 — 2025', sector: 'Seguros y banca',
    role: 'Desarrollador Full Stack',
    summary: 'De Rentas Vitalicias a pólizas, movimientos de titulares y seguimiento de siniestros.',
    logoPlate: '#ffffff',
    projects: selectProjects('consorcio-rentas-vitalicias', 'consorcio-seguros-colectivos', 'consorcio-siniestros'),
  },
  {
    id: 'banco-central', name: 'Banco Central de Chile', logo: logoBancoCentral,
    company: 'VASS', companyLogo: logoVass, period: '2022 — 2023', sector: 'Sector público',
    role: 'Desarrollador Full Stack',
    summary: 'Modernización de la biblioteca y sus publicaciones digitales.',
    logoPlate: '#0d1f3c',
    projects: selectProjects('bcch-biblioteca'),
  },
]


/* ── Certificaciones ──────────────────────────────────────── */

/**
 * Formación certificable, con su comprobante en línea.
 *
 * Los datos —título, relator, fecha y duración— están tomados de los
 * certificados mismos, no del nombre del archivo: `hours` es la duración
 * que declara Udemy, y `code` es el identificador que permite verificar
 * cada uno en ude.my. Si un certificado no se puede comprobar, no es una
 * certificación: es una afirmación.
 */
export interface Certification {
  title: string
  issuer: string
  /** Quien dicta el curso. Vacío para un título académico. */
  instructor?: string
  /** Fecha de emisión, ya formateada para mostrar. */
  date: string
  /** Año en number, para ordenar sin volver a parsear la fecha. */
  year: number
  /** Duración declarada en el certificado. */
  hours?: string
  /** Identificador de verificación de Udemy (UC-…). */
  code?: string
  /** Página pública donde se comprueba. */
  url?: string
  /**
   * Imagen del certificado. Solo los de Udemy: el título de Duoc lleva
   * RUT, nota y QR personales, y no se publica.
   */
  image?: string
  /** Agrupa la grilla: el área que acredita. */
  area: 'Frontend' | 'Backend' | 'Datos' | 'Herramientas' | 'Título'
}

const udemy = (code: string) => ({ issuer: 'Udemy', code, url: `https://ude.my/${code}` })

/** De la más reciente a la más antigua: lo último aprendido primero. */
export const certifications: Certification[] = [
  {
    title: 'Ultimate Python: de cero a programador experto',
    instructor: 'Nicolas Schurmann', date: '5 de marzo de 2025', year: 2025,
    hours: '18 horas', area: 'Backend',
    image: cert_python,
    ...udemy('UC-d3e68059-0784-4c27-8c07-a072f2b9acc9'),
  },
  {
    title: 'Desarrolla de forma rápida APIs con FastAPI en Python',
    instructor: 'Alvaro Chirou y Brian De Vita', date: '7 de marzo de 2025', year: 2025,
    hours: '5 horas', area: 'Backend',
    image: cert_fastapi,
    ...udemy('UC-6fa5d420-c726-4d32-8368-0c14109f7d36'),
  },
  {
    title: 'Serverless en Español con AWS y Serverless Framework',
    instructor: 'Marcia Villalba', date: '8 de enero de 2025', year: 2025,
    hours: '2 horas', area: 'Backend',
    image: cert_serverless,
    ...udemy('UC-a03f4712-aefe-4972-a65e-c6aa36a0dccf'),
  },
  {
    title: 'SQL de cero: Tu guía práctica con PostgreSQL',
    instructor: 'Fernando Herrera', date: '12 de mayo de 2024', year: 2024,
    hours: '16 horas', area: 'Datos',
    image: cert_sql,
    ...udemy('UC-91722013-b996-42e0-a980-50a1d745eaf7'),
  },
  {
    title: 'Google Analytics 4 y ecommerce con Google Tag Manager',
    instructor: 'Carlos M Lebrón', date: '24 de abril de 2024', year: 2024,
    hours: '4.5 horas', area: 'Herramientas',
    image: cert_gtm,
    ...udemy('UC-bd565b97-6bb1-4b59-a2c0-41e1d3b84e97'),
  },
  {
    title: 'JavaScript Moderno: Guía para dominar el lenguaje',
    instructor: 'Fernando Herrera', date: '4 de abril de 2024', year: 2024,
    hours: '22.5 horas', area: 'Frontend',
    image: cert_js,
    ...udemy('UC-751b9c32-4570-41ec-95f0-0c55d86c5c40'),
  },
  {
    title: 'Vue.js: De cero a experto',
    instructor: 'Fernando Herrera', date: '1 de febrero de 2024', year: 2024,
    hours: '43.5 horas', area: 'Frontend',
    image: cert_vue,
    ...udemy('UC-a30ad59d-c34c-4d4e-af82-74b2025a97cf'),
  },
  {
    title: 'Patrones de Diseño en JavaScript y TypeScript',
    instructor: 'Héctor de León', date: '2 de enero de 2024', year: 2024,
    hours: '6.5 horas', area: 'Frontend',
    image: cert_patrones,
    ...udemy('UC-f53c3b6b-e84c-4193-a871-3c978802b996'),
  },
  {
    title: 'Postman: Dominá las pruebas de API e integración',
    instructor: 'The Free Range Tester', date: '23 de octubre de 2023', year: 2023,
    hours: '3.5 horas', area: 'Herramientas',
    image: cert_postman,
    ...udemy('UC-e93e04df-5fbb-4b13-9edb-df738542df1f'),
  },
  {
    title: 'Vuejs 2 y Vuex desde 0 con las mejores prácticas',
    instructor: 'Cursosdesarrolloweb Online', date: '16 de octubre de 2023', year: 2023,
    hours: '9.5 horas', area: 'Frontend',
    image: cert_vuex,
    ...udemy('UC-2be39a76-c0c3-463a-9d36-4a23f60bb202'),
  },
  {
    title: 'Analista Programador Computacional',
    issuer: 'Duoc UC', date: '3 de octubre de 2023', year: 2023,
    area: 'Título',
  },
]
