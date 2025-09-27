# backend/main.py
import os, asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# keep offline-friendly
load_dotenv()
os.environ.setdefault("GOOGLE_API_KEY", "DUMMY_KEY")

from agents.housing_agent.agent import HousingAgent
from agents.lifestyle_agent.agent import LifestyleAgent
from agents.career_agent.agent import CareerAgent
from agents.finance_agent.agent import FinanceAgent

app = FastAPI(title="NextMove API")

class UserProfile(BaseModel):
    city: str
    budget: int
    credit_band: str
    interests: list[str]
    salary: int
    career_path: str

@app.post("/api/plan_move")
async def plan_move(profile: UserProfile):
    try:
        fin_agent, life_agent = FinanceAgent(), LifestyleAgent()
        finance_results, lifestyle_results = await asyncio.gather(
            fin_agent.run(profile), life_agent.run(profile)
        )

        house_agent, career_agent = HousingAgent(), CareerAgent()
        housing_results, career_results = await asyncio.gather(
            house_agent.run(profile, finance_results, lifestyle_results),
            career_agent.run(profile),
        )

        return {
            "status": "success",
            "city": profile.city,
            "finance": finance_results,
            "lifestyle": lifestyle_results,
            "housing_recommendations": housing_results,
            "job_recommendations": career_results,
            "summary": {
                "headline": f"Personalized move plan for {profile.city}",
                "top_apartment": (housing_results or [{}])[0],
                "job_target": (career_results.get("recruiter_targets") or [{}])[0],
                "cash_needed": finance_results["move_cash_needed"]["total"],
                "neighborhood": lifestyle_results.get("primary_fit"),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
