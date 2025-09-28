# agents/housing_agent/agent.py
import os
import json
import requests
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
        self.maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    async def run(self, profile: UserProfile, finance_results: FinanceOutput, lifestyle_results: LifestyleOutput) -> HousingOutput:
        # Extract relevant data for scoring
        max_budget = profile.budget
        credit_score = self._get_credit_score_estimate(profile.credit_band or "fair")
        preferred_neighborhoods = [lifestyle_results.primary_fit.name] + [n.name for n in lifestyle_results.alternatives]
        user_interests = profile.interests

        # Try Google Places first, then fallback to Gemini generation
        listings_data = await self._search_google_places(profile, max_budget, user_interests)

        if not listings_data:
            # Fallback to Gemini generation
            listings_data = await self._generate_with_gemini(profile, max_budget, preferred_neighborhoods, user_interests)

        if not listings_data:
            # Final fallback to mock data
            listings_data = self._get_fallback_listings(profile, max_budget)

        # Score each listing
        recommendations = []
        for listing in listings_data:
            match_score, reason = self._calculate_match_score(
                listing, profile, finance_results, lifestyle_results, credit_score
            )

            recommendation = HousingRecommendation(
                address=listing["address"],
                rent=listing.get("rent"),
                min_credit_score=listing.get("min_credit_score"),
                amenities=listing.get("amenities", []),
                coords=Coordinates(lat=listing["lat"], lng=listing["lng"]),
                match_score=match_score,
                reason=reason,
                source_url=listing.get("source_url")
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
        listing_rent = listing.get("rent", profile.budget)
        if listing_rent <= profile.budget:
            if listing_rent <= finance_results.affordability.recommended_max_rent:
                score += 40
                reasons.append("within recommended budget")
            else:
                score += 25
                reasons.append("within your budget")
        elif listing_rent <= profile.budget * 1.1:
            score += 15
            reasons.append("slightly above budget")

        # Credit requirements (25% of score)
        min_credit = listing.get("min_credit_score", 650)
        if credit_score >= min_credit:
            score += 25
            reasons.append("meets credit requirements")
        elif credit_score >= min_credit - 30:
            score += 15
            reasons.append("close to credit requirements")

        # Lifestyle fit (25% of score)
        user_interests_lower = [i.lower() for i in profile.interests]
        amenity_keywords = [amenity.lower() for amenity in listing.get("amenities", [])]

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

    async def _search_google_places(self, profile: UserProfile, max_budget: int, user_interests: list) -> list:
        """Search for real apartment listings using Google Places API"""
        if not self.maps_api_key:
            return []

        try:
            # Search for apartments in the specified city
            search_query = f"apartments for rent in {profile.city}"
            places_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

            params = {
                "query": search_query,
                "key": self.maps_api_key,
                "type": "real_estate_agency",
                "fields": "name,formatted_address,geometry,rating,price_level"
            }

            response = requests.get(places_url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                places = data.get("results", [])

                listings = []
                for place in places[:6]:  # Limit to 6 results
                    if place.get("geometry", {}).get("location"):
                        listing = self._convert_place_to_listing(place, profile, max_budget)
                        if listing:
                            listings.append(listing)

                return listings

        except Exception as e:
            print(f"Google Places API error: {e}")

        return []

    def _convert_place_to_listing(self, place: dict, profile: UserProfile, max_budget: int) -> dict:
        """Convert Google Places result to our listing format"""
        import random
        location = place.get("geometry", {}).get("location", {})

        # Better rent estimation with realistic variation
        price_level = place.get("price_level", None)
        if price_level is not None:
            # Use price_level with more variation: 0=cheap, 4=expensive
            base_multiplier = 0.7 + (price_level * 0.15)  # 0.7 to 1.3 range
        else:
            # Random variation when price_level missing
            base_multiplier = 0.75 + random.random() * 0.6  # 0.75 to 1.35 range

        # Add random variation ±15% to prevent identical prices
        variance = 1.0 + (random.random() - 0.5) * 0.3  # 0.85 to 1.15
        rent_estimate = int(max_budget * base_multiplier * variance)

        # Generate amenities based on user interests
        amenities = []
        for interest in profile.interests:
            if "gym" in interest.lower() or "fitness" in interest.lower():
                amenities.append("fitness center")
            elif "pool" in interest.lower() or "swim" in interest.lower():
                amenities.append("pool")
            elif "park" in interest.lower():
                amenities.append("near park")
            elif "coffee" in interest.lower():
                amenities.append("coffee shop nearby")

        if not amenities:
            amenities = ["parking", "laundry"]

        return {
            "address": place.get("formatted_address", f"{place.get('name', 'Unknown')}, {profile.city}"),
            "rent": rent_estimate,
            "min_credit_score": 650,  # Default estimate
            "amenities": amenities[:3],  # Limit to 3
            "lat": location.get("lat", 0),
            "lng": location.get("lng", 0),
            "source_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id', '')}"
        }

    async def _generate_with_gemini(self, profile: UserProfile, max_budget: int, preferred_neighborhoods: list, user_interests: list) -> list:
        """Generate apartment listings using Gemini as fallback"""
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
            return result.get("listings", [])
        except Exception:
            return []

    def _get_fallback_listings(self, profile: UserProfile, max_budget: int) -> list:
        """Generate fallback mock data when all other methods fail"""
        import random

        # Generate varied pricing around budget
        base_prices = [
            int(max_budget * 0.65),  # Budget option
            int(max_budget * 0.85),  # Below budget
            int(max_budget * 0.95),  # Just under budget
            int(max_budget * 1.1),   # Slightly over budget
            int(max_budget * 1.25),  # Premium option
            int(max_budget * 1.4),   # Luxury option
        ]

        # Coordinate variations for different areas
        base_coords = [
            (29.7604, -95.3698),  # Downtown Houston (example)
            (29.7849, -95.3936),  # Heights area
            (29.7372, -95.3953),  # Montrose area
            (29.8024, -95.3688),  # Northside
            (29.7205, -95.3451),  # Medical Center
            (29.7465, -95.4186),  # Galleria
        ]

        amenity_sets = [
            ["gym", "pool", "parking"],
            ["roof deck", "bike storage", "pet-friendly"],
            ["laundry", "parking", "balcony"],
            ["fitness center", "concierge", "rooftop pool"],
            ["yoga studio", "coworking space", "garden"],
            ["spa", "valet parking", "wine cellar"]
        ]

        listings = []
        for i in range(6):
            lat, lng = base_coords[i]
            # Add small random variation to coordinates
            lat += (random.random() - 0.5) * 0.02
            lng += (random.random() - 0.5) * 0.02

            listings.append({
                "address": f"{100 + i*111} {'Mock Premium Downtown Lifestyle Budget Luxury'.split()[i]} St, {profile.city}",
                "rent": base_prices[i],
                "min_credit_score": 600 + (i * 25),  # 600 to 725
                "amenities": amenity_sets[i],
                "lat": lat,
                "lng": lng
            })

        return listings