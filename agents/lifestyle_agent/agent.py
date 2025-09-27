# agents/lifestyle_agent/agent.py
from typing import Any, Dict, List
from google.adk.agents import Agent  # keep ADK base for later swap-in

MOCK_NEIGHBORHOODS = [
    {"name": "Downtown",      "tags": ["nightlife", "gym", "walkable"]},
    {"name": "Arts District", "tags": ["vegan", "cafes", "galleries"]},
    {"name": "Midtown",       "tags": ["quiet", "parks", "family"]},
]

class LifestyleAgent(Agent):
    def __init__(self):
        super().__init__(
            name="LifestyleAgent",
            description="Scores neighborhoods by overlap with user interests.",
            instruction="Return best-fit neighborhoods for the user's interests.",
            model="gemini-1.5-pro",
        )

    async def run(self, profile) -> Dict[str, Any]:
        interests = [i.lower() for i in (profile.interests or [])]

        def score(n):
            return len(set(n["tags"]).intersection(interests))

        ranked = sorted(MOCK_NEIGHBORHOODS, key=score, reverse=True)
        best = ranked[0] if ranked else None
        return {
            "primary_fit": best,
            "alternatives": ranked[1:3],
            "explanation": "Ranked b keyword overlap between your interests and neighborhood tags."
        }
