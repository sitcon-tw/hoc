import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Fade in elements on scroll
  const fadeInElements = document.querySelectorAll('.fade-in');

  fadeInElements.forEach((element) => {
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Animate session cards
  const sessionCards = document.querySelectorAll('.session-card');

  sessionCards.forEach((card, index) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: index * 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Animate CTA cards
  const ctaCards = document.querySelectorAll('.cta-card');

  ctaCards.forEach((card, index) => {
    gsap.to(card, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.8,
      delay: index * 0.2,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: card,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Parallax effect for hero section
  const hero = document.getElementById('hero');
  if (hero) {
    gsap.to(hero, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // Animate header on scroll
  const header = document.getElementById('header');
  if (header) {
    ScrollTrigger.create({
      start: 'top -80',
      end: 99999,
      toggleClass: { targets: header, className: 'scrolled' },
    });
  }
});
