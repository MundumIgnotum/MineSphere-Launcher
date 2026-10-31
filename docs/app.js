(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = lightbox ? lightbox.querySelector('img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

  function setScrolled() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  }

  function closeNav() {
    if (!navToggle || !nav) return;
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });
  }

  window.addEventListener('scroll', setScrolled, { passive: true });
  setScrolled();

  if (lightbox && lightboxImage && typeof lightbox.showModal === 'function') {
    document.querySelectorAll('[data-lightbox]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        const image = link.querySelector('img');
        if (!image) return;
        event.preventDefault();
        lightboxImage.src = link.getAttribute('href') || image.currentSrc || image.src;
        lightboxImage.alt = image.alt || 'Captura do MineSphere Launcher';
        lightbox.showModal();
        document.body.classList.add('lightbox-open');
      });
    });

    function closeLightbox() {
      if (lightbox.open) lightbox.close();
      document.body.classList.remove('lightbox-open');
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener('close', function () {
      document.body.classList.remove('lightbox-open');
      lightboxImage.removeAttribute('src');
    });
  }
})();
