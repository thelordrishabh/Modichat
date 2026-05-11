import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function GlobalExperience() {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2
    });
    let frameId;
    const raf = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const cursor = document.querySelector(".lux-cursor");
    const halo = document.querySelector(".lux-cursor-halo");
    if (!cursor || !halo) return undefined;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let haloX = x;
    let haloY = y;
    let rafId;

    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      cursor.style.opacity = "1";
      halo.style.opacity = "1";
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      const spark = document.createElement("span");
      spark.className = "cursor-spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 650);
    };

    const tick = () => {
      haloX += (x - haloX) * 0.14;
      haloY += (y - haloY) * 0.14;
      halo.style.transform = `translate3d(${haloX}px, ${haloY}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(tick);
    };

    const click = (event) => {
      const ripple = document.createElement("span");
      ripple.className = "screen-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 900);
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerdown", click);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", click);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".scroll-reveal").forEach((element, index) => {
        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            y: 56,
            rotateX: index % 2 ? -10 : 10,
            transformPerspective: 1100
          },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true
            }
          }
        );
      });

      gsap.utils.toArray(".parallax-depth").forEach((element) => {
        gsap.to(element, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8
          }
        });
      });

      gsap.utils.toArray(".magnetic-link").forEach((element) => {
        const move = (event) => {
          const rect = element.getBoundingClientRect();
          gsap.to(element, {
            x: (event.clientX - rect.left - rect.width / 2) * 0.18,
            y: (event.clientY - rect.top - rect.height / 2) * 0.18,
            duration: 0.35,
            ease: "power3.out"
          });
        };
        const leave = () => gsap.to(element, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.35)" });
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", leave);
      });
    });

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <>
      <div className="aurora-stage" aria-hidden="true">
        <div className="aurora-ribbon aurora-ribbon-a" />
        <div className="aurora-ribbon aurora-ribbon-b" />
        <div className="aurora-ribbon aurora-ribbon-c" />
        <div className="aurora-grid" />
      </div>
      <div className="lux-noise" aria-hidden="true" />
      <div className="lux-cursor" aria-hidden="true" />
      <div className="lux-cursor-halo" aria-hidden="true" />
    </>
  );
}
