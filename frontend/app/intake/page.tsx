"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const [location, setLocation] = useState("");              // city, state
  const [lifestyle, setLifestyle] = useState("");            // comma list
  const [hobbies, setHobbies] = useState("");                // comma list
  const [career, setCareer] = useState<Career>("Software Engineer");
  const [experience, setExperience] = useState<number | "">(""); // years
  const [budget, setBudget] = useState<number | "">("");     // monthly USD
  const [credit, setCredit] = useState<string>("");          // must be 3 digits

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

      const interests = [
        ...lifestyle.split(","),
        ...hobbies.split(","),
      ]
        .map((s) => s.trim())
        .filter(Boolean);

      // You didn’t request salary; we’ll pass 0 (your backend handles it fine).
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
        JSON.stringify({ profile: { name, location, lifestyle, hobbies, career, experience, budget, credit }, data })
      );

      router.push("/results");
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>Tell us about you</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.9rem" }}>
        <div>
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="btn"
            placeholder="Your name"
          />
        </div>

        <div>
          <label>Location <span style={{ color: "crimson" }}>*</span></label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="btn"
            placeholder="City, State (e.g., Houston, TX)"
            required
          />
        </div>

        <div>
          <label>Lifestyle (comma separated)</label>
          <input
            value={lifestyle}
            onChange={(e) => setLifestyle(e.target.value)}
            className="btn"
            placeholder="vegan, nightlife, gym"
          />
        </div>

        <div>
          <label>Hobbies (comma separated)</label>
          <input
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            className="btn"
            placeholder="climbing, painting, yoga"
          />
        </div>

        <div>
          <label>Career <span style={{ color: "crimson" }}>*</span></label>
          <select value={career} onChange={(e) => setCareer(e.target.value as Career)} className="btn" required>
            {CAREERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Experience (years)</label>
          <input
            type="number"
            min={0}
            value={experience}
            onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))}
            className="btn"
            placeholder="e.g., 2"
          />
        </div>

        <div>
          <label>Budget (monthly USD) <span style={{ color: "crimson" }}>*</span></label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value === "" ? "" : Number(e.target.value))}
            className="btn"
            placeholder="e.g., 1800"
            required
          />
        </div>

        <div>
          <label>Credit score (3 digits) <span style={{ color: "crimson" }}>*</span></label>
          <input
            inputMode="numeric"
            pattern="\d{3}"
            maxLength={3}
            value={credit}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 3);
              setCredit(v);
            }}
            className="btn"
            placeholder="e.g., 720"
            required
          />
          <small style={{ color: "#6b7280" }}>
            We convert this to a band (excellent/good/fair/poor).
          </small>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button className="btn" type="submit" disabled={!valid || loading}>
          {loading ? "Working…" : "Generate my plan"}
        </button>
      </form>
    </main>
  );
}
