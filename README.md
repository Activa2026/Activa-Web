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

1. **GitHub**: crear un repositorio privado (por ejemplo `activa-web`) y subir este proyecto a la rama `main`.
   El primer push ejecuta la acción y crea la rama `deploy`.
2. **Endpoint de leads** (cuando esté): en GitHub, *Settings › Secrets and variables › Actions › Variables*,
   crear `PUBLIC_LEADS_ENDPOINT` con la URL. Volver a ejecutar la acción.
3. **Hostinger** (hPanel › Sitios web › activacorredores.cl › Avanzado › **Git**):
   - Si el repositorio es privado, copiar la **clave SSH** que muestra hPanel y agregarla en GitHub en
     *Settings › Deploy keys* (solo lectura).
   - Repositorio: `git@github.com:<usuario>/activa-web.git` · Rama: **`deploy`** · Directorio: vacío (= `public_html`).
     `public_html` debe estar vacío la primera vez.
   - Pulsar **Implementar** y luego activar **Implementación automática**: hPanel entrega una URL de webhook.
4. **Webhook**: en GitHub, *Settings › Webhooks › Add webhook*, pegar esa URL (tipo `application/json`, evento *push*).
   Desde ahí, cada publicación en `deploy` se refleja sola en el sitio.
5. **SSL**: en hPanel › Seguridad › SSL, confirmar que el certificado de activacorredores.cl esté activo
   (el `.htaccess` fuerza HTTPS y el dominio sin `www`).

### Después de publicar

- Enviar `https://activacorredores.cl/sitemap-index.xml` en Google Search Console.
- Revisar con PageSpeed Insights (móvil) y con el depurador de Facebook para la vista previa del link.
