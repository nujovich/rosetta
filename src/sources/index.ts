// sources/index.ts
// Importar este archivo registra todas las fuentes (efecto de carga).
// Agregar una fuente nueva = una línea acá.
//
// Hay dos clases de fuente:
//   - caso_reportado (per-case): rnfja, rnfja-sentencias, aqsnv, lucia-perez.
//   - referencia/agregada (NO per-case): snic. Se registra en el registry de
//     referencia (ver core/reference.ts); aporta validación cruzada, no casos.
import './rnfja/source.js';
import './rnfja-sentencias/source.js';
import './aqsnv/source.js';
import './lucia-perez/source.js';
import './snic/source.js';
