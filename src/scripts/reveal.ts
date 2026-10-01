// Respaldo para navegadores sin animaciones ligadas al scroll (Firefox).
// Ver styles/motion.css.

const SELECTOR = '.rv, .rv-l, .rv-r, .stagger > *, .steps > li, .grow';

export function initReveal(): void {
  // La clase la agrega un script en <head> (Base.astro) para evitar un parpadeo inicial.
  if (!document.documentElement.classList.contains('reveal-fallback')) return;

  const els = document.querySelectorAll<HTMLElement>(SELECTOR);
  els.forEach((el) => {
    const parent = el.parentElement;
    if (parent && (parent.classList.contains('stagger') || parent.classList.contains('steps'))) {
      const index = Array.prototype.indexOf.call(parent.children, el);
      el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 0.09}s`);
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  els.forEach((el) => io.observe(el));

  const parallax = document.querySelectorAll<HTMLElement>('.px');
  if (parallax.length) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parallax.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // 0 cuando entra por abajo, 1 cuando sale por arriba
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        el.style.setProperty('--px', `${36 - progress * 72}px`);
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }
}
