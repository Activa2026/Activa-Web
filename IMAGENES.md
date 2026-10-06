# Imágenes del sitio

**Dónde dejar las fotos:** `src/assets/images/` con el nombre indicado (la extensión puede ser .jpg, .png, .webp o .avif).
Astro solo puede optimizar imágenes que estén dentro de `src/`, así que al compilar genera de forma automática versiones AVIF y WebP
en varios tamaños. Mientras falte una foto, el sitio muestra un bloque de color con el texto del marcador.
Excepción: `og-image.jpg` va en `public/images/` (se usa tal cual al compartir el link; hoy hay una versión provisoria con el logo).
Conviene subir las fotos al tamaño de la tabla o mayor; no hace falta comprimirlas antes.

| Archivo | Dónde va | Origen recomendado | Formato |
|---|---|---|---|
| hero.jpg + video `public/video/hero.mp4` (solo escritorio) | Inicio, detrás del formulario | Real o IA ambiental (calle residencial, luz de tarde) | 1600×1200 / video 10–15 s horizontal |
| comuna-la-florida.webp | Inicio › Comunas | REAL | 800×1000 |
| comuna-macul.webp | Inicio › Comunas | REAL | 800×1000 |
| comuna-penalolen.webp | Inicio › Comunas | REAL | 800×1000 |
| comuna-la-reina.webp | Inicio › Comunas | REAL | 800×1000 |
| perfil-vender.webp | Inicio › ¿Quién eres? | IA o banco (fachada de casa con jardín) | 800×700 |
| perfil-arrendar.webp | Inicio › ¿Quién eres? | IA o banco (living luminoso) | 800×700 |
| perfil-administrar.webp | Inicio › ¿Quién eres? | IA o banco (entrega de llaves) | 800×700 |
| perfil-buscar.webp | Inicio › ¿Quién eres? | IA o banco (familia en un barrio) | 800×700 |
| nosotros.webp | Inicio › Nosotros (imagen general del equipo) | IA o real (equipo de 3 en terreno, sin rostros protagónicos) | 900×1000 (vertical) |
| og-image.jpg | Vista previa al compartir el link | Diseño con logo | 1200×630 |
