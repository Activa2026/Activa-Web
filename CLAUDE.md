# Sitio web Activa Corredores

Sitio corporativo de Activa Corredores SpA (corredora de propiedades residenciales, Santiago de Chile).
Comunas: La Florida, Macul, Peñalolén y La Reina. Dominio: activacorredores.cl.

## Objetivo
1. Captar propietarios que quieren vender, arrendar o delegar la administración (prioridad principal).
2. Destacar el "Sistema Activa" como diferenciador.
3. Mostrar propiedades disponibles como algo secundario (enlace a Dataprop / portales).

## Diseño de referencia
La carpeta `diseno/` contiene las 6 páginas aprobadas (Inicio, Sistema, Vender, Arrendar, Administracion, Contacto).
Son maquetas en un formato de diseño propio: usar su estructura, textos, estilos y animaciones como referencia exacta,
pero reescribir el sitio como código de producción limpio. Ignorar `support.js`, `<x-dc>`, `<helmet>`, `sc-if` y el bloque
`data-dc-script`: son del editor de diseño. Los textos entre corchetes ([Foto: ...], [UF], [n]) son marcadores.

## Stack sugerido
- Astro (salida estática) + CSS propio, sin frameworks de UI pesados. Header, footer y bloques repetidos como componentes.
- Despliegue: repositorio GitHub con auto-deploy a Hostinger (revisar la configuración actual antes de decidir;
  si Hostinger sirve archivos estáticos, compilar con GitHub Actions y publicar `dist/`).
- Antes de instalar o desplegar, proponer el plan y esperar aprobación.

## Identidad
- Colores: azul #0F456B (principal), tinta #1E3350 (texto), oliva #647850, dorado #C8A050, arena #F3EEE6 (fondo),
  blanco #FFFFFF, línea #E4DCCD, texto secundario #33404D / #4F5A66.
- Tipografías: Lora (títulos; segunda frase del título en cursiva y color oliva, o dorado sobre fondos oscuros) y Poppins (texto).
- Logo: `public/brand/logo-activa.png` (completo) e `isotipo-activa.png` (solo casa, para el menú).
- Lema: Transparencia + Seguridad + Proactividad.

## Movimiento
Animaciones ligadas al scroll, sutiles (desplazamientos de 36–48 px): aparición escalonada, entradas laterales,
barras que se llenan, leve parallax en la foto de "Nosotros", franja "Las reglas Activa" en desplazamiento continuo
(pausa al pasar el mouse). Implementar con CSS scroll-driven animations + IntersectionObserver como respaldo para
Firefox. Respetar `prefers-reduced-motion` (sin animación).

## Datos del negocio (no inventar otros)
- Valorización 360°: comparables CBR 70%, HousePricing 15%, Propiteq 15%. Entrega 3 precios (competitivo, mercado, aspiracional) y líquido estimado.
- Comisión de venta: 2% sobre el precio de venta, sin IVA (confirmado).
- Orden de venta exclusiva por 120 días.
- Comisión de arriendo: 50% de un mes de arriendo + IVA.
- Administración: 8% + IVA sobre el arriendo mensual. Cerca de 60 propiedades administradas.
- WhatsApp: +56 9 9024 1794 (https://wa.me/56990241794). Correo: andres@activacorredores.cl. Instagram: @activa_corredores.
- Horario: lunes a sábado, 9:00 a 19:00 hrs.
- Respuesta al formulario: inmediata por WhatsApp.

## Formulario de valorización (3 pasos)
1) Comuna, tipo (casa/departamento), operación (vender/arrendar/administrar)
2) Nombre, WhatsApp, correo opcional
3) Confirmación
Enviar los datos al sistema de respuesta de leads existente (Node.js en Hostinger) para que el primer mensaje
de WhatsApp salga de inmediato. Pedir el endpoint antes de implementarlo. Validar campos y proteger contra spam
(honeypot + límite de envíos).

## Imágenes
Ver `IMAGENES.md`. Las fotos van en `src/assets/images/` con los nombres indicados (Astro las optimiza desde ahí; `og-image.jpg` va en `public/images/`); mientras no existan,
mostrar un bloque de color de la paleta con el texto del marcador. Optimizar a WebP/AVIF con tamaños responsivos.

## Calidad
- Diseño responsivo (probar en 375 px, 768 px y 1440 px).
- Accesibilidad: contraste AA, foco visible, etiquetas en formularios, textos alternativos.
- SEO local: títulos y descripciones por página, datos estructurados RealEstateAgent, sitemap, Open Graph.
- Rendimiento: Lighthouse 90+ en móvil.
