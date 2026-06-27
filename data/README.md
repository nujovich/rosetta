# data/

Acá van los archivos **reales** de cada fuente, localmente. **No se commitean**
(ver `.gitignore`): pueden ser pesados y, sobre todo, no queremos versionar datos
con potencial sensible en el repo público.

Estructura sugerida:

```
data/
  rnfja/2024/   <- las 3 bases .xls del año + el Libro de Códigos
  aqsnv/2024/   <- el dataset de la fuente
```

Correr, por ejemplo:

```bash
npm run dev -- run rnfja --dir ./data/rnfja/2024 --anio 2024 --out ./out/rnfja-2024.json
```

Los datos abiertos del RNFJA ya vienen desidentificados (las jurisdicciones
reservan nº de causa y datos de víctimas/sujetos). Aun así, no los subas al repo.
