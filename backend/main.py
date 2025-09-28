# backend/main.py
import os, asyncio
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

from agents.housing_agent.agent import HousingAgent
from agents.lifestyle_agent.agent import LifestyleAgent
from agents.career_agent.agent import CareerAgent
from agents.finance_agent.agent import FinanceAgent
from agents.models import UserProfile, MovePlanResponse, MovePlanSummary

app = FastAPI(title="NextMove API")

@app.post("/api/plan_move", response_model=MovePlanResponse)
async def plan_move(profile: UserProfile):
    try:
        # Initialize agents
        fin_agent, life_agent = FinanceAgent(), LifestyleAgent()

        # Run finance and lifestyle agents in parallel
        finance_results, lifestyle_results = await asyncio.gather(
            fin_agent.run(profile),
            life_agent.run(profile)
        )

        # Run housing and career agents in parallel (housing needs finance + lifestyle results)
        house_agent, career_agent = HousingAgent(), CareerAgent()
        housing_results, career_results = await asyncio.gather(
            house_agent.run(profile, finance_results, lifestyle_results),
            career_agent.run(profile),
        )

        # Create summary
        summary = MovePlanSummary(
            headline=f"Personalized move plan for {profile.city}",
            top_apartment=housing_results.housing_recommendations[0].dict() if housing_results.housing_recommendations else None,
            job_target=career_results.job_recommendations.recruiter_targets[0].dict() if career_results.job_recommendations.recruiter_targets else None,
            cash_needed=finance_results.move_cash_needed.total,
            neighborhood=lifestyle_results.primary_fit,
        )

        # Return structured response
        return MovePlanResponse(
            status="success",
            city=profile.city,
            finance=finance_results,
            lifestyle=lifestyle_results,
            housing_recommendations=housing_results.housing_recommendations,
            job_recommendations=career_results.job_recommendations,
            summary=summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
