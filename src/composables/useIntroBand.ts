/**
 * La entrada del portal.
 *
 * Cuando la carga termina, el vídeo no aparece: la barra de carga se
 * convierte en él. El recuadro nace midiendo exactamente lo que medía la
 * barra llena —el ancho de la pantalla, la altura de la banda— en el mismo
 * sitio, y desde ahí se abre. Los números de ese gesto viven aquí.
 *
 * Que las dos formas coincidan es lo que hace que el relevo entre pantallas
 * no se vea: no hay una que se va y otra que entra, hay una sola que cambia
 * de contenido y se abre.
 */

/**
 * Altura de la banda de partida, en píxeles.
 *
 * Es la altura de la barra del preloader —`h-9` de Tailwind, 36px— y tiene
 * que seguirla: el recuadro nace a esa misma altura y a su mismo nivel, de
 * modo que la barra no desaparece para que entre el vídeo, se convierte en
 * él. Si allí cambia, hay que moverla aquí o el relevo se verá como un salto.
 */
export const BAND_HEIGHT_PX = 36

/**
 * Ancho de partida del recuadro, como fracción del ancho de la pantalla.
 *
 * El recuadro nace centrado y estrecho —no cruzando la pantalla— y se abre
 * hacia los lados. A 0.22 son unos 420px en un monitor de 1920, ancho
 * suficiente para que dentro se lea una imagen y no una rendija.
 */
export const OPENING_WIDTH = 0.22

/**
 * Duraciones de la apertura, en segundos.
 *
 * Los dos ejes crecen a la vez, no uno detrás de otro, pero no al mismo
 * ritmo: el ancho cierra antes que el alto. Ese desfase es lo que hace que
 * el gesto se lea como algo que se despliega —la imagen gana primero campo
 * a los lados y después termina de abrirse en vertical— en vez de como una
 * caja que se agranda en bloque, que es lo que se ve cuando ambos ejes
 * viajan iguales.
 *
 * El gesto se hace recortando —`clip-path`— y no escalando la caja. Escalar
 * pedía devolverle la forma al vídeo con la inversa de la escala, y en la
 * banda inicial esa inversa es un factor de 37: el plano tendría que
 * pintarse a 40.000 píxeles de alto, una capa que ningún navegador
 * rasteriza. Recortando, el vídeo se pinta siempre a su tamaño real y lo
 * único que se mueve es la ventana por la que se ve. `clip-path` corre en el
 * compositor igual que `transform`, así que no se pierde fluidez.
 */
export const OPEN_WIDTH_S = 1.15
export const OPEN_HEIGHT_S = 1.6

/**
 * Compás de espera antes de abrir, desde que el portal toma la pantalla.
 *
 * Es cero a propósito: la apertura tiene que empezar en el primer frame en
 * que se ve el recuadro. La pausa que haría falta para leer que la barra se
 * ha convertido en imagen ya la da `PRELOADER_EXIT_S` en `App.vue` —el
 * portal espera ahí a que el negro del preloader se retire—, y sumar otra
 * aquí dejaba casi un segundo de pantalla parada entre una vista y la otra.
 */
export const OPEN_DELAY_S = 0

/**
 * Zoom fijo del plano en reposo.
 *
 * No es decorativo: el clip lleva grabada una marca de agua en la esquina
 * inferior derecha, y ampliarlo la deja fuera de cuadro. Antes se tapaba
 * con dos barras negras arriba y abajo, que encuadraban el plano pero le
 * comían un sexto de la pantalla. Si algún día se cambia el clip por uno
 * limpio, esto puede bajar a 1.06.
 */
export const STAGE_SCALE = 1.24
