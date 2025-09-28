"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

type Career =
  | "Software Engineer"
  | "Frontend Engineer"
  | "Backend Engineer"
  | "Data Scientist"
  | "Data Analyst"
  | "Product Manager"
  | "UX/UI Designer"
  | "Marketing Specialist"
  | "DevOps Engineer"
  | "Business Analyst"
  | "QA Engineer"
  | "Sales"
  | "Operations";

const CAREERS: Career[] = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "UX/UI Designer",
  "Marketing Specialist",
  "DevOps Engineer",
  "Business Analyst",
  "QA Engineer",
  "Sales",
  "Operations",
];

// map 3-digit credit score -> band your backend expects
function scoreToBand(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 740) return "excellent";
  if (score >= 670) return "good";
  if (score >= 580) return "fair";
  return "poor";
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export default function IntakePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState(""); // city, state
  const [lifestyle, setLifestyle] = useState(""); // comma list
  const [hobbies, setHobbies] = useState(""); // comma list
  const [career, setCareer] = useState<Career>("Software Engineer");
  const [experience, setExperience] = useState<number | "">(""); // years
  const [budget, setBudget] = useState<number | "">(""); // monthly USD
  const [credit, setCredit] = useState<string>(""); // 3 digits

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backend) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }

  // Prefill form from sessionStorage if returning from results
  useEffect(() => {
    const savedData = sessionStorage.getItem("nextmove_result");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const profile = parsed.profile;
        if (profile) {
          if (profile.name) setName(profile.name);
          if (profile.location) setLocation(profile.location);
          if (profile.lifestyle) setLifestyle(profile.lifestyle);
          if (profile.hobbies) setHobbies(profile.hobbies);
          if (profile.career) setCareer(profile.career);
          if (profile.experience !== "" && profile.experience !== undefined)
            setExperience(profile.experience);
          if (profile.budget !== "" && profile.budget !== undefined)
            setBudget(profile.budget);
          if (profile.credit) setCredit(profile.credit);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  const valid = useMemo(() => {
    const creditOk = /^\d{3}$/.test(String(credit || ""));
    const budgetOk = String(budget) !== "" && Number(budget) >= 0;
    const locationOk = location.trim().length > 0;
    return creditOk && budgetOk && locationOk;
  }, [credit, budget, location]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!valid) {
      setErr("Please fill all required fields correctly.");
      return;
    }

    const creditNum = Number(credit);
    const band = scoreToBand(creditNum);

    const interests = [...lifestyle.split(","), ...hobbies.split(",")]
      .map((s) => s.trim())
      .filter(Boolean);

    const profile = {
      name,
      location,
      lifestyle,
      hobbies,
      career,
      experience,
      budget,
      credit,
    };

    // Save profile data immediately and navigate to show loading state
    sessionStorage.setItem(
      "nextmove_result",
      JSON.stringify({
        profile,
        data: null, // Will be filled by results page
        loading: true,
      })
    );

    // Navigate immediately to show loading state
    router.push("/results");

    // Continue with fetch in background
    setLoading(true);

    const controller = new AbortController();

    try {
      const body = {
        city: location.trim(),
        budget: Number(budget),
        credit_score: creditNum,
        credit_band: band,
        interests,
        salary: 0,
        career_path: career,
        ...(experience !== "" && { experience_years: Number(experience) }),
      };

      const url = joinUrl(backend!, "/api/plan_move");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();

      // Update sessionStorage with actual results
      sessionStorage.setItem(
        "nextmove_result",
        JSON.stringify({
          profile,
          data,
          loading: false,
        })
      );
    } catch (e: any) {
      // Handle errors
      sessionStorage.setItem(
        "nextmove_result",
        JSON.stringify({
          profile,
          data: null,
          loading: false,
          error: e.message || "Something went wrong",
        })
      );
    }
  }

  return (
    <main className="screen" role="main">
      {/* Brand */}
      <div className="brand">
        <span className="brandDot" aria-hidden />
        NextMove
      </div>

      {/* Background effects */}
      <div className="bg" aria-hidden>
        <div className="noise" />
        <div className="grid" />

        {/* 10 gradient circles */}
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
        <div className="blob b5" />
        <div className="blob b6" />
        <div className="blob b7" />
        <div className="blob b8" />
        <div className="blob b9" />
        <div className="blob b10" />

        {/* Ambient lighting */}
        <div className="ambient a1" />
        <div className="ambient a2" />

        {/* Floating particles */}
        <div className="p p1" />
        <div className="p p2" />
        <div className="p p3" />
        <div className="p p4" />
        <div className="p p5" />
        <div className="p p6" />
        <div className="p p7" />
      </div>

      {/* Content */}
      <section className="container">
        {/* Glass island wrapper for the form area */}
        <div className="island">
          <div className="islandShine" aria-hidden />
          <div className="islandEdge" aria-hidden />

          <header className="header">
            <h1 className="title">Tell Us About You</h1>
            <p className="subtitle">
              Help us create the perfect plan for your next move.
            </p>
          </header>

          <form className="form" onSubmit={onSubmit} noValidate>
            {/* Name */}
            <div className="field">
              <label className="label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                type="text"
              />
            </div>

            {/* Location (required) */}
            <div className="field">
              <label className="label" htmlFor="location">
                Location <span className="req">*</span>
              </label>
              <input
                id="location"
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State (e.g., Houston, TX)"
                required
                type="text"
              />
            </div>

            {/* Lifestyle */}
            <div className="field">
              <label className="label" htmlFor="lifestyle">
                Lifestyle (comma separated)
              </label>
              <input
                id="lifestyle"
                className="input"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                placeholder="vegan, nightlife, gym"
                type="text"
              />
            </div>

            {/* Hobbies */}
            <div className="field">
              <label className="label" htmlFor="hobbies">
                Hobbies (comma separated)
              </label>
              <input
                id="hobbies"
                className="input"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="climbing, painting, yoga"
                type="text"
              />
            </div>

            {/* Career (required) */}
            <div className="field">
              <label className="label" htmlFor="career">
                Career <span className="req">*</span>
              </label>
              <select
                id="career"
                className="input select"
                value={career}
                onChange={(e) => setCareer(e.target.value as Career)}
                required
              >
                {CAREERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div className="field">
              <label className="label" htmlFor="experience">
                Experience (years)
              </label>
              <input
                id="experience"
                className="input"
                type="number"
                min={0}
                value={experience}
                onChange={(e) =>
                  setExperience(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g., 2"
              />
            </div>

            {/* Budget (required) */}
            <div className="field">
              <label className="label" htmlFor="budget">
                Budget (monthly USD) <span className="req">*</span>
              </label>
              <input
                id="budget"
                className="input"
                type="number"
                min={0}
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g., 1800"
                required
              />
            </div>

            {/* Credit (required) */}
            <div className="field">
              <label className="label" htmlFor="credit">
                Credit score (3 digits) <span className="req">*</span>
              </label>
              <input
                id="credit"
                className="input"
                inputMode="numeric"
                pattern="\d{3}"
                maxLength={3}
                value={credit}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setCredit(v);
                }}
                placeholder="e.g., 720"
                required
              />
              <small className="helper">
                We convert this to a band (excellent / good / fair / poor).
              </small>
            </div>

            {/* Error */}
            {err && (
              <div className="status error" role="alert">
                {err}
              </div>
            )}

            {/* Submit */}
            <div className="actions">
              <button
                className="submit"
                type="submit"
                disabled={!valid || loading}
                aria-busy={loading ? "true" : "false"}
              >
                {loading ? "Working…" : "Generate my plan"}
              </button>
              <button
                className="reset"
                type="button"
                onClick={() => {
                  setName("");
                  setLocation("");
                  setLifestyle("");
                  setHobbies("");
                  setCareer("Software Engineer");
                  setExperience("");
                  setBudget("");
                  setCredit("");
                  setErr(null);
                }}
              >
                Reset
              </button>
            </div>
          </form>

          {/* Decorative bottom glow */}
          <div className="underGlow" aria-hidden />
        </div>
      </section>

      <style jsx>{`
        /* Keep your margin requirement */
        :global(html, body) {
          margin: 9px;
          padding: 0;
          background: #000;
          color-scheme: dark;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .screen {
          min-height: calc(100vh - 18px); /* account for 9px margin top+bottom */
          width: calc(100% - 18px); /* account for 9px margin left+right */
          position: relative;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          isolation: isolate;
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

        /* Background */
        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

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
<rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>");
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

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(64px);
          opacity: 0.35;
        }

        .b1 {
          width: 384px;
          height: 384px;
          top: 22%;
          left: 18%;
          background: radial-gradient(
            circle at bottom right,
            rgba(147, 197, 253, 0.2),
            rgba(196, 181, 253, 0.12)
          );
        }
        .b2 {
          width: 320px;
          height: 320px;
          top: 28%;
          right: 20%;
          background: radial-gradient(
            circle at bottom left,
            rgba(199, 210, 254, 0.18),
            rgba(191, 219, 254, 0.12)
          );
        }
        .b3 {
          width: 288px;
          height: 288px;
          bottom: 22%;
          left: 26%;
          background: radial-gradient(
            circle at top right,
            rgba(196, 181, 253, 0.15),
            rgba(221, 214, 254, 0.18)
          );
        }
        .b4 {
          width: 256px;
          height: 256px;
          top: 50%;
          right: 28%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at top left,
            rgba(165, 243, 252, 0.14),
            rgba(219, 234, 254, 0.14)
          );
        }
        .b5 {
          width: 352px;
          height: 352px;
          bottom: 28%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle at bottom right,
            rgba(226, 232, 240, 0.12),
            rgba(199, 210, 254, 0.14)
          );
        }
        .b6 {
          width: 224px;
          height: 224px;
          top: 72%;
          right: 14%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at bottom left,
            rgba(243, 232, 255, 0.14),
            rgba(224, 231, 255, 0.12)
          );
        }
        .b7 {
          width: 288px;
          height: 288px;
          bottom: 14%;
          right: 60%;
          background: radial-gradient(
            circle at top right,
            rgba(186, 230, 253, 0.14),
            rgba(191, 219, 254, 0.14)
          );
        }
        .b8 {
          width: 256px;
          height: 256px;
          top: 14%;
          left: 70%;
          background: radial-gradient(
            circle at bottom left,
            rgba(221, 214, 254, 0.12),
            rgba(196, 181, 253, 0.14)
          );
        }
        .b9 {
          width: 192px;
          height: 192px;
          bottom: 62%;
          right: 18%;
          background: radial-gradient(
            circle at top right,
            rgba(207, 250, 254, 0.14),
            rgba(219, 234, 254, 0.12)
          );
        }
        .b10 {
          width: 320px;
          height: 320px;
          top: 62%;
          left: 14%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at bottom right,
            rgba(224, 231, 255, 0.14),
            rgba(243, 232, 255, 0.12)
          );
        }

        /* Ambient lights */
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
          top: 18%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(224, 231, 255, 0.07),
            rgba(237, 233, 254, 0.03),
            rgba(0, 0, 0, 0) 70%
          );
        }

        /* Particles */
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

        /* Container (keep your max-width and paddings) */
        .container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 672px; /* keep */
          padding: 64px 32px; /* keep */
          margin: 0 auto;
        }

        /* Glass island for the form */
        .island {
          position: relative;
          width: 100%;
          padding: 32px 24px 40px;
          border-radius: 24px;
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.04)
            ),
            rgba(8, 8, 12, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(22px) saturate(120%);
          box-shadow: 0 24px 64px rgba(93, 76, 219, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .islandShine {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: radial-gradient(
              800px 240px at 10% -40%,
              rgba(255, 255, 255, 0.08),
              transparent 60%
            ),
            radial-gradient(
              700px 320px at 90% -20%,
              rgba(147, 197, 253, 0.06),
              transparent 70%
            );
          mask-image: linear-gradient(180deg, white, transparent 70%);
          opacity: 0.55;
          animation: shine 12s ease-in-out infinite;
        }
        .islandEdge {
          pointer-events: none;
          position: absolute;
          inset: -1px;
          border-radius: 26px;
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
        @keyframes shine {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }

        .header {
          text-align: left;
          margin-bottom: 24px;
        }

        .title {
          margin: 0;
          font-family: "Forma", "Forma Fallback", Arial, Helvetica, sans-serif;
          font-weight: 400;
          font-size: 48px; /* keep */
          line-height: 1.15;
          color: rgba(244, 245, 248, 0.98);
          text-shadow: 0 12px 28px rgba(196, 181, 253, 0.28);
        }

        .subtitle {
          margin-top: 12px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 19.62px; /* keep */
          color: rgba(190, 195, 208, 0.9);
          text-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        /* Form grid: 1col mobile, 2col md */
        .form {
          display: grid;
          gap: 24px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .form {
            grid-template-columns: 1fr 1fr;
            gap: 24px 20px;
          }
          .field:nth-last-child(2) {
            grid-column: 1 / -1;
          }
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: rgba(244, 245, 248, 0.98);
          text-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .req {
          color: #ef4444;
        }

        .input {
          width: 100%;
          max-width: 100%;
          height: 48px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 15px;
          color: rgba(244, 245, 248, 0.98);
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.12),
              rgba(255, 255, 255, 0.06)
            ),
            rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14),
            0 10px 18px rgba(147, 197, 253, 0.12);
          transition: transform 160ms ease, box-shadow 180ms ease,
            background 180ms ease, border-color 180ms ease;
          display: flex;
          align-items: center;
        }
        .input:hover {
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.16),
              rgba(255, 255, 255, 0.08)
            ),
            rgba(255, 255, 255, 0.06);
          border-color: rgba(191, 219, 254, 0.3);
          box-shadow: 0 12px 22px rgba(147, 197, 253, 0.18);
        }
        .input:focus {
          border-color: rgba(191, 219, 254, 0.45);
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.18),
              rgba(255, 255, 255, 0.1)
            ),
            rgba(255, 255, 255, 0.07);
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(147, 197, 253, 0.22);
        }

        .select {
          appearance: none;
          background-image: linear-gradient(
              45deg,
              transparent 50%,
              rgba(237, 237, 237, 0.8) 50%
            ),
            linear-gradient(
              135deg,
              rgba(237, 237, 237, 0.8) 50%,
              transparent 50%
            );
          background-position: calc(100% - 18px) center,
            calc(100% - 13px) center;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          padding-right: 40px;
        }
        .select option {
          background: #0f1115;
          color: #ededed;
          padding: 8px 12px;
        }

        .helper {
          display: block;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 12px;
          color: rgba(190, 195, 208, 0.9);
        }

        .status {
          grid-column: 1 / -1;
          padding: 12px 16px;
          border-radius: 12px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          backdrop-filter: blur(6px);
        }
        .status.error {
          background: rgba(239, 68, 68, 0.18);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #ef4444;
        }

        .actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .submit {
          padding: 16px 32px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          cursor: pointer;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: rgba(244, 245, 248, 0.95);
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.16),
              rgba(255, 255, 255, 0.08)
            ),
            rgba(255, 255, 255, 0.06);
          box-shadow: 0 25px 50px rgba(147, 197, 253, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(10px);
          transform-origin: center;
          transition: transform 240ms, box-shadow 240ms, background 240ms,
            border-color 240ms;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .submit:hover {
          transform: translateY(-2px) scale(1.02);
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.2),
              rgba(255, 255, 255, 0.1)
            ),
            rgba(255, 255, 255, 0.07);
          border-color: rgba(191, 219, 254, 0.4);
          box-shadow: 0 30px 64px rgba(147, 197, 253, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .submit:disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .reset {
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(244, 245, 248, 0.95);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 160ms, background 180ms, border-color 180ms;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
        }
        .reset:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(221, 214, 254, 0.35);
        }

        .underGlow {
          position: absolute;
          left: 50%;
          bottom: -26px;
          transform: translateX(-50%);
          width: 62%;
          height: 36px;
          background: radial-gradient(
            60% 100% at 50% 0%,
            rgba(147, 197, 253, 0.22),
            rgba(0, 0, 0, 0) 70%
          );
          filter: blur(10px);
          opacity: 0.55;
        }

        @media (min-width: 768px) {
          .field {
            max-width: 100%;
          }
          .input {
            max-width: 280px; /* keep your control width guard */
          }
        }

        @media (max-width: 768px) {
          .title {
            font-size: 36px; /* keep */
          }
        }
      `}</style>
    </main>
  );
}
