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
# fuentes per-case -> caso_reportado
npm run dev -- run rnfja --dir ./data/rnfja/2024 --anio 2024 --out ./out/rnfja-2024.json

# fuentes de referencia (agregadas) -> serie agregada para validación cruzada
npm run dev -- run-ref snic --dir ./data/snic --out ./out/snic.json
```

## Cargar a la base (etapa `load`)

El esquema (`db/migrations/`) es **PostgreSQL puro**: no usa nada propio de
Supabase. Por eso la etapa de carga sólo necesita un `DATABASE_URL` estándar, y
el mismo loader corre sin cambios contra cualquier Postgres **open source y
gratis**: un contenedor local (Docker Compose), [Neon](https://neon.tech) o
[Supabase](https://supabase.com) (su free tier es Postgres; también es
self-hosteable). Cero lock-in: cambiás el destino apuntando `DATABASE_URL`.

```bash
cp .env.example .env          # DATABASE_URL ya apunta al Postgres local de compose
docker compose up -d          # Postgres local (o usá Neon/Supabase: pegá su URL en .env)
npm run db:migrate            # aplica db/migrations/ (idempotente)

# correr una fuente y cargar su salida (idempotente: recargar actualiza, no duplica)
npm run dev -- run rnfja --dir ./data/rnfja/2024 --anio 2024 --out ./out/rnfja-2024.json
npm run db:load -- ./out/rnfja-2024.json

# las fuentes de referencia (serie_agregada) se cargan igual
npm run dev -- run-ref snic --dir ./data/snic --out ./out/snic.json
npm run db:load -- ./out/snic.json
```

El loader hace **UPSERT por la clave natural** de cada tabla del estándar, así
que es seguro re-correrlo: una nueva publicación de la misma fuente actualiza en
vez de duplicar. No fusiona ni inventa casos: persiste `caso_reportado` y
`serie_agregada` tal cual salen del pipeline.

## Arquitectura

```
docs/estandar-v0.1.md        # el estándar (la fuente de verdad conceptual)
db/migrations/               # esquema canónico SQL (Postgres/Supabase)
src/
  schema.ts                  # tipos canónicos (espejo del SQL)
  core/
    registry.ts              # ← registry de fuentes per-case (pluggable)
    reference.ts             # ← registry de fuentes de REFERENCIA (agregadas)
    pipeline.ts              # ← extract → normalize → validate
    validate.ts              # ← conformidad: todo adaptador pasa por acá
    harmonize.ts             # motor de mapeo (diccionarios, nulos, warnings)
    io.ts                    # lectura de planillas
  sources/
    index.ts                 # registra todas las fuentes (1 línea por fuente)
    rnfja/                    # adaptador RNFJA (completo)
    rnfja-sentencias/        # variante: desenlace judicial (respuesta_estatal)
    aqsnv/                    # monitoreo de medios (completo)
    lucia-perez/             # monitoreo de medios (completo)
    snic/                    # fuente de REFERENCIA (tasas agregadas, no per-case)
  load/                      # ← etapa de carga a Postgres (migrate + UPSERT idempotente)
    db.ts                    #    pool desde DATABASE_URL (Postgres puro, sin lock-in)
    migrate.ts               #    runner de db/migrations/ (idempotente, sin tooling externa)
    load.ts                  #    persiste caso_reportado / serie_agregada por clave natural
  reconcile/cluster.ts       # etapa caso_unificado (v0 heurística)
  cli.ts                     # list | run | run-ref | migrate | load (no se toca al agregar fuentes)
```

## Agregar una fuente (el patrón)

1. `src/sources/<fuente>/` con su `mapping.ts` + `adapter.ts` + `source.ts`.
2. `source.ts` implementa `SourceModule` (meta + extract + normalize) y llama
   `registerSource(...)`.
3. Una línea en `src/sources/index.ts`.

**Nada del `core`, el `pipeline`, el `validate` ni el `cli` cambia.** Por eso el
validador de conformidad importa: garantiza que el adaptador de cualquiera
produzca datos al mismo estándar.

### Dos clases de fuente: per-case y de referencia

La mayoría de las fuentes son **per-case**: producen un `caso_reportado` por
víctima. Pero algunas —como el **SNIC**— sólo publican **agregados** (tasas por
provincia/año), no hechos individuales. Forzarlas al modelo `caso_reportado`
inventaría casos, justo lo que el estándar prohíbe. Por eso producen
`SerieAgregada` y viven en un registry paralelo (`core/reference.ts`,
`registerReferenceSource`, CLI `run-ref`). No alimentan el conteo per-case ni la
reconciliación: su valor es la **validación cruzada** (contrastar la tasa oficial
de una jurisdicción contra lo que captan las fuentes per-case).

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

**Fuentes per-case** (producen `caso_reportado`):

| Fuente                                                                        | Tipo             | Método            | Estado                                      | Tests |
| ----------------------------------------------------------------------------- | ---------------- | ----------------- | ------------------------------------------- | ----- |
| `rnfja` — Registro Nacional de Femicidios de la Justicia Argentina (OM-CSJN)  | estatal_judicial | registro_judicial | ✅ Completo (⚠️ verificar Libro de Códigos) | 7     |
| `rnfja-sentencias` — Obs. de Seguimiento de Causas y Sentencias (OM-CSJN, #3) | estatal_judicial | registro_judicial | ✅ Completo (⚠️ verificar Libro de Códigos) | 10    |
| `aqsnv` — Ahora Que Sí Nos Ven                                                | sociedad_civil   | monitoreo_medios  | ✅ Completo                                 | 10    |
| `lucia-perez` — Observatorio Lucía Pérez                                      | sociedad_civil   | monitoreo_medios  | ✅ Completo                                 | 10    |

**Fuentes de referencia** (agregadas, validación cruzada — NO per-case, ver `run-ref`):

| Fuente                                                               | Tipo              | Método                  | Estado      | Tests |
| -------------------------------------------------------------------- | ----------------- | ----------------------- | ----------- | ----- |
| `snic` — Sistema Nacional de Información Criminal (datos.gob.ar, #2) | estatal_ejecutivo | registro_administrativo | ✅ Completo | 7     |

- ⬜ Cerrar mapeo real RNFJA contra el Libro de Códigos
- ✅ Etapa de carga (load) a Postgres (incluye `serie_agregada`) — UPSERT idempotente, sin lock-in a Supabase
- ⬜ Explorador público

### Fuentes conocidas sin adaptador aún

| Fuente                                                  | Tipo              | Nota                                 |
| ------------------------------------------------------- | ----------------- | ------------------------------------ |
| OFDPN — Defensoría del Pueblo de la Nación              | estatal_ejecutivo | Informes PDF, datos agregados        |
| La Casa del Encuentro — Obs. "Adriana Marisel Zambrano" | sociedad_civil    | Informes mensuales, datos agregados  |
| MuMaLá — Mujeres de la Matria Latinoamericana           | sociedad_civil    | Informes periódicos, datos agregados |
