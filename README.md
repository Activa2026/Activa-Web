# activacorredores.cl

Sitio de Activa Corredores. Astro (salida estática) + CSS propio. Ver `CLAUDE.md` para el contexto del negocio.

## Trabajar en el sitio

Requiere Node.js 22 o superior (instalado en `~/.local/node`).

```bash
npm install        # dependencias
npm run dev        # vista previa en http://localhost:4321
npm run build      # compila a dist/
npm run preview    # sirve dist/ para revisar la versión final
npm run check      # revisa tipos y errores
```

- Páginas: `src/pages/` · Componentes: `src/components/` · Estilos: `src/styles/`
- Datos del negocio (WhatsApp, correo, link de propiedades, endpoint): `src/site.ts`
- Fotos: `src/assets/images/` (ver `IMAGENES.md`)
- Logos, favicons e imagen para compartir: `npm run brand` los regenera desde `public/brand/`

## Publicación (GitHub → Hostinger)

```
push a main ─▶ GitHub Actions (npm ci, astro check, build) ─▶ rama "deploy" con dist/
                                                              │
                         Hostinger hPanel › Git ◀── webhook ──┘ ─▶ public_html
```

### Configuración inicial (una sola vez)

1. **GitHub**: repositorio `Activa2026/Activa-Web`, rama `main` (listo). Cada push ejecuta la acción y
   actualiza la rama `deploy`.
2. **Endpoint de leads** (cuando esté): en GitHub, *Settings › Secrets and variables › Actions › Variables*,
   crear `PUBLIC_LEADS_ENDPOINT` con la URL. Volver a ejecutar la acción.
3. **Hostinger** (hPanel › Sitios web › activacorredores.cl › Avanzado › **Git**):
   - Repositorio: `https://github.com/Activa2026/Activa-Web.git` · Rama: **`deploy`** · Directorio: vacío (= `public_html`).
   - Si algún día el repositorio pasa a privado: usar `git@github.com:Activa2026/Activa-Web.git` y agregar la
     **clave SSH** que muestra hPanel en GitHub, *Settings › Deploy keys* (solo lectura).
     `public_html` debe estar vacío la primera vez.
   - Pulsar **Implementar** y luego activar **Implementación automática**: hPanel entrega una URL de webhook.
4. **Webhook**: en GitHub, *Settings › Webhooks › Add webhook*, pegar esa URL (tipo `application/json`, evento *push*).
   Desde ahí, cada publicación en `deploy` se refleja sola en el sitio.
5. **SSL**: en hPanel › Seguridad › SSL, confirmar que el certificado de activacorredores.cl esté activo
   (el `.htaccess` fuerza HTTPS y el dominio sin `www`).

### Formulario de valorización (leads)

Mientras no exista el agente de respuesta, el formulario envía a `public/api/lead.php`, que:

- valida los datos, descarta robots (campo trampa) y limita a 5 envíos por hora por IP y 60 por día;
- envía un correo a andres@activacorredores.cl con los datos y un link directo a WhatsApp;
- guarda cada solicitud en `activa-leads/leads.csv`, **fuera** de `public_html`
  (hPanel › Administrador de archivos, carpeta del dominio). Sirve de respaldo si un correo no llega.

Para el agente (n8n u otro): definir la variable `PUBLIC_LEADS_ENDPOINT` con la URL del webhook y volver
a publicar. El webhook recibe un JSON con `comuna`, `tipo`, `operacion`, `nombre`, `whatsapp` (+569XXXXXXXX),
`email`, `origen` y parámetros `utm_*`, y debe responder con estado 2xx.

### Después de publicar

- Enviar una solicitud de prueba y confirmar que el correo llega (revisar spam). Si el correo del dominio no
  está en Hostinger, puede ser necesario ajustar el registro SPF.

- Enviar `https://activacorredores.cl/sitemap-index.xml` en Google Search Console.
- Revisar con PageSpeed Insights (móvil) y con el depurador de Facebook para la vista previa del link.
