import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapAnimations() {
  useEffect(() => {
    // Animate project cards with stagger
    const cards = document.querySelectorAll('[data-animate="card"]');
    cards.forEach((card) => {
      gsap.fromTo(
        card,
        {
          y: 100,
          opacity: 0,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Animate section titles with reveal effect
    const titles = document.querySelectorAll('[data-animate="title"]');
    titles.forEach((title) => {
      gsap.fromTo(
        title,
        {
          y: 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: title,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Animate text lines with split reveal
    const textLines = document.querySelectorAll('[data-animate="text-line"]');
    textLines.forEach((line, index) => {
      gsap.fromTo(
        line,
        {
          x: -30,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: line,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Animate grid items with stagger
    const gridItems = document.querySelectorAll('[data-animate="grid-item"]');
    if (gridItems.length > 0) {
      gsap.fromTo(
        gridItems,
        {
          y: 60,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridItems[0],
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Animate borders/lines
    const lines = document.querySelectorAll('[data-animate="line"]');
    lines.forEach((line) => {
      gsap.fromTo(
        line,
        {
          scaleX: 0,
          transformOrigin: 'left center',
        },
        {
          scaleX: 1,
          duration: 1,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: line,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Parallax effect for images
    const parallaxImages = document.querySelectorAll('[data-animate="parallax"]');
    parallaxImages.forEach((img) => {
      gsap.to(img, {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    // Form section reveal with scale
    const formSection = document.querySelector('[data-animate="form"]');
    if (formSection) {
      gsap.fromTo(
        formSection,
        {
          scale: 0.9,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: formSection,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);
}
