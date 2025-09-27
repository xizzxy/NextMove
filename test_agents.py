# test_agents.py
import asyncio
import sys
import os
from unittest.mock import patch, MagicMock

# Add the current directory to Python path so we can import agents
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.models import UserProfile
from agents.finance_agent.agent import FinanceAgent
from agents.lifestyle_agent.agent import LifestyleAgent
from agents.housing_agent.agent import HousingAgent
from agents.career_agent.agent import CareerAgent

async def test_agents():
    """Test all agents with sample data"""

    # Sample user profile based on the specification
    sample_profile = UserProfile(
        name="Luciana",
        city="Houston, TX",
        budget=1800,
        credit_band="good",
        credit_score=720,
        interests=["vegan", "gym", "nightlife"],
        lifestyle="vegan, active",
        hobbies="climbing, painting",
        career_path="Software Engineer",
        experience_years=2,
        salary=72000
    )

    print("Testing NextMove Agents with sample data")
    print(f"Profile: {sample_profile.name}, moving to {sample_profile.city}")
    print("-" * 50)

    try:
        # Test FinanceAgent
        print("Testing FinanceAgent...")
        finance_agent = FinanceAgent()
        finance_results = await finance_agent.run(sample_profile)
        print(f"Finance: Recommended max rent: ${finance_results.affordability.recommended_max_rent}")
        print(f"  Move-in cash needed: ${finance_results.move_cash_needed.total}")
        print(f"  Budget status: {finance_results.affordability.budget_vs_recommended}")

        # Test LifestyleAgent
        print("\nTesting LifestyleAgent...")
        lifestyle_agent = LifestyleAgent()
        lifestyle_results = await lifestyle_agent.run(sample_profile)
        print(f"Lifestyle: Best neighborhood: {lifestyle_results.primary_fit.name}")
        print(f"  Match score: {lifestyle_results.primary_fit.match_score}")
        print(f"  Alternatives: {[n.name for n in lifestyle_results.alternatives]}")

        # Test HousingAgent
        print("\nTesting HousingAgent...")
        housing_agent = HousingAgent()
        housing_results = await housing_agent.run(sample_profile, finance_results, lifestyle_results)
        print(f"Housing: Found {len(housing_results.housing_recommendations)} recommendations")
        if housing_results.housing_recommendations:
            top_rec = housing_results.housing_recommendations[0]
            print(f"  Top recommendation: {top_rec.address}")
            print(f"  Rent: ${top_rec.rent}, Score: {top_rec.match_score}")

        # Test CareerAgent
        print("\nTesting CareerAgent...")
        career_agent = CareerAgent()
        career_results = await career_agent.run(sample_profile)
        print(f"Career: Found {len(career_results.job_recommendations.job_matches)} job matches")
        print(f"  Recruiter targets: {len(career_results.job_recommendations.recruiter_targets)}")
        print(f"  Email drafts: {len(career_results.job_recommendations.email_drafts)}")
        if career_results.job_recommendations.job_matches:
            top_job = career_results.job_recommendations.job_matches[0]
            print(f"  Top job: {top_job.title} at {top_job.company}")

        print("\nAll agents tested successfully!")
        return True

    except Exception as e:
        print(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_agents())
    if success:
        print("\nAll tests passed - agents are working correctly!")
    else:
        print("\nTests failed - check error messages above")
        sys.exit(1)