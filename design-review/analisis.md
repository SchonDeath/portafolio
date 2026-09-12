# Revisión del portafolio

## Diagnóstico

El valor diferencial del perfil está en los proyectos para Banco Central de Chile, Consorcio y SII, además del trabajo independiente en Tukin. La versión anterior daba mucha presencia a las animaciones, pero exigía recorrer un carrusel horizontal para descubrir el trabajo. Las portadas abstractas de tres proyectos y el texto superpuesto a las capturas dificultaban entender el contenido.

La base utiliza Vue 3, TypeScript, GSAP y Three.js, con datos centralizados en `src/data/profile.ts`. La separación entre componentes y escenas permite mejorar la presentación sin modificar la entrada animada.

## Cambios implementados

- Loading, portal, videos y escena de fondo conservados.
- Presentación inicial más breve, con especialidad, llamadas a proyectos/contacto y organizaciones para las que se realizaron proyectos.
- Proyectos antes de la biografía; navegación y numeración ajustadas.
- Grilla vertical adaptable con un primer caso destacado, texto separado de las imágenes y etiquetas de tecnologías.
- Tres portadas SVG nuevas: componentes tributarios, modernización de PASC y servicios web/móvil de Tukin. Son ilustraciones conceptuales identificadas como tales, no capturas ni diseños oficiales de los clientes.
- Capturas originales de Consorcio y Banco Central en marcos de navegador, sin deformación WebGL en las tarjetas.
- Imágenes completas dentro de las fichas, además de la portada existente.
- Corrección del estado de proyectos: la ausencia de un enlace público ya no implica que un proyecto esté completado.
- Descripción para buscadores y texto de contacto alineados con el perfil profesional.

## Validación

- `npm.cmd run build`: tipos y compilación correctos.
- Chromium: escritorio de 1440 × 1000 en oscuro y móvil de 390 × 844 en claro con movimiento reducido.
- Siete imágenes cargadas, siete fichas abiertas y cerradas con Escape en ambos tamaños.
- Sin errores JavaScript ni desbordamiento horizontal en las comprobaciones.
- Capturas revisadas visualmente en esta carpeta.

## Próximas mejoras de contenido

1. Añadir CV y enlaces reales a LinkedIn y GitHub; actualmente están vacíos o comentados.
2. Enriquecer cada proyecto con responsabilidad concreta, decisiones y resultados verificables. No se añadieron métricas inventadas.
3. Sustituir las ilustraciones conceptuales por capturas reales cuando estén disponibles y sea apropiado mostrarlas.
4. Revisar el texto biográfico, especialmente afirmaciones de escala, continuidad y accesibilidad, para que cada una pueda respaldarse con experiencia concreta.

## Observaciones técnicas pendientes

- El bundle de producción tiene aproximadamente 767 kB de JavaScript minificado (224 kB gzip). Vite advierte sobre su tamaño. Se puede estudiar carga diferida de escenas y del detalle de proyectos.
- El preloader descarga el video completo antes de finalizar. El archivo principal pesa aproximadamente 3,1 MB y la descarga no tiene un tiempo máximo explícito. Conviene probarlo con conexiones lentas y establecer una salida por tiempo límite conservando la animación.
- El diálogo de proyectos permite cerrar con Escape, pero requiere una revisión específica de gestión de foco y confinamiento de teclado.
- El README contiene información antigua sobre la entrada por sesión y los recursos. El código actual muestra el portal en cada carga.
- No se encontró un repositorio Git en el directorio del proyecto; sería útil versionarlo para comparar y recuperar cambios.

La revisión realizada no equivale a una auditoría completa de WCAG ni a una medición de rendimiento en dispositivos físicos.

## Actualización: organización por clientes

La sección ahora tiene cuatro tarjetas con los logos de Banco Central, Consorcio, Tukiin y SII. Cada tarjeta abre una ficha del cliente, con su logo, empresa de procedencia y proyectos ilustrados con los archivos proporcionados en `src/assets/complement`. Las capturas de interfaces se mantienen como detalles desplegables.

La trayectoria se corrigió según la aclaración del autor: VASS (Banco Central y Consorcio), independiente (Tukiin) y SONDA (SII: primero PASC, luego impuestos directos e indirectos). La entrada animada conserva sus valores originales.

Validación de esta actualización: compilación correcta; cuatro fichas comprobadas con 1, 3, 1 y 2 proyectos respectivamente; cabecera SII revisada en escritorio y móvil; cierre y devolución del foco al botón de origen verificados.
