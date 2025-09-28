"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="screen" role="main">
      {/* Brand (top-left) */}
      <div className="brand">NextMove</div>

      {/* Background effects (z-0) */}
      <div className="bg">
        {/* Primary Gradient Circles — 10 layers */}
        {/* 1) Top-left 25%/25% — 384px */}
        <div className="circle c1" />
        {/* 2) Top-right 33% down, 25% from right — 320px */}
        <div className="circle c2" />
        {/* 3) Bottom-left 25% up, 33% right — 288px */}
        <div className="circle c3" />
        {/* 4) Middle-right 50% down, 33% from right — 256px */}
        <div className="circle c4" />
        {/* 5) Bottom-center 33% up, centered — 352px */}
        <div className="circle c5" />
        {/* 6) Bottom-right 75% down, 16% from right — 224px */}
        <div className="circle c6" />
        {/* 7) Bottom area 16% up, 66% from right — 288px */}
        <div className="circle c7" />
        {/* 8) Top-right corner 16% down, 75% right — 256px */}
        <div className="circle c8" />
        {/* 9) Right-middle 66% up, 20% from right — 192px */}
        <div className="circle c9" />
        {/* 10) Left-middle 66% down, 16% right — 320px */}
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
        <h1 className="title">
          What Is Your
          <br />
          Next Move?
        </h1>

        <p className="subtitle">Make Your Next Move the Best One Yet</p>

        <div className="cta">
          <button
            className="startBtn"
            onClick={() => router.push("/intake")}
            aria-label="Start"
          >
            {/* Tiny inline Play icon to avoid extra packages */}
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
        </div>
      </section>

      <style jsx>{`
        /* Global resets to remove any white border/scrollbars */
        :global(html, body) {
          margin: 0;
          padding: 0;
          background: #000;
        }

        .screen {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #000;
          padding-left: 32px; /* px-8 */
          padding-right: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          border: none;
        }

        /* Brand */
        .brand {
          position: absolute;
          top: 32px;
          left: 32px;
          z-index: 20;
          font-family: Forma, "Forma Fallback", Arial, Helvetica, sans-serif;
          font-size: 24px;
          font-weight: 400;
          color: rgb(237, 237, 237);
          text-shadow: 0 10px 25px rgba(147, 197, 253, 0.2); /* blue-300/20 */
        }

        /* Background container */
        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.35; /* overall particle container opacity */
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(64px); /* heavy blur */
        }

        /* 1) Top-left 25%/25% — Blue-300 8% -> Purple-300 6% (diag BR) */
        .c1 {
          width: 384px;
          height: 384px;
          top: 25%;
          left: 25%;
          background: linear-gradient(
            135deg,
            rgba(147, 197, 253, 0.08),
            rgba(196, 181, 253, 0.06)
          );
        }

        /* 2) Top-right 33% down, 25% from right — Indigo-200 10% -> Blue-200 8% (diag BL) */
        .c2 {
          width: 320px;
          height: 320px;
          top: 33%;
          right: 25%;
          background: linear-gradient(
            315deg,
            rgba(199, 210, 254, 0.1),
            rgba(191, 219, 254, 0.08)
          );
        }

        /* 3) Bottom-left 25% up, 33% right — Purple-200 7% -> Violet-200 9% (diag TR) */
        .c3 {
          width: 288px;
          height: 288px;
          bottom: 25%;
          left: 33%;
          background: linear-gradient(
            45deg,
            rgba(196, 181, 253, 0.07),
            rgba(221, 214, 254, 0.09)
          );
        }

        /* 4) Middle-right 50% down, 33% from right — Cyan-200 7% -> Blue-100 8% (diag TL) */
        .c4 {
          width: 256px;
          height: 256px;
          top: 50%;
          right: 33%;
          transform: translateY(-50%);
          background: linear-gradient(
            225deg,
            rgba(165, 243, 252, 0.07),
            rgba(219, 234, 254, 0.08)
          );
        }

        /* 5) Bottom-center 33% up, 50% right — 352px — Slate-200 6% -> Indigo-200 7% (diag BR) */
        .c5 {
          width: 352px;
          height: 352px;
          bottom: 33%;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(
            135deg,
            rgba(226, 232, 240, 0.06),
            rgba(199, 210, 254, 0.07)
          );
        }

        /* 6) Bottom-right 75% down, 16% from right — 224px — Purple-100 8% -> Indigo-100 6% (diag BL) */
        .c6 {
          width: 224px;
          height: 224px;
          top: 75%;
          right: 16%;
          transform: translateY(-50%);
          background: linear-gradient(
            315deg,
            rgba(243, 232, 255, 0.08),
            rgba(224, 231, 255, 0.06)
          );
        }

        /* 7) Bottom area 16% up, 66% from right — 288px — Sky-200 7% -> Blue-200 8% (diag TR) */
        .c7 {
          width: 288px;
          height: 288px;
          bottom: 16%;
          right: 66%;
          background: linear-gradient(
            45deg,
            rgba(186, 230, 253, 0.07),
            rgba(191, 219, 254, 0.08)
          );
        }

        /* 8) Top-right corner 16% down, 75% right — 256px — Violet-200 6% -> Purple-200 7% (diag BL) */
        .c8 {
          width: 256px;
          height: 256px;
          top: 16%;
          left: 75%;
          background: linear-gradient(
            315deg,
            rgba(221, 214, 254, 0.06),
            rgba(196, 181, 253, 0.07)
          );
        }

        /* 9) Right-middle 66% up, 20% from right — 192px — Cyan-100 7% -> Blue-100 6% (diag TR) */
        .c9 {
          width: 192px;
          height: 192px;
          bottom: 66%;
          right: 20%;
          background: linear-gradient(
            45deg,
            rgba(207, 250, 254, 0.07),
            rgba(219, 234, 254, 0.06)
          );
        }

        /* 10) Left-middle 66% down, 16% right — 320px — Indigo-100 8% -> Purple-100 7% (diag BR) */
        .c10 {
          width: 320px;
          height: 320px;
          top: 66%;
          left: 16%;
          transform: translateY(-50%);
          background: linear-gradient(
            135deg,
            rgba(224, 231, 255, 0.08),
            rgba(243, 232, 255, 0.07)
          );
        }

        /* Ambient lighting */
        .ambient {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.04; /* very low */
        }
        /* Center Light: 1200x1200 centered */
        .a1 {
          width: 1200px;
          height: 1200px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(219, 234, 254, 0.05),
            rgba(243, 232, 255, 0.03),
            rgba(0, 0, 0, 0) 70%
          ); /* Blue-100 -> Purple-100 -> transparent */
        }
        /* Upper Light: 800x800 at top-25%, right-50% (i.e., left 50%) */
        .a2 {
          width: 800px;
          height: 800px;
          top: 25%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(224, 231, 255, 0.04),
            rgba(237, 233, 254, 0.02),
            rgba(0, 0, 0, 0) 70%
          ); /* Indigo-100 -> Violet-100 -> transparent */
        }

        /* Particles */
        .p {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          animation: pulse 2s infinite ease-in-out;
          opacity: 0.6; /* 50–70% */
        }
        .p1 {
          width: 4px;
          height: 4px;
          left: 20%;
          top: 30%;
          background: rgba(191, 219, 254, 0.7); /* Blue-200 */
          animation-delay: 0.2s;
        }
        .p2 {
          width: 8px;
          height: 8px;
          left: 72%;
          top: 28%;
          background: rgba(196, 181, 253, 0.7); /* Purple-200 */
          animation-delay: 0.6s;
        }
        .p3 {
          width: 6px;
          height: 6px;
          left: 55%;
          top: 62%;
          background: rgba(165, 243, 252, 0.7); /* Cyan-200 */
          animation-delay: 1s;
        }
        .p4 {
          width: 4px;
          height: 4px;
          left: 35%;
          top: 70%;
          background: rgba(199, 210, 254, 0.7); /* Indigo-200 */
          animation-delay: 0.8s;
        }
        .p5 {
          width: 6px;
          height: 6px;
          left: 15%;
          top: 55%;
          background: rgba(221, 214, 254, 0.7); /* Violet-200 */
          animation-delay: 0.4s;
        }
        .p6 {
          width: 8px;
          height: 8px;
          left: 82%;
          top: 52%;
          background: rgba(186, 230, 253, 0.7); /* Sky-200 */
          animation-delay: 1.2s;
        }
        .p7 {
          width: 4px;
          height: 4px;
          left: 42%;
          top: 18%;
          background: rgba(243, 232, 255, 0.7); /* Purple-100 */
          animation-delay: 1s;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.9;
          }
        }

        /* Content */
        .content {
          position: relative;
          z-index: 10;
          text-align: center;
          user-select: none;
        }

        .title {
          margin: 0;
          font-family: Forma, "Forma Fallback", Arial, Helvetica, sans-serif;
          font-weight: 400;
          font-size: 80px;
          line-height: 1.05; /* leading-tight */
          letter-spacing: -0.02em; /* tracking-tight */
          color: rgb(237, 237, 237);
          text-shadow: 0 12px 28px rgba(196, 181, 253, 0.3); /* purple-300/30 */
        }

        .subtitle {
          margin-top: 32px; /* mt-8 */
          margin-bottom: 48px; /* mb-12 */
          font-family: Geist, Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 19.62px;
          color: rgb(136, 136, 136);
          text-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); /* drop-shadow-lg feel */
        }

        .cta {
          margin-top: 64px; /* mt-16 */
          display: flex;
          justify-content: center;
        }

        /* Button Animation System */
        .startBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px; /* 16px horiz, 8px vert */
          background: rgba(255, 255, 255, 0.9); /* base 90% */
          color: rgb(136, 136, 136);
          font-family: Geist, Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          font-weight: 400;
          border-radius: 8px;
          border: none;               /* remove white border */
          outline: none;              /* remove focus ring */
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          box-shadow: 0 25px 50px rgba(255, 255, 255, 0.2); /* white/20 */
          backdrop-filter: blur(4px); /* paper-like */
          transform-origin: center;
          transform: translateZ(0);
          transition: all 300ms;
        }
        .startBtn:hover {
          transform: scale(1.05) translateY(-4px); /* lift +5%, up 4px */
          background: rgba(255, 255, 255, 1.0);
          box-shadow: 0 30px 60px rgba(255, 255, 255, 0.3); /* white/30 */
        }
        .startBtn:focus-visible {
          outline: 2px solid rgba(191, 219, 254, 0.5); /* subtle accessible ring */
          outline-offset: 2px;
        }

        @media (max-width: 768px) {
          .title {
            font-size: 48px;
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
