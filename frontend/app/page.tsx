"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>What’s the Next Move?</h1>
        <p>Click below to start planning your relocation 🚀</p>
        <button
          style={{
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1.2rem",
            cursor: "pointer",
          }}
          onClick={() => router.push("/intake")}
        >
          ➡️ Start Now
        </button>
      </div>
    </main>
  );
}
