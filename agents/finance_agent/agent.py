# agents/finance_agent/agent.py
from typing import Any, Dict
from google.adk.agents import Agent

class FinanceAgent(Agent):
    def __init__(self):
        super().__init__(
            name="FinanceAgent",
            description="Estimates move cash needs and basic affordability.",
            instruction="Compute a simple move budget and affordability guidance.",
            model="gemini-1.5-pro",
        )

    async def run(self, profile) -> Dict[str, Any]:
        budget = profile.budget or 2000
        deposits = budget * 2        # first + last (simple heuristic)
        moving  = 800                # truck + supplies (mock)
        setup   = 300                # utilities/internet setup (mock)
        buffer  = int(0.5 * budget)  # cushion
        total   = int(deposits + moving + setup + buffer)
        affordable_rent = int(min(budget, max(1000, profile.salary * 0.25 / 12)))  # 25% income rule (very rough)

        return {
            "affordability": {
                "recommended_max_rent": affordable_rent,
                "credit_band": profile.credit_band,
            },
            "move_cash_needed": {
                "deposits": deposits,
                "moving": moving,
                "setup": setup,
                "buffer": buffer,
                "total": total
            },
            "tips": [
                "Ask about deposit alternatives or payment schedules.",
                "Get renter’s insurance quotes (<$20/mo for many)."
            ]
        }
