"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  // Optional: reduce animation if user prefers reduced motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("prm");
    }
  }, []);

  return (
    <main className="screen" role="main">
      {/* Brand (top-left) */}
      <div className="brand">
        <span className="brandDot" aria-hidden />
        NextMove
      </div>

      {/* Background effects (z-0) */}
      <div className="bg" aria-hidden>
        {/* Noise & subtle grid */}
        <div className="noise" />
        <div className="grid" />

        {/* Primary Gradient Circles — 10 layers */}
        <div className="circle c1" />
        <div className="circle c2" />
        <div className="circle c3" />
        <div className="circle c4" />
        <div className="circle c5" />
        <div className="circle c6" />
        <div className="circle c7" />
        <div className="circle c8" />
        <div className="circle c9" />
        <div className="circle c10" />

        {/* Ambient Lighting Layer */}
        <div className="ambient a1" />
        <div className="ambient a2" />

        {/* Floating Particles (7) */}
        <div className="p p1" />
        <div className="p p2" />
        <div className="p p3" />
        <div className="p p4" />
        <div className="p p5" />
        <div className="p p6" />
        <div className="p p7" />
      </div>

      {/* Main content (z-10) */}
      <section className="content">
        {/* Floating Glass Island */}
        <div className="island">
          <div className="islandShine" aria-hidden />
          <div className="islandEdge" aria-hidden />

          <h1 className="title">
            What Is Your
            <br />
            Next Move?
          </h1>

          <p className="subtitle">Make your next move the best one yet.</p>

          <div className="cta">
            <button
              className="startBtn"
              onClick={() => router.push("/intake")}
              aria-label="Start"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Start</span>
            </button>
            <button
              className="ghostBtn"
              onClick={() => router.push("/about")}
              aria-label="Learn more"
            >
              Learn More
            </button>
          </div>

          {/* Decorative bottom glow */}
          <div className="underGlow" aria-hidden />
        </div>
      </section>

      <style jsx>{`
        /* Global */
        :global(html, body) {
          margin: 0;
          padding: 0;
          background: #000;
          color-scheme: dark;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .screen {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #000;
          padding-left: 32px;
          padding-right: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          border: none;
          isolation: isolate; /* keep blend modes contained */
        }

        /* Brand */
        .brand {
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 20;
          font-family: Forma, "Forma Fallback", Arial, Helvetica, sans-serif;
          font-size: 20px;
          letter-spacing: 0.02em;
          color: rgba(242, 243, 247, 0.9);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.03)
            )
            border-box;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 10px 30px rgba(147, 197, 253, 0.08);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .brandDot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 30%,
            #b3e1ff 0%,
            #c4b5fd 60%,
            #7c3aed 100%
          );
          box-shadow: 0 0 18px rgba(147, 197, 253, 0.6);
        }

        /* Background container */
        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        /* Subtle grid and film grain noise for depth */
        .grid {
          position: absolute;
          inset: -1px;
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.03) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.03) 1px,
              transparent 1px
            );
          background-size: 48px 48px, 48px 48px;
          mask-image: radial-gradient(
            circle at 50% 50%,
            black 0%,
            transparent 70%
          );
          opacity: 0.25;
        }
        .noise {
          position: absolute;
          inset: -1px;
          opacity: 0.12;
          mix-blend-mode: soft-light;
          background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>\
<rect width='120' height='120' filter='url(%23n)' opacity='0.5'/>\
</svg>");
          background-size: 240px 240px;
          animation: noiseShift 8s linear infinite;
        }
        @keyframes noiseShift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-120px, -120px, 0);
          }
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(64px);
          opacity: 0.35;
        }

        .c1 {
          width: 384px;
          height: 384px;
          top: 25%;
          left: 25%;
          background: linear-gradient(
            135deg,
            rgba(147, 197, 253, 0.2),
            rgba(196, 181, 253, 0.12)
          );
        }
        .c2 {
          width: 320px;
          height: 320px;
          top: 33%;
          right: 25%;
          background: linear-gradient(
            315deg,
            rgba(199, 210, 254, 0.18),
            rgba(191, 219, 254, 0.12)
          );
        }
        .c3 {
          width: 288px;
          height: 288px;
          bottom: 25%;
          left: 33%;
          background: linear-gradient(
            45deg,
            rgba(196, 181, 253, 0.15),
            rgba(221, 214, 254, 0.18)
          );
        }
        .c4 {
          width: 256px;
          height: 256px;
          top: 50%;
          right: 33%;
          transform: translateY(-50%);
          background: linear-gradient(
            225deg,
            rgba(165, 243, 252, 0.14),
            rgba(219, 234, 254, 0.14)
          );
        }
        .c5 {
          width: 352px;
          height: 352px;
          bottom: 33%;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(
            135deg,
            rgba(226, 232, 240, 0.12),
            rgba(199, 210, 254, 0.14)
          );
        }
        .c6 {
          width: 224px;
          height: 224px;
          top: 75%;
          right: 16%;
          transform: translateY(-50%);
          background: linear-gradient(
            315deg,
            rgba(243, 232, 255, 0.14),
            rgba(224, 231, 255, 0.12)
          );
        }
        .c7 {
          width: 288px;
          height: 288px;
          bottom: 16%;
          right: 66%;
          background: linear-gradient(
            45deg,
            rgba(186, 230, 253, 0.14),
            rgba(191, 219, 254, 0.14)
          );
        }
        .c8 {
          width: 256px;
          height: 256px;
          top: 16%;
          left: 75%;
          background: linear-gradient(
            315deg,
            rgba(221, 214, 254, 0.12),
            rgba(196, 181, 253, 0.14)
          );
        }
        .c9 {
          width: 192px;
          height: 192px;
          bottom: 66%;
          right: 20%;
          background: linear-gradient(
            45deg,
            rgba(207, 250, 254, 0.14),
            rgba(219, 234, 254, 0.12)
          );
        }
        .c10 {
          width: 320px;
          height: 320px;
          top: 66%;
          left: 16%;
          transform: translateY(-50%);
          background: linear-gradient(
            135deg,
            rgba(224, 231, 255, 0.14),
            rgba(243, 232, 255, 0.12)
          );
        }

        /* Ambient lighting */
        .ambient {
          position: absolute;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.06;
        }
        .a1 {
          width: 1200px;
          height: 1200px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(219, 234, 254, 0.08),
            rgba(243, 232, 255, 0.04),
            rgba(0, 0, 0, 0) 70%
          );
        }
        .a2 {
          width: 900px;
          height: 900px;
          top: 22%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(224, 231, 255, 0.07),
            rgba(237, 233, 254, 0.03),
            rgba(0, 0, 0, 0) 70%
          );
        }

        /* Particles (gentle drift + twinkle) */
        .p {
          position: absolute;
          border-radius: 50%;
          filter: blur(0.8px);
          opacity: 0.75;
          animation: drift 12s ease-in-out infinite, twinkle 3.6s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .p1 {
          width: 4px;
          height: 4px;
          left: 20%;
          top: 30%;
          background: rgba(191, 219, 254, 0.9);
          animation-delay: 0.2s, 0.2s;
        }
        .p2 {
          width: 8px;
          height: 8px;
          left: 72%;
          top: 28%;
          background: rgba(196, 181, 253, 0.9);
          animation-delay: 0.6s, 0.4s;
        }
        .p3 {
          width: 6px;
          height: 6px;
          left: 55%;
          top: 62%;
          background: rgba(165, 243, 252, 0.9);
          animation-delay: 1s, 0.6s;
        }
        .p4 {
          width: 4px;
          height: 4px;
          left: 35%;
          top: 70%;
          background: rgba(199, 210, 254, 0.9);
          animation-delay: 0.8s, 0.1s;
        }
        .p5 {
          width: 6px;
          height: 6px;
          left: 15%;
          top: 55%;
          background: rgba(221, 214, 254, 0.9);
          animation-delay: 0.4s, 0.8s;
        }
        .p6 {
          width: 8px;
          height: 8px;
          left: 82%;
          top: 52%;
          background: rgba(186, 230, 253, 0.9);
          animation-delay: 1.2s, 0.5s;
        }
        .p7 {
          width: 4px;
          height: 4px;
          left: 42%;
          top: 18%;
          background: rgba(243, 232, 255, 0.9);
          animation-delay: 1s, 0.7s;
        }

        @keyframes drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(8px, -6px, 0) scale(1.1);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.6;
            filter: blur(1px);
          }
          50% {
            opacity: 1;
            filter: blur(0.4px);
          }
        }

        /* Content */
        .content {
          position: relative;
          z-index: 10;
          display: grid;
          place-items: center;
          width: 100%;
        }

        /* Glass Island */
        .island {
          position: relative;
          max-width: 920px;
          width: 100%;
          padding: 48px 40px 56px;
          text-align: center;
          border-radius: 28px;
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.04)
            ),
            rgba(8, 8, 12, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(22px) saturate(120%);
          box-shadow: 0 30px 80px rgba(93, 76, 219, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transform: translateZ(0); /* GPU hint */
        }

        /* Subtle moving shimmer */
        .islandShine {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 28px;
          background: radial-gradient(
              1200px 300px at 10% -40%,
              rgba(255, 255, 255, 0.08),
              transparent 60%
            ),
            radial-gradient(
              1000px 400px at 90% -20%,
              rgba(147, 197, 253, 0.06),
              transparent 70%
            );
          mask-image: linear-gradient(180deg, white, transparent 70%);
          opacity: 0.55;
          animation: shine 12s ease-in-out infinite;
        }
        @keyframes shine {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }

        /* Iridescent edge (gradient border illusion) */
        .islandEdge {
          pointer-events: none;
          position: absolute;
          inset: -1px;
          border-radius: 30px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(191, 219, 254, 0.35),
            rgba(196, 181, 253, 0.3),
            rgba(124, 58, 237, 0.25)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .title {
          margin: 0;
          font-family: Forma, "Forma Fallback", Arial, Helvetica, sans-serif;
          font-weight: 400;
          font-size: 76px;
          line-height: 1.04;
          letter-spacing: -0.02em;
          color: rgba(244, 245, 248, 0.98);
          text-shadow: 0 18px 40px rgba(196, 181, 253, 0.28);
        }

        .subtitle {
          margin-top: 20px;
          font-family: Geist, Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 18px;
          color: rgba(190, 195, 208, 0.9);
          letter-spacing: 0.01em;
        }

        .cta {
          margin-top: 36px;
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Primary glass button */
        .startBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.12),
              rgba(255, 255, 255, 0.06)
            ),
            rgba(255, 255, 255, 0.04);
          color: rgba(244, 245, 248, 0.95);
          font-family: Geist, Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          font-weight: 500;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          box-shadow: 0 20px 50px rgba(147, 197, 253, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(10px);
          transform-origin: center;
          transform: translateZ(0);
          transition: transform 260ms, box-shadow 260ms, background 260ms,
            border-color 260ms;
        }
        .startBtn:hover {
          transform: translateY(-3px) scale(1.02);
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.16),
              rgba(255, 255, 255, 0.08)
            ),
            rgba(255, 255, 255, 0.06);
          border-color: rgba(191, 219, 254, 0.4);
          box-shadow: 0 26px 70px rgba(147, 197, 253, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .startBtn:focus-visible {
          outline: 2px solid rgba(191, 219, 254, 0.55);
          outline-offset: 2px;
        }

        /* Secondary ghost button */
        .ghostBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          font-family: Geist, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(6px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: transform 240ms, border-color 240ms, background 240ms;
        }
        .ghostBtn:hover {
          transform: translateY(-2px);
          border-color: rgba(221, 214, 254, 0.35);
          background: rgba(255, 255, 255, 0.04);
        }

        /* Under island glow to sell "floating" */
        .underGlow {
          position: absolute;
          left: 50%;
          bottom: -28px;
          transform: translateX(-50%);
          width: 62%;
          height: 40px;
          background: radial-gradient(
            60% 100% at 50% 0%,
            rgba(147, 197, 253, 0.22),
            rgba(0, 0, 0, 0) 70%
          );
          filter: blur(10px);
          opacity: 0.55;
        }

        /* Prefers reduced motion: dampen animations */
        :global(.prm) .p,
        :global(.prm) .islandShine,
        :global(.prm) .noise {
          animation: none !important;
        }

        @media (max-width: 900px) {
          .island {
            padding: 36px 24px 44px;
            border-radius: 24px;
          }
          .islandShine,
          .islandEdge {
            border-radius: 24px;
          }
          .title {
            font-size: 44px;
            line-height: 1.1;
          }
          .subtitle {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}

