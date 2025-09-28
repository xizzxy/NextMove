# agents/finance_agent/agent.py
import os
from google import genai
from google.genai.types import GenerateContentConfig, HttpOptions
from ..models import UserProfile, FinanceOutput, AffordabilityInfo, MoveCashNeeded

class FinanceAgent:
    def __init__(self):
        self.client = genai.Client(
            api_key=os.getenv("GOOGLE_API_KEY"),
            http_options=HttpOptions(api_version="v1")
        )

    async def run(self, profile: UserProfile) -> FinanceOutput:
        # Calculate recommended max rent (30% rule)
        # If salary is 0 or not provided, estimate from budget (reverse 30% rule)
        if profile.salary and profile.salary > 0:
            recommended_max_rent = int(profile.salary * 0.30 / 12)
        else:
            # Estimate annual salary from monthly budget (budget should be ~30% of monthly income)
            estimated_monthly_income = profile.budget / 0.30
            estimated_annual_salary = estimated_monthly_income * 12
            recommended_max_rent = int(estimated_annual_salary * 0.30 / 12)

        # Determine budget vs recommended comparison
        if profile.budget < recommended_max_rent * 0.9:
            budget_vs_recommended = "below"
        elif profile.budget <= recommended_max_rent * 1.1:
            budget_vs_recommended = "near"
        else:
            budget_vs_recommended = "above"

        # Calculate move-in costs
        deposits = profile.budget * 2  # first + last month
        moving = 800  # estimated moving costs
        setup = 300   # utilities, internet setup
        buffer = int(profile.budget * 0.5)  # emergency buffer
        total = deposits + moving + setup + buffer

        # Use Gemini to generate personalized financial tips
        display_salary = profile.salary if profile.salary > 0 else int(estimated_annual_salary) if 'estimated_annual_salary' in locals() else "not provided"
        prompt = f"""
        Generate 2-3 concise financial tips for someone moving to {profile.city} with:
        - Budget: ${profile.budget}/month
        - Salary: ${display_salary}/year
        - Credit: {profile.credit_band}

        Focus on practical move-in cost strategies and budgeting advice.
        Each tip should be 1 sentence, practical and actionable.
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-pro",
                contents=prompt,
                config=GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=200
                )
            )
            tips_text = response.text.strip()
            # Parse the response into individual tips
            tips = [tip.strip().lstrip('- ').lstrip('• ') for tip in tips_text.split('\n') if tip.strip()]
            # Limit to 3 tips and ensure they're not empty
            tips = [tip for tip in tips[:3] if len(tip) > 10]
        except Exception:
            # Fallback tips if Gemini fails
            tips = [
                "Ask about deposit alternatives or payment schedules.",
                "Consider renter's insurance (<$20/month).",
                "Budget for unexpected moving expenses."
            ]

        affordability = AffordabilityInfo(
            recommended_max_rent=recommended_max_rent,
            credit_band=profile.credit_band,
            budget_vs_recommended=budget_vs_recommended
        )

        move_cash_needed = MoveCashNeeded(
            deposits=deposits,
            moving=moving,
            setup=setup,
            buffer=buffer,
            total=total
        )

        return FinanceOutput(
            affordability=affordability,
            move_cash_needed=move_cash_needed,
            tips=tips
        )
