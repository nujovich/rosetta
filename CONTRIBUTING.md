# Cómo contribuir

Gracias por sumarte. La forma principal de contribuir a este proyecto es
**escribir un adaptador de fuente**: tomar lo que un registro publica y
normalizarlo al estándar común para que sus datos sean comparables con los del
resto, sin perder su metodología propia.

Antes que nada leé `docs/estandar-v0.1.md`. La decisión de diseño que sostiene
todo: el modelo guarda _afirmaciones de cada fuente sobre cada caso_, nunca una
verdad única. **El conteo es siempre por fuente.** Ningún adaptador debe inventar,
promediar ni fusionar números.

## Reglas de dignidad del dato (no negociables)

1. **Cero datos identificatorios** en la capa pública: nada de nombre, DNI,
   domicilio exacto ni fotos de víctimas o sujetos. Si una fuente los expone, tu
   adaptador los descarta.
2. **Cuidado con la reidentificación por agregación.** Si una fuente trae
   localidad muy fina + fecha + edad, generalizá (p. ej. localidad → departamento)
   según lo que se acuerde en el estándar.
3. Si tenés dudas sobre un campo sensible, **abrí un issue antes de mergear**, no
   después.

## Anatomía de un adaptador

Cada fuente vive en `src/sources/<fuente>/` con tres archivos:

- **`mapping.ts`** — la única pieza específica de la fuente: alias de columnas y
  **diccionarios de valor** (código/etiqueta de la fuente → vocabulario canónico).
  Documentá de dónde sale cada código (Libro de Códigos, instructivo, etc.).
- **`adapter.ts`** — toma las filas crudas y arma `CasoReportadoCompleto`.
- **`source.ts`** — implementa `SourceModule` (`meta` + `extract` + `normalize`)
  y llama `registerSource(...)`.

Después, una línea en `src/sources/index.ts`. **No toques el `core`, el
`pipeline`, el `validate` ni el `cli`.** Si sentís que necesitás tocarlos, abrí
un issue: probablemente sea una mejora del motor, no de tu fuente.

## Requisitos de conformidad (los chequea el CI)

Tu PR no se mergea si no cumple:

1. **`npm run typecheck`** sin errores.
2. **`npm test`** en verde, incluido un **test golden** de tu fuente contra un
   fixture sintético (mirá `test/rnfja.test.ts` como modelo). El fixture va en
   `scripts/` o en `test/fixtures/`, nunca datos reales con personas.
3. **Validación de conformidad sin errores**: todo lo que sale de tu `normalize`
   pasa por `src/core/validate.ts`. Cero `error` (los `aviso` están permitidos
   pero explicalos).
4. **Nada se descarta en silencio.** Todo valor que no sepas mapear va a
   `warnings` vía el motor, no a un `catch` vacío.

## Documentar la metodología de la fuente

En el `meta` de tu `source.ts` completá `definicion_base`, `metodo`,
`alcance_categorias` y `alineado_unodc` con honestidad. Esto no es decorativo:
es la capa que explica **por qué** los números de tu fuente difieren de los de
otra. Un adaptador sin metodología documentada es un adaptador incompleto.

## Flujo

```bash
git checkout -b fuente/<nombre>
npm install
npm run fixture            # si tu fuente necesita un fixture nuevo, agregalo
npm run smoke              # o: npm run dev -- run <fuente> --dir ... --anio ...
npm test && npm run typecheck && npm run format
```

Abrí el PR con la checklist del template completa. Para proponer una fuente sin
escribir el adaptador todavía, usá la plantilla de issue "Nueva fuente".

## Estilo

TypeScript estricto, ESM, comentarios en español. Formateo con Prettier
(`npm run format`). Nombres de campos canónicos en `snake_case` (espejan el SQL).
