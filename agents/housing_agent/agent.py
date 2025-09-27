## agents/housing_agent/agent.py
from google.adk.agents import Agent

class HousingAgent(Agent):
    def __init__(self):
        super().__init__(
            name="HousingAgent",
            description="Finds and scores rental listings based on budget, credit, and lifestyle fit.",
            instruction="Your primary task is to find a shortlist of apartments that are a great match for the user's preferences. You will receive a budget, credit score, and location preferences.",
            model="gemini-1.5-pro",
        )
        
    async def run(self, profile, finance_results, lifestyle_results):
        # Mock API response for apartments
        mock_listings = [
            {"address": "123 Mock St, Houston", "rent": 1500, "min_credit_score": 650, "amenities": ["gym", "pool"], "coords": {"lat": 29.7, "lng": -95.3}},
            {"address": "456 Fake Ave, Houston", "rent": 2200, "min_credit_score": 720, "amenities": ["vegan cafe nearby", "trails nearby"], "coords": {"lat": 29.8, "lng": -95.5}},
            {"address": "789 Placeholder Ln, Houston", "rent": 1750, "min_credit_score": 680, "amenities": ["gym", "pool", "community garden"], "coords": {"lat": 29.6, "lng": -95.4}},
        ]

        # In a real app, you'd use the finance_results and lifestyle_results to filter and score
        # For this test, we'll just return the mock data for simplicity
        
        # A simple score calculation to demonstrate the logic
        scored_listings = []
        for listing in mock_listings:
            score = 0
            if listing['rent'] <= profile.budget:
                score += 0.30
            if profile.credit_band == "good" and listing['min_credit_score'] <= 700:
                score += 0.30
            
            # This is where the lifestyle results would be used
            if "vegan food" in profile.interests and "vegan cafe nearby" in listing['amenities']:
                score += 0.25
            
            scored_listings.append({
                "address": listing['address'],
                "rent": listing['rent'],
                "score": round(score, 2),
                "reason": f"Matched based on budget and credit."
            })
            
        return scored_listings

# Now, create the other agents in a similar way:
# File to edit: agents/lifestyle_agent/agent.py
# (Simulate amenity checks, and return a score or filtered list)
# File to edit: agents/career_agent/agent.py
# (Simulate job search and matching, return a list of jobs)
# File to edit: agents/finance_agent/agent.py
# (Simulate credit score check and affordability calculation, return an eligibility report)
# File to edit: agents/outreach_agent/agent.py
# (Simulate email drafting and move checklist generation)