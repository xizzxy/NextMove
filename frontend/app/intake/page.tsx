"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {pages} from "next/dist/build/templates/app-page";
import Link from "next/link";

type Career =
  | "Software Engineer"
  | "Data Scientist"
  | "Data Analyst"
  | "Product Manager"
  | "UX Designer"
  | "Marketing"
  | "Sales"
  | "Operations";

const CAREERS: Career[] = [
  "Software Engineer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "UX Designer",
  "Marketing",
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

    setLoading(true);
    try {
      const creditNum = Number(credit);
      const band = scoreToBand(creditNum);

      const interests = [...lifestyle.split(","), ...hobbies.split(",")]
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        city: location.trim(),
        budget: Number(budget),
        credit_band: band,
        interests,
        salary: 0,
        career_path: career,
      };

      const res = await fetch(`${backend}/api/plan_move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data = await res.json();

      sessionStorage.setItem(
        "nextmove_result",
        JSON.stringify({
          profile: {
            name,
            location,
            lifestyle,
            hobbies,
            career,
            experience,
            budget,
            credit,
          },
          data,
        })
      );

      router.push("/results");
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="screen" role="main">
      {/* Brand */}
      <Link href="/"><div className="brand">NextMove</div></Link>

      {/* Background effects */}
      <div className="bg">
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
                setExperience(e.target.value === "" ? "" : Number(e.target.value))
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
      </section>

      <style jsx>{`
        :global(html, body) {
          margin: px;
          padding: 0;
          background: #000;
        }
        
        .screen {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        /* Brand (Forma at 24px) */
        .brand {
          position: absolute;
          top: 32px;
          left: 32px;
          z-index: 20;
          font-family: "Forma", "Forma Fallback", Arial, Helvetica, sans-serif;
          font-size: 24px;
          font-weight: 400;
          color: rgb(237, 237, 237);
          text-shadow: 0 10px 25px rgba(147, 197, 253, 0.2); /* blue-300/20 */
        }

        /* Background container + particles */
        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.35; /* container opacity for particles */
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(64px); /* blur-3xl */
        }

        /* 10 gradient circles — low-opacity cool hues */
        .b1 {
          width: 384px;
          height: 384px;
          top: 22%;
          left: 18%;
          background: radial-gradient(
            circle at bottom right,
            rgba(147, 197, 253, 0.08),
            rgba(196, 181, 253, 0.06)
          );
        }
        .b2 {
          width: 320px;
          height: 320px;
          top: 28%;
          right: 20%;
          background: radial-gradient(
            circle at bottom left,
            rgba(199, 210, 254, 0.1),
            rgba(191, 219, 254, 0.08)
          );
        }
        .b3 {
          width: 288px;
          height: 288px;
          bottom: 22%;
          left: 26%;
          background: radial-gradient(
            circle at top right,
            rgba(196, 181, 253, 0.07),
            rgba(221, 214, 254, 0.09)
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
            rgba(165, 243, 252, 0.07),
            rgba(219, 234, 254, 0.08)
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
            rgba(226, 232, 240, 0.06),
            rgba(199, 210, 254, 0.07)
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
            rgba(243, 232, 255, 0.08),
            rgba(224, 231, 255, 0.06)
          );
        }
        .b7 {
          width: 288px;
          height: 288px;
          bottom: 14%;
          right: 60%;
          background: radial-gradient(
            circle at top right,
            rgba(186, 230, 253, 0.07),
            rgba(191, 219, 254, 0.08)
          );
        }
        .b8 {
          width: 256px;
          height: 256px;
          top: 14%;
          left: 70%;
          background: radial-gradient(
            circle at bottom left,
            rgba(221, 214, 254, 0.06),
            rgba(196, 181, 253, 0.07)
          );
        }
        .b9 {
          width: 192px;
          height: 192px;
          bottom: 62%;
          right: 18%;
          background: radial-gradient(
            circle at top right,
            rgba(207, 250, 254, 0.07),
            rgba(219, 234, 254, 0.06)
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
            rgba(224, 231, 255, 0.08),
            rgba(243, 232, 255, 0.07)
          );
        }

        /* Ambient lights */
        .ambient {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.04;
        }
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
            transparent 70%
          );
        }
        .a2 {
          width: 800px;
          height: 800px;
          top: 18%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(224, 231, 255, 0.04),
            rgba(237, 233, 254, 0.02),
            transparent 70%
          );
        }

        /* Particles */
        .p {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          animation: pulse 2s infinite ease-in-out;
          opacity: 0.6;
        }
        .p1 {
          width: 4px;
          height: 4px;
          left: 20%;
          top: 30%;
          background: rgba(191, 219, 254, 0.7); /* blue-200 */
          animation-delay: 0.2s;
        }
        .p2 {
          width: 8px;
          height: 8px;
          left: 72%;
          top: 28%;
          background: rgba(196, 181, 253, 0.7); /* purple-200 */
          animation-delay: 0.6s;
        }
        .p3 {
          width: 6px;
          height: 6px;
          left: 55%;
          top: 62%;
          background: rgba(165, 243, 252, 0.7); /* cyan-200 */
          animation-delay: 1s;
        }
        .p4 {
          width: 4px;
          height: 4px;
          left: 35%;
          top: 70%;
          background: rgba(199, 210, 254, 0.7); /* indigo-200 */
          animation-delay: 0.8s;
        }
        .p5 {
          width: 6px;
          height: 6px;
          left: 15%;
          top: 55%;
          background: rgba(221, 214, 254, 0.7); /* violet-200 */
          animation-delay: 0.4s;
        }
        .p6 {
          width: 8px;
          height: 8px;
          left: 82%;
          top: 52%;
          background: rgba(186, 230, 253, 0.7); /* sky-200 */
          animation-delay: 1.2s;
        }
        .p7 {
          width: 4px;
          height: 4px;
          left: 42%;
          top: 18%;
          background: rgba(243, 232, 255, 0.7); /* purple-100 */
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

        /* Container + header */
        .container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 672px; /* max-w-2xl */
          padding: 64px 32px; /* py-16 px-8 */
          margin: 0 auto;
        }

        .header {
          text-align: left;
          margin-bottom: 24px;
        }

        .title {
          margin: 0;
          font-family: "Forma", "Forma Fallback", Arial, Helvetica, sans-serif;
          font-weight: 400;
          font-size: 48px;
          line-height: 1.15;
          color: rgb(237, 237, 237);
          text-shadow: 0 12px 28px rgba(196, 181, 253, 0.3); /* purple-300/30 */
        }

        .subtitle {
          margin-top: 12px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 19.62px;
          color: rgb(136, 136, 136);
          text-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); /* drop-shadow-lg */
        }

        /* Form grid: 1col mobile, 2col md */
        .form {
          display: grid;
          row-gap: 24px; /* space-y-6 / gap-6 */
          column-gap: 128px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .form {
            grid-template-columns: 1fr 1fr; /* md:grid-cols-2 */
          }
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: rgb(237, 237, 237);
          margin-bottom: 8px; /* mb-2 */
          text-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); /* drop-shadow-lg */
        }

        .req {
          color: #ef4444;
        }

        .input {
          width: 100%;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: rgb(237, 237, 237);
          padding: 12px 16px; /* py-3 px-4 */
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.1); /* bg-white/10 */
          backdrop-filter: blur(6px);
          outline: none;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.35); /* shadow-lg */
          transition: background 200ms ease, border-color 200ms ease,
            box-shadow 200ms ease, transform 150ms ease;
        }
        .input:hover {
          background: rgba(255, 255, 255, 0.15); /* bg-white/15 */
          box-shadow: 0 10px 15px rgba(255, 255, 255, 0.1); /* hover white/10 */
        }
        .input:focus {
          background: rgba(255, 255, 255, 0.2); /* bg-white/20 */
          border-color: rgba(255, 255, 255, 0.4); /* border-white/40 */
          box-shadow: 0 10px 20px rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }
        .select {
          appearance: none;
          background-image: linear-gradient(
              45deg,
              transparent 50%,
              rgba(237, 237, 237, 0.7) 50%
            ),
            linear-gradient(
              135deg,
              rgba(237, 237, 237, 0.7) 50%,
              transparent 50%
            );
          background-position: calc(100% - 18px) calc(1em + 2px),
            calc(100% - 13px) calc(1em + 2px);
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
        }

        .helper {
          display: block;
          margin-top: 6px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 12px; /* small helper text */
          color: rgb(136, 136, 136);
        }

        .status {
          grid-column: 1 / -1;
          padding: 12px 16px;
          border-radius: 10px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          backdrop-filter: blur(6px);
        }
        
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          /* display: none; <- Crashes Chrome on hover */
          -webkit-appearance: none;
          margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
        }

        input[type=number] {
          -moz-appearance:textfield; /* Firefox */
        }
        .status.error {
          background: rgba(239, 68, 68, 0.2); /* bg-red-500/20 */
          border: 1px solid rgba(239, 68, 68, 0.4); /* border-red-500/40 */
          color: #ef4444; /* error text */
        }

        .actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .submit {
          padding: 16px 32px; /* py-4 px-8 */
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: rgb(136, 136, 136);
          background: rgba(255, 255, 255, 0.9); /* bg-white/90 */
          box-shadow: 0 25px 50px rgba(255, 255, 255, 0.2); /* shadow-2xl white/20 */
          backdrop-filter: blur(4px);
          transform-origin: center;
          transition: all 300ms;
        }
        .submit:hover {
          transform: scale(1.05) translateY(-1px); /* hover:-translate-y-1 */
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 30px 60px rgba(255, 255, 255, 0.3); /* hover white/30 */
        }
        .submit:disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .reset {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: rgb(237, 237, 237);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          font-weight: 400;
          transition: background 200ms ease, border-color 200ms ease,
            transform 150ms ease;
        }
        .reset:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .title {
            font-size: 36px;
          }
        }
      `}</style>
    </main>
  );
}
