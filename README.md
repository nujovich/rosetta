# Rosetta

Estándar abierto + harmonizador de datos de femicidios para Argentina.
Toma lo que cada fuente ya publica y lo vuelve **comparable** sin inventar un
total propio. Motor genérico + un adaptador por fuente.

> El nombre del proyecto es Rosetta. El estándar vive en `docs/estandar-v0.1.md`.

## Idea central

El problema del campo no es falta de datos sino **fragmentación**. Acá el modelo
guarda _afirmaciones de cada fuente sobre cada caso_ (`caso_reportado`), nunca una
verdad única. El conteo es **siempre por fuente**. Una etapa de reconciliación
vincula los hechos co-referentes **sin fusionarlos**, para poder ver qué ve una
fuente que otra pierde (ese es el aporte real).

## Correr

```bash
npm install
npm run smoke      # genera fixture sintético + corre RNFJA de punta a punta
npm run dev -- list
npm test           # tests golden
npm run typecheck
```

Con datos reales:

```bash
npm run dev -- run rnfja --dir ./data/rnfja/2024 --anio 2024 --out ./out/rnfja-2024.json
```

## Arquitectura

```
docs/estandar-v0.1.md        # el estándar (la fuente de verdad conceptual)
db/migrations/               # esquema canónico SQL (Postgres/Supabase)
src/
  schema.ts                  # tipos canónicos (espejo del SQL)
  core/
    registry.ts              # ← registry de fuentes (pluggable)
    pipeline.ts              # ← extract → normalize → validate
    validate.ts              # ← conformidad: todo adaptador pasa por acá
    harmonize.ts             # motor de mapeo (diccionarios, nulos, warnings)
    io.ts                    # lectura de planillas
  sources/
    index.ts                 # registra todas las fuentes (1 línea por fuente)
    rnfja/                    # adaptador RNFJA (completo)
    aqsnv/                    # STUB: muestra cómo se agrega una fuente
  reconcile/cluster.ts       # etapa caso_unificado (v0 heurística)
  cli.ts                     # list | run (no se toca al agregar fuentes)
```

## Agregar una fuente (el patrón)

1. `src/sources/<fuente>/` con su `mapping.ts` + `adapter.ts` + `source.ts`.
2. `source.ts` implementa `SourceModule` (meta + extract + normalize) y llama
   `registerSource(...)`.
3. Una línea en `src/sources/index.ts`.

**Nada del `core`, el `pipeline`, el `validate` ni el `cli` cambia.** Por eso el
validador de conformidad importa: garantiza que el adaptador de cualquiera
produzca datos al mismo estándar. Próximo: `aqsnv` (monitoreo de medios), donde
aparece la fricción real de comparabilidad entre definiciones distintas.

## ⚠️ RNFJA: verificar el Libro de Códigos

Los `.xls` traen variables **codificadas**; las etiquetas están en el Libro de
Códigos anual. En `src/sources/rnfja/mapping.ts` confirmá nombres de columna,
clave de unión y reemplazá los códigos numéricos tentativos. Lo que no mapee cae
en `warnings` (no se descarta en silencio).

## Contribuir

La forma de contribuir es **escribir un adaptador de fuente**. Leé
[`CONTRIBUTING.md`](./CONTRIBUTING.md): explica la anatomía de un adaptador, los
requisitos de conformidad que chequea el CI y las **reglas de dignidad del dato**
(no negociables). El proyecto adopta un [código de conducta](./CODE_OF_CONDUCT.md).

El CI (`.github/workflows/ci.yml`) corre en cada PR: `typecheck`, `format:check`,
`fixture` y `test`. Un PR de fuente nueva no mergea sin test golden y validación
de conformidad sin errores.

## Licencias

Tres capas (ver [`LICENSING.md`](./LICENSING.md)): código **MIT** (default),
estándar y docs **CC BY 4.0**, datos derivados **CC BY 4.0 / ODbL** respetando la
cita de cada fuente original.

## Estado

- ✅ Estándar v0.1 + esquema canónico (SQL) + tipos
- ✅ Motor genérico, registry pluggable, pipeline con validación de conformidad
- ✅ Adaptador RNFJA (⚠️ pendiente verificar códigos vs. Libro de Códigos real)
- ✅ Scaffolding open-source: CI, contribución, licencias, CoC
- ⬜ Cerrar mapeo real RNFJA contra el Libro de Códigos
- ⬜ Adaptador AQSNV (monitoreo de medios)
- ⬜ Etapa de carga (load) a Postgres/Supabase
- ⬜ Explorador público
