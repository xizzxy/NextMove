import asyncio
import json
from pydantic import BaseModel

from agents.housing_agent.agent import HousingAgent
from agents.lifestyle_agent.agent import LifestyleAgent
from agents.career_agent.agent import CareerAgent
from agents.finance_agent.agent import FinanceAgent

class UserProfile(BaseModel):
    city: str
    budget: int
    credit_band: str
    interests: list[str]
    salary: int
    career_path: str

async def main():
    profile = UserProfile(
        city="Houston, TX",
        budget=1800,
        credit_band="good",
        interests=["react", "vegan", "gym", "nightlife"],
        salary=72000,
        career_path="python"
    )

    fin, life = await asyncio.gather(FinanceAgent().run(profile), LifestyleAgent().run(profile))
    housing, career = await asyncio.gather(
        HousingAgent().run(profile, fin, life),
        CareerAgent().run(profile)
    )

    print(json.dumps({
        "finance": fin,
        "lifestyle": life,
        "housing": housing,
        "career": career
    }, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
