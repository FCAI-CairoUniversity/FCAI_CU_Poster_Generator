/**
 * navbar.js — Unified Modern Responsive Navbar Toggle
 * FCAI CU Senior 2027
 */
(function() {
  function initNavbar() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const backdrop = document.getElementById('navBackdrop');
    const header = document.querySelector('.site-header');

    if (!toggle || !links) return;

    function openMenu() {
      toggle.classList.add('open');
      links.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
      if (header) header.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      toggle.classList.remove('open');
      links.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      if (header) header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function toggleMenu() {
      const isOpen = links.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }

    const navItems = links.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        closeMenu();
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        closeMenu();
      }
    });

    // Merch Badge
    const merchBadges = document.querySelectorAll('.nav-merch .item-badge');
    merchBadges.forEach(function(badge) {
      badge.textContent = 'New';
    });

    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && links.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  } else {
    initNavbar();
  }
})();
