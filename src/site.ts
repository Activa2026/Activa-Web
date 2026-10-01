// Datos del negocio usados en todo el sitio. No agregar datos que no estén en CLAUDE.md.

export const SITE = {
  name: 'Activa Corredores',
  legalName: 'Activa Corredores SpA',
  url: 'https://activacorredores.cl',
  email: 'andres@activacorredores.cl',
  whatsappDisplay: '+56 9 9024 1794',
  whatsappNumber: '56990241794',
  instagram: 'activa_corredores',
  hours: 'Lunes a sábado, de 9:00 a 19:00 hrs.',
  comunas: ['La Florida', 'Macul', 'Peñalolén', 'La Reina'],
} as const;

export const WHATSAPP_URL = `https://wa.me/${SITE.whatsappNumber}`;
export const INSTAGRAM_URL = `https://instagram.com/${SITE.instagram}`;

export function whatsappWithText(text: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

// Listado de propiedades en Dataprop. Pendiente: reemplazar por la URL pública real.
export const PROPERTIES_URL = '/#propiedades';
export const PROPERTIES_EXTERNAL = PROPERTIES_URL.startsWith('http');

// Endpoint del sistema de respuesta de leads (Node.js en Hostinger). Pendiente.
// Mientras esté vacío, el formulario no envía y ofrece continuar por WhatsApp.
export const LEADS_ENDPOINT = import.meta.env.PUBLIC_LEADS_ENDPOINT ?? '';

export const NAV = [
  { href: '/sistema', label: 'Sistema Activa' },
  { href: '/vender', label: 'Vender' },
  { href: '/arrendar', label: 'Arrendar' },
  { href: '/administracion', label: 'Administración' },
  { href: '/#nosotros', label: 'Nosotros' },
] as const;
