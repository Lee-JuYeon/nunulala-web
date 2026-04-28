import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/landing.css';
function initNavScroll() {
    const nav = document.querySelector('.landing-nav');
    if (!nav)
        return;
    const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}
function initSmoothLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href === '#')
                return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', () => {
    initNavScroll();
    initSmoothLinks();
});
