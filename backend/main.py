# backend/main.py
import os, asyncio
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# keep offline-friendly
load_dotenv()
os.environ.setdefault("GOOGLE_API_KEY", "")

from agents.housing_agent.agent import HousingAgent
from agents.lifestyle_agent.agent import LifestyleAgent
from agents.career_agent.agent import CareerAgent
from agents.finance_agent.agent import FinanceAgent
from agents.models import UserProfile, MovePlanResponse, MovePlanSummary

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NextMove API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def derive_credit_band(credit_score: int) -> str:
    """Derive credit band from numeric credit score"""
    if credit_score >= 740:
        return "excellent"
    elif credit_score >= 670:
        return "good"
    elif credit_score >= 580:
        return "fair"
    else:
        return "poor"

@app.post("/api/plan_move", response_model=MovePlanResponse)
async def plan_move(request: Request, profile: UserProfile):
    logger.info(f"Received plan_move request for city: {profile.city}")

    # Run full processing without any time limits

    try:
        # Normalize profile data before processing
        if profile.credit_band is None and profile.credit_score is not None:
            profile.credit_band = derive_credit_band(profile.credit_score)
        elif profile.credit_band is None:
            profile.credit_band = "fair"  # default fallback

        if profile.experience_years is None:
            profile.experience_years = 0  # default to 0 years experience

        # Ensure interests is a list
        if not profile.interests:
            profile.interests = []

        # Normalize city string
        profile.city = profile.city.strip()

        logger.info(f"Normalized profile: city={profile.city}, budget={profile.budget}, credit_band={profile.credit_band}")

        # Initialize agents
        fin_agent = FinanceAgent()
        life_agent = LifestyleAgent()
        house_agent = HousingAgent()
        career_agent = CareerAgent()

        # Run finance and lifestyle agents in parallel without any timeouts
        logger.info("Running finance and lifestyle agents...")
        finance_results, lifestyle_results = await asyncio.gather(
            fin_agent.run(profile),
            life_agent.run(profile)
        )
        logger.info("Finance and lifestyle agents completed")

        # Run housing and career agents in parallel without any timeouts
        logger.info("Running housing and career agents...")
        housing_results, career_results = await asyncio.gather(
            house_agent.run(profile, finance_results, lifestyle_results),
            career_agent.run(profile)
        )
        logger.info("Housing and career agents completed")

        # Create summary
        summary = MovePlanSummary(
            headline=f"Personalized move plan for {profile.city}",
            top_apartment=housing_results.housing_recommendations[0].dict() if housing_results.housing_recommendations else None,
            job_target=career_results.job_recommendations.job_matches[0].dict() if career_results.job_recommendations.job_matches else None,
            cash_needed=finance_results.move_cash_needed.total,
            neighborhood=lifestyle_results.primary_fit,
        )

        logger.info("Successfully generated move plan")

        # Build response
        response_data = {
            "status": "success",
            "city": profile.city,
            "finance": finance_results,
            "lifestyle": lifestyle_results,
            "housing_recommendations": housing_results.housing_recommendations,
            "job_recommendations": career_results.job_recommendations,
            "summary": summary
        }

        # Add notes if there were any timeouts/fallbacks
        if notes:
            response_data["_notes"] = notes

        return MovePlanResponse(**response_data)

    except Exception as e:
        logger.error(f"Error processing plan_move request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
