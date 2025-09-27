# agents/career_agent/agent.py
from typing import Any, Dict, List
from google.adk.agents import Agent

MOCK_JOBS = [
    {"title": "Frontend Engineer Intern", "company": "PixelForge", "skills": ["react", "typescript", "ui"]},
    {"title": "Junior Data Engineer",     "company": "DataWaves",  "skills": ["python", "sql", "airflow"]},
    {"title": "ML Ops Intern",            "company": "ModelHaus",  "skills": ["python", "ml", "docker"]},
    {"title": "Data Analyst",             "company": "MarketLens", "skills": ["python", "pandas", "viz"]},
]

class CareerAgent(Agent):
    def __init__(self):
        super().__init__(
            name="CareerAgent",
            description="Suggests roles and recruiter targets based on skills.",
            instruction="Return job matches and concise recruiter email drafts.",
            model="gemini-1.5-pro",
        )

    async def run(self, profile) -> Dict[str, Any]:
        skills = [s.lower() for s in ([profile.career_path] + profile.interests if profile.interests else [profile.career_path])]
        # ^ quick stand-in until you add resume_skills to your schema

        def overlap(job):
            return len(set(job["skills"]).intersection(skills))

        ranked = sorted(MOCK_JOBS, key=overlap, reverse=True)[:5]
        targets = [{"company": j["company"], "role": j["title"]} for j in ranked[:3]]

        drafts = []
        for t in targets:
            drafts.append({
                "to": f"recruiter@{t['company'].lower()}.com",
                "subject": f"Interest in {t['role']} – relocating to {profile.city}",
                "body": (
                    f"Hi {{name}},\n\n"
                    f"I'm exploring {t['role']} roles in {profile.city}. "
                    f"My background aligns with {', '.join(skills)}. "
                    f"I'd love to learn more about {t['company']} and how I can contribute.\n\n"
                    f"Best,\nYour Name"
                )
            })

        return {
            "job_matches": ranked,
            "recruiter_targets": targets,
            "email_drafts": drafts
        }
