# agents/lifestyle_agent/agent.py
import os
import json
from google import genai
from google.genai.types import GenerateContentConfig, HttpOptions
from ..models import UserProfile, LifestyleOutput, NeighborhoodFit

class LifestyleAgent:
    def __init__(self):
        self.client = genai.Client(
            api_key=os.getenv("GOOGLE_API_KEY"),
            http_options=HttpOptions(api_version="v1")
        )

    async def run(self, profile: UserProfile) -> LifestyleOutput:
        # Use Gemini to analyze neighborhoods based on user profile
        prompt = f"""
        You are analyzing neighborhoods in {profile.city} for someone with these characteristics:
        - Interests: {', '.join(profile.interests)}
        - Lifestyle: {profile.lifestyle}
        - Hobbies: {profile.hobbies}
        - Career: {profile.career_path}

        Research and recommend 4 real neighborhoods in {profile.city}. For each neighborhood, identify relevant tags/characteristics that match the user's profile.

        Respond with ONLY a JSON object in this exact format:
        {{
            "neighborhoods": [
                {{"name": "Neighborhood Name", "tags": ["tag1", "tag2", "tag3"], "match_score": 85}},
                {{"name": "Another Neighborhood", "tags": ["tag1", "tag2"], "match_score": 78}}
            ]
        }}

        Score each neighborhood 0-100 based on how well it matches the user's interests and lifestyle.
        Include 3-5 relevant tags per neighborhood (e.g., "nightlife", "vegan-friendly", "walkable", "art scene", "parks").
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-pro",
                contents=prompt,
                config=GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=800,
                    response_mime_type="application/json"
                )
            )
            result = json.loads(response.text.strip())
            neighborhoods_data = result.get("neighborhoods", [])

            # Sort by match score
            neighborhoods_data.sort(key=lambda x: x.get("match_score", 0), reverse=True)

            # Convert to NeighborhoodFit objects
            neighborhoods = [
                NeighborhoodFit(
                    name=n["name"],
                    tags=n["tags"],
                    match_score=n["match_score"]
                ) for n in neighborhoods_data
            ]

        except Exception:
            # Fallback to mock data if Gemini fails
            mock_neighborhoods = [
                {"name": "Downtown", "tags": ["nightlife", "gym", "walkable"], "match_score": 85},
                {"name": "Arts District", "tags": ["vegan", "cafes", "galleries"], "match_score": 78},
                {"name": "Midtown", "tags": ["quiet", "parks", "family"], "match_score": 65},
                {"name": "University Area", "tags": ["young-professionals", "affordable", "transit"], "match_score": 72}
            ]

            # Score based on interest overlap for fallback
            user_interests_lower = [i.lower() for i in profile.interests]
            for neighborhood in mock_neighborhoods:
                overlap = len(set(neighborhood["tags"]).intersection(user_interests_lower))
                neighborhood["match_score"] = min(100, 50 + overlap * 15)

            mock_neighborhoods.sort(key=lambda x: x["match_score"], reverse=True)
            neighborhoods = [
                NeighborhoodFit(
                    name=n["name"],
                    tags=n["tags"],
                    match_score=n["match_score"]
                ) for n in mock_neighborhoods
            ]

        primary_fit = neighborhoods[0] if neighborhoods else NeighborhoodFit(name="Downtown", tags=["walkable"], match_score=50)
        alternatives = neighborhoods[1:4] if len(neighborhoods) > 1 else []

        return LifestyleOutput(
            primary_fit=primary_fit,
            alternatives=alternatives,
            explanation=f"Ranked neighborhoods by overlap between your interests ({', '.join(profile.interests)}) and neighborhood characteristics."
        )
