// Lógica del formulario de valorización (components/ValuationForm.astro).
// Valida, protege contra spam (campo trampa, tiempo mínimo y límite de envíos por
// navegador) y envía al sistema de respuesta de leads. Si no hay endpoint o el envío
// falla, ofrece continuar por WhatsApp con el mensaje ya escrito.

const STEP_NAMES = ['Tu propiedad', 'Tus datos', 'Listo'];
const MIN_FILL_MS = 3000;
const RATE_KEY = 'activa-leads';
const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12000;

const OPERATION_LABEL: Record<string, string> = {
  vender: 'vender',
  arrendar: 'arrendar',
  administrar: 'que administren',
};

/** Normaliza un celular chileno a +569XXXXXXXX. Devuelve null si no es válido. */
export function normalizeChileanMobile(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('56')) digits = digits.slice(2);
  if (digits.length === 8) digits = `9${digits}`;
  return /^9\d{8}$/.test(digits) ? `+56${digits}` : null;
}

function recentSubmissions(): number[] {
  try {
    const list = JSON.parse(localStorage.getItem(RATE_KEY) ?? '[]') as number[];
    const now = Date.now();
    return Array.isArray(list) ? list.filter((t) => now - t < RATE_WINDOW_MS) : [];
  } catch {
    return [];
  }
}

function recordSubmission(): void {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify([...recentSubmissions(), Date.now()]));
  } catch {
    /* almacenamiento no disponible: el límite real está en el servidor */
  }
}

function utmParams(): Record<string, string> {
  const out: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((value, key) => {
    if (key.startsWith('utm_')) out[key] = value.slice(0, 100);
  });
  return out;
}

export function initValuationForm(form: HTMLFormElement): void {
  const endpoint = form.dataset.endpoint ?? '';
  const waNumber = form.dataset.whatsapp ?? '';
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const bars = form.querySelectorAll<HTMLElement>('.vform__bars span');
  const steps = form.querySelectorAll<HTMLElement>('[data-step]');
  const sendError = form.querySelector<HTMLElement>('[data-send-error]')!;
  const waFallback = form.querySelector<HTMLAnchorElement>('[data-wa-fallback]')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;

  const startedAt = Date.now();
  let sending = false;

  // Preselecciona la operación desde ?op=vender|arrendar|administrar
  const op = new URLSearchParams(location.search).get('op');
  if (op && op in OPERATION_LABEL) field('operacion').value = op;

  function show(step: '1' | '2' | '3' | 'fallback', focus = true): void {
    steps.forEach((el) => (el.hidden = el.dataset.step !== step));
    const n = step === 'fallback' ? 3 : Number(step);
    bars.forEach((bar, i) => bar.classList.toggle('is-on', i < n));
    status.textContent =
      step === 'fallback' ? 'Paso 3 de 3: Enviar por WhatsApp' : `Paso ${n} de 3: ${STEP_NAMES[n - 1]}`;
    if (!focus) return;
    const target = form.querySelector<HTMLElement>(`[data-step="${step}"]`)!;
    const first =
      step === '1' || step === '2'
        ? target.querySelector<HTMLElement>('input:not([tabindex="-1"]), select')
        : target;
    first?.focus({ preventScroll: false });
  }

  function setError(input: HTMLInputElement, message: string | null): boolean {
    const err = form.querySelector<HTMLElement>(`#${input.id}-err`);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) {
      err.textContent = message ?? '';
      err.hidden = !message;
    }
    return !message;
  }

  function validate(): boolean {
    const nombre = field('nombre') as HTMLInputElement;
    const fono = field('whatsapp') as HTMLInputElement;
    const mail = field('email') as HTMLInputElement;

    const okNombre = setError(nombre, nombre.value.trim().length >= 2 ? null : 'Escribe tu nombre.');
    const okFono = setError(
      fono,
      normalizeChileanMobile(fono.value) ? null : 'Escribe un celular chileno, por ejemplo +56 9 1234 5678.',
    );
    const mailValue = mail.value.trim();
    const okMail = setError(
      mail,
      !mailValue || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mailValue) ? null : 'Revisa el correo o déjalo en blanco.',
    );

    const firstInvalid = [nombre, fono, mail].find((el) => el.getAttribute('aria-invalid') === 'true');
    firstInvalid?.focus();
    return okNombre && okFono && okMail;
  }

  function whatsappMessage(): string {
    const comuna = field('comuna').value;
    const tipo = field('tipo').value;
    const opLabel = OPERATION_LABEL[field('operacion').value] ?? field('operacion').value;
    const nombre = field('nombre').value.trim();
    return `Hola, soy ${nombre}. Quiero una Valorización 360° de mi ${tipo} en ${comuna} para ${opLabel}.`;
  }

  function fallback(failed = false): void {
    if (failed) {
      form.querySelector<HTMLElement>('[data-fallback-text]')!.textContent =
        'No pudimos registrar tu solicitud desde la página. Envíanos el mensaje ya escrito por WhatsApp y te respondemos ahí mismo.';
    }
    waFallback.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMessage())}`;
    show('fallback');
  }

  // Valida a medida que se corrige un campo marcado con error
  form.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.getAttribute('aria-invalid') === 'true') {
      if (input.name === 'nombre' && input.value.trim().length >= 2) setError(input, null);
      if (input.name === 'whatsapp' && normalizeChileanMobile(input.value)) setError(input, null);
      if (input.name === 'email' && (!input.value.trim() || input.checkValidity())) setError(input, null);
    }
  });

  form.querySelector('[data-next]')!.addEventListener('click', () => show('2'));
  form.querySelector('[data-back]')!.addEventListener('click', () => show('1'));
  form.querySelectorAll('[data-reset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      form.reset();
      sendError.hidden = true;
      show('1');
    }),
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    sendError.hidden = true;

    // Paso 1 con Enter: avanzar en vez de enviar
    if (form.querySelector<HTMLElement>('[data-step="2"]')!.hidden) {
      show('2');
      return;
    }
    if (!validate()) return;

    // Robots: campo trampa lleno o envío demasiado rápido → fingir éxito sin enviar
    if ((field('empresa') as HTMLInputElement).value || Date.now() - startedAt < MIN_FILL_MS) {
      show('3');
      return;
    }

    if (recentSubmissions().length >= RATE_MAX) {
      sendError.textContent =
        'Ya recibimos varias solicitudes desde este equipo. Si necesitas algo más, escríbenos por WhatsApp.';
      sendError.hidden = false;
      return;
    }

    if (!endpoint) {
      fallback();
      return;
    }

    const payload = {
      comuna: field('comuna').value,
      tipo: field('tipo').value,
      operacion: field('operacion').value,
      nombre: field('nombre').value.trim(),
      whatsapp: normalizeChileanMobile(field('whatsapp').value),
      email: field('email').value.trim() || null,
      origen: location.pathname,
      ...utmParams(),
    };

    sending = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Enviando…';
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      recordSubmission();
      show('3');
    } catch {
      fallback(true);
    } finally {
      window.clearTimeout(timer);
      sending = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = 'Solicitar valorización';
    }
  });

  show('1', false);
}
