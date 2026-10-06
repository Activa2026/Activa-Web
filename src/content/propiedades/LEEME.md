# Propiedades del sitio

## Importación automática desde Dataprop (lo habitual)

Las propiedades se importan desde la tienda pública de Dataprop
(https://app.dataprop.cl/tienda-oficial/activa-corredores-1869) con `node tools/importar-dataprop.mjs`.
GitHub lo ejecuta **todos los días** y publica los cambios; también se puede lanzar a mano en
GitHub › Actions › "Compilar y publicar" › *Run workflow*.

- Propiedad nueva o modificada en Dataprop → se crea o actualiza aquí.
- Propiedad que desaparece de Dataprop → queda publicada con el cartel **Vendida** o **Arrendada**.
  Para sacarla del sitio, borra su carpeta.
- Se muestra la calle **sin número** y la comuna; la referencia es legible, p. ej. "Casa La Reina · Francisco de Villagra".
- Párrafos que parecen notas internas ("A verificar con…") se omiten y se avisa en el registro.
- **No edites a mano** las carpetas importadas (tienen un archivo `.dataprop.json`): se sobrescriben.
  Para corregir algo de forma permanente usa `tools/dataprop-ajustes.json`, por id de Dataprop:

```json
{
  "1782489201": { "bajada": "Casa de un piso a pasos de Plaza Egaña", "destacada": true }
}
```

## Propiedades cargadas a mano

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
