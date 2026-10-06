# Cómo agregar una propiedad

1. Crea una carpeta con un nombre corto, en minúsculas y con guiones: por ejemplo `casa-la-reina-act-012`.
   Ese nombre será la dirección: `activacorredores.cl/propiedades/casa-la-reina-act-012`.
2. Copia dentro el `index.md` de `ejemplo-borrador/` y completa los datos.
3. Deja las fotos en la misma carpeta (`01.jpg`, `02.jpg`, …) y lístalas en `fotos:` como `./01.jpg`.
   La primera es la portada. No hace falta comprimirlas.
4. Quita la línea `borrador: true` (o ponla en `false`).

**Cuando se venda o arriende:** cambia `estado:` a `vendida` o `arrendada`. La ficha sigue publicada con el cartel.
Para sacarla del sitio, borra la carpeta.

| Campo | Valores |
|---|---|
| `operacion` | `venta` o `arriendo` |
| `tipo` | `casa`, `departamento`, `parcela`, `terreno`, `oficina`, `local` |
| `precio.moneda` | `UF` o `CLP` (pesos) |
| `estado` | `disponible`, `reservada`, `vendida`, `arrendada` |
| `superficie` | `construida`, `util`, `terraza`, `terreno` (m², opcionales) |
| `gastosComunes` | en pesos, opcional |
