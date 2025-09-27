# agents/housing_agent/agent.py
import os
import json
from typing import Dict, Any
from google import genai
from google.genai.types import GenerateContentConfig, HttpOptions
from ..models import UserProfile, FinanceOutput, LifestyleOutput, HousingOutput, HousingRecommendation, Coordinates

class HousingAgent:
    def __init__(self):
        self.client = genai.Client(
            api_key=os.getenv("GOOGLE_API_KEY"),
            http_options=HttpOptions(api_version="v1")
        )

    async def run(self, profile: UserProfile, finance_results: FinanceOutput, lifestyle_results: LifestyleOutput) -> HousingOutput:
        # Extract relevant data for scoring
        max_budget = profile.budget
        credit_score = self._get_credit_score_estimate(profile.credit_band)
        preferred_neighborhoods = [lifestyle_results.primary_fit.name] + [n.name for n in lifestyle_results.alternatives]
        user_interests = profile.interests

        # Use Gemini to generate realistic apartment listings
        prompt = f"""
        Generate 4-6 realistic apartment listings for {profile.city} with this criteria:
        - Budget range: ${max_budget-300} to ${max_budget+500}/month
        - Target neighborhoods: {', '.join(preferred_neighborhoods)}
        - User interests: {', '.join(user_interests)}

        For each listing, include:
        - Realistic address in {profile.city}
        - Rent amount
        - Minimum credit score requirement (range 600-750)
        - 2-4 relevant amenities that might appeal to someone interested in: {', '.join(user_interests)}
        - Realistic lat/lng coordinates for {profile.city}

        Respond with ONLY a JSON object in this exact format:
        {{
            "listings": [
                {{
                    "address": "123 Main St, {profile.city}",
                    "rent": 1500,
                    "min_credit_score": 650,
                    "amenities": ["gym", "pool", "parking"],
                    "lat": 29.7604,
                    "lng": -95.3698
                }}
            ]
        }}
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-pro",
                contents=prompt,
                config=GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=1000,
                    response_mime_type="application/json"
                )
            )
            result = json.loads(response.text.strip())
            listings_data = result.get("listings", [])
        except Exception:
            # Fallback mock data
            listings_data = [
                {"address": f"123 Mock St, {profile.city}", "rent": max_budget - 100, "min_credit_score": 650, "amenities": ["gym", "pool"], "lat": 29.7, "lng": -95.3},
                {"address": f"456 Lifestyle Ave, {profile.city}", "rent": max_budget + 200, "min_credit_score": 720, "amenities": ["roof deck", "bike storage"], "lat": 29.8, "lng": -95.5},
                {"address": f"789 Budget Ln, {profile.city}", "rent": max_budget - 300, "min_credit_score": 600, "amenities": ["laundry", "parking"], "lat": 29.6, "lng": -95.4},
                {"address": f"321 Premium Blvd, {profile.city}", "rent": max_budget + 100, "min_credit_score": 700, "amenities": ["fitness center", "concierge"], "lat": 29.75, "lng": -95.35},
            ]

        # Score each listing
        recommendations = []
        for listing in listings_data:
            match_score, reason = self._calculate_match_score(
                listing, profile, finance_results, lifestyle_results, credit_score
            )

            recommendation = HousingRecommendation(
                address=listing["address"],
                rent=listing["rent"],
                min_credit_score=listing["min_credit_score"],
                amenities=listing["amenities"],
                coords=Coordinates(lat=listing["lat"], lng=listing["lng"]),
                match_score=match_score,
                reason=reason
            )
            recommendations.append(recommendation)

        # Sort by match score
        recommendations.sort(key=lambda x: x.match_score, reverse=True)

        return HousingOutput(housing_recommendations=recommendations)

    def _get_credit_score_estimate(self, credit_band: str) -> int:
        """Convert credit band to estimated numeric score"""
        credit_map = {
            "excellent": 750,
            "good": 700,
            "fair": 650,
            "poor": 600
        }
        return credit_map.get(credit_band, 650)

    def _calculate_match_score(self, listing: Dict[str, Any], profile: UserProfile,
                             finance_results: FinanceOutput, lifestyle_results: LifestyleOutput,
                             credit_score: int) -> tuple[int, str]:
        """Calculate match score and reason for a listing"""
        score = 0
        reasons = []

        # Affordability (40% of score)
        if listing["rent"] <= profile.budget:
            if listing["rent"] <= finance_results.affordability.recommended_max_rent:
                score += 40
                reasons.append("within recommended budget")
            else:
                score += 25
                reasons.append("within your budget")
        elif listing["rent"] <= profile.budget * 1.1:
            score += 15
            reasons.append("slightly above budget")

        # Credit requirements (25% of score)
        if credit_score >= listing["min_credit_score"]:
            score += 25
            reasons.append("meets credit requirements")
        elif credit_score >= listing["min_credit_score"] - 30:
            score += 15
            reasons.append("close to credit requirements")

        # Lifestyle fit (25% of score)
        user_interests_lower = [i.lower() for i in profile.interests]
        amenity_keywords = [amenity.lower() for amenity in listing["amenities"]]

        lifestyle_matches = 0
        for interest in user_interests_lower:
            for amenity in amenity_keywords:
                if interest in amenity or any(word in amenity for word in interest.split()):
                    lifestyle_matches += 1
                    break

        if lifestyle_matches > 0:
            lifestyle_score = min(25, lifestyle_matches * 8)
            score += lifestyle_score
            reasons.append(f"matches {lifestyle_matches} lifestyle preference(s)")

        # Location bonus (10% of score)
        # Simple heuristic: closer to city center is better
        if "downtown" in listing["address"].lower() or "center" in listing["address"].lower():
            score += 10
            reasons.append("prime location")

        reason = f"Good fit: {', '.join(reasons[:3])}."  # Limit to top 3 reasons
        return min(100, score), reason