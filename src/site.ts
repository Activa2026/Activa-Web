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

// El enlace a "Propiedades" se calcula en lib/propiedades.ts (enlacePropiedades).

// Destino del formulario. Por defecto, public/api/lead.php (correo + registro en Hostinger).
// Para el agente futuro (n8n), definir PUBLIC_LEADS_ENDPOINT con la URL del webhook.
// Si el envío falla, el formulario ofrece continuar por WhatsApp.
export const LEADS_ENDPOINT = import.meta.env.PUBLIC_LEADS_ENDPOINT || '/api/lead.php';

export const NAV = [
  { href: '/sistema', label: 'Sistema Activa' },
  { href: '/vender', label: 'Vender' },
  { href: '/arrendar', label: 'Arrendar' },
  { href: '/administracion', label: 'Administración' },
  { href: '/#nosotros', label: 'Nosotros' },
] as const;
