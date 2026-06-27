# Licenciamiento

Este proyecto tiene **tres capas** con necesidades distintas. Conviene
licenciarlas por separado:

| Capa                | Qué incluye                              | Licencia sugerida                 |
| ------------------- | ---------------------------------------- | --------------------------------- |
| **Código**          | `src/`, `scripts/`, `db/`                | MIT (default) — maximiza adopción |
| **Estándar y docs** | `docs/`, `README`, este archivo          | CC BY 4.0                         |
| **Datos**           | salidas normalizadas, datasets derivados | CC BY 4.0 u ODbL                  |

## Por qué así

- **Código en MIT**: el objetivo es que cualquiera —observatorios, periodistas,
  academia— pueda apoyarse en esto sin fricción legal. MIT es lo más simple.
  _Alternativa a considerar:_ si te preocupa que un actor cierre una versión y la
  capture, **AGPL-3.0** obliga a compartir mejoras. Es tu llamada política; MIT
  prioriza alcance, AGPL prioriga reciprocidad.
- **Datos con atribución obligatoria**: cada fuente original exige cita (el RNFJA
  la exige explícitamente — ver `src/sources/rnfja/mapping.ts`). La licencia de
  datos derivados **no puede contradecir** las condiciones de las fuentes
  originales. Atribuí siempre a la fuente primaria.

## Pendiente

- [ ] Elegir código: MIT vs AGPL-3.0 (hay un `LICENSE` MIT por defecto).
- [ ] Confirmar licencia de datos con quienes aporten/validen el estándar.
- [ ] Revisar que la redistribución respete las condiciones de cada fuente.

> No soy abogada; esto es orientación práctica, no asesoramiento legal.
