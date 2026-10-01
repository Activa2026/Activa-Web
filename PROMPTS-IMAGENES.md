# Prompts para imágenes del sitio (Nano Banana / Google Flow)

Prompts en inglés porque los modelos responden con más precisión; el comentario en español explica la intención.
Al terminar, guarda cada imagen con el **nombre de archivo indicado** y pásamela (o déjala en `src/assets/images/`).
No hace falta comprimirlas: el sitio genera las versiones optimizadas.

**No se generan con IA:** las 4 comunas y el retrato de Andrés (ver `IMAGENES.md`): van fotos reales.

---

## Cómo usarlos

- **Nano Banana (Gemini):** pega primero el *bloque de estilo* y luego el prompt de la imagen, en el mismo mensaje.
  Indica la proporción al final ("Aspect ratio 4:3"). Si una imagen sale bien, para las siguientes adjúntala y escribe
  *"Same style, lighting and color palette as the attached image"* + el nuevo prompt: así las 5 quedan como una serie.
- **Google Flow:** sirve para lo mismo (imagen) y además para el **video** de portada (al final).
- Genera 3–4 variantes de cada una y elige; pide correcciones en frases cortas
  ("less saturated", "remove the car", "warmer light", "no people").
- Revisa siempre: sin texto ni letreros legibles, sin patentes, sin manos o rostros deformes, sin logos.

---

## Bloque de estilo (pegar antes de cada prompt)

```
Style: realistic editorial real-estate photography, natural light, shot on a full-frame camera
with a 35mm lens, soft late-afternoon sun, gentle shadows, calm and trustworthy mood.
Setting: residential neighborhoods of eastern Santiago, Chile (La Reina, Peñalolén, Macul, La Florida):
one- and two-story houses, low front walls with metal gates, small front gardens, mature street trees
(plane trees, jacarandas), the Andes foothills softly visible in the distance when outdoors.
Color palette: muted and warm — deep navy blue, olive green, sand beige and soft golden light.
Avoid: oversaturated colors, HDR look, luxury mansions, skyscrapers, palm trees, snow,
any readable text, signs, logos, license plates, watermarks, distorted hands or faces.
```

---

## 1. Portada — `hero` · proporción **4:3** (mínimo 1600×1200)

Va detrás del formulario de valorización: el lado derecho e inferior quedarán tapados por una tarjeta blanca,
así que la escena debe "respirar" arriba e izquierda.

```
A quiet tree-lined residential street in eastern Santiago at golden hour. Warm sunlight filters through
large plane trees, casting long dappled shadows on the sidewalk. Single-family houses with small gardens
and low walls line the street. The Andes foothills appear softly in the background haze.
No people, no cars in the foreground. Calm, aspirational but realistic, not luxurious.
The upper-left area has open sky and tree canopy; the lower half is simple pavement and sidewalk
with little detail. Aspect ratio 4:3.
```

## 2. Quiero vender — `perfil-vender` · **4:3** (mínimo 800×600)

```
Front view of a well-kept two-story family house in a Santiago suburb, with a small green front garden,
a low white wall and a dark metal gate, late-afternoon sun on the facade, a mature tree partially framing
the shot. Clean, inviting, ready to sell, realistic middle-class home (not a mansion). No people, no text,
no "for sale" sign. Aspect ratio 4:3.
```

## 3. Quiero arrendar — `perfil-arrendar` · **4:3**

```
Bright, empty living room of a modern apartment in Santiago, ready to rent: light wooden floor,
white walls, large window with soft afternoon light and a view of trees, one neutral sofa,
a small plant, minimal decoration in sand and olive tones. Clean and spacious, realistic size,
no clutter, no people, no text. Aspect ratio 4:3.
```

## 4. Que alguien lo administre — `perfil-administrar` · **4:3**

```
Close-up of a key handover at the front door of a house: one hand giving a set of house keys
with a simple key ring to another hand. Only hands and forearms visible, business-casual sleeves
(navy and beige), soft daylight, blurred doorway and plants in the background. Trustworthy, professional,
warm. Anatomically correct hands with five fingers each. No faces, no text, no logos. Aspect ratio 4:3.
```

## 5. Busco dónde vivir — `perfil-buscar` · **4:3**

```
A young family (two adults and a child) walking hand in hand along a leafy residential sidewalk
in Santiago, seen from behind at a medium distance, late-afternoon light, trees and house fronts
around them, the Andes foothills faint in the distance. Natural, candid, hopeful mood.
Faces not visible. No text, no logos. Aspect ratio 4:3.
```

---

## Video de portada (opcional) — `hero.mp4` · Google Flow (Veo) · 16:9

Hoy el sitio usa la foto; si el video queda bien, lo agrego con la foto como respaldo
(en móviles y para quienes prefieren menos movimiento se muestra solo la foto). Debe ser corto y liviano.

```
Slow, steady dolly shot moving forward along a quiet tree-lined residential street in eastern Santiago
at golden hour. Leaves gently moving in a light breeze, dappled sunlight on the pavement,
houses with small gardens on both sides, the Andes foothills in the soft background haze.
No people, no cars, no text. Realistic cinematic look, muted warm colors, very subtle motion,
seamless and calm. 8 seconds, 16:9.
```

Consejo: pide un movimiento muy lento; los videos con mucho movimiento distraen del formulario.

---

## Imagen para compartir el link — `og-image` (no generar)

La armo yo con la foto de portada elegida + logo, a 1200×630. No hace falta prompt.
