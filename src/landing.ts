import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/landing.css';

const STORE_URLS = {
  ios: 'https://apps.apple.com/search?term=nunulala',
  android: 'https://play.google.com/store/search?q=nunulala&c=apps',
} as const;

function initNavScroll(): void {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return;
  const onScroll = (): void => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initSmoothLinks(): void {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = (link as HTMLAnchorElement).getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initStoreLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-store-link="ios"]').forEach(link => {
    link.href = STORE_URLS.ios;
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-store-link="android"]').forEach(link => {
    link.href = STORE_URLS.android;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initSmoothLinks();
  initStoreLinks();
});
