## Qué hace este PR

<!-- breve descripción -->

## Si agregás/modificás una fuente, checklist de conformidad

- [ ] `npm run typecheck` sin errores
- [ ] `npm test` en verde, con **test golden** de la fuente contra fixture sintético
- [ ] Validación de conformidad **sin errores** (`src/core/validate.ts`)
- [ ] Nada se descarta en silencio: lo no mapeado va a `warnings`
- [ ] `meta` con metodología documentada (`definicion_base`, `metodo`, `alcance_categorias`, `alineado_unodc`)
- [ ] **Cero datos identificatorios** de víctimas o sujetos
- [ ] No toqué `core/` / `pipeline` / `validate` / `cli` (o lo justifico abajo)
- [ ] Diccionarios de valor documentan su origen (Libro de Códigos / instructivo)

## Notas

<!-- decisiones de mapeo, dudas, avisos de validación que dejaste a propósito -->
