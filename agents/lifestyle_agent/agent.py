# agents/lifestyle_agent/agent.py
import os
import json
import re
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
        hobbies_list = [hobby.strip() for hobby in re.split(r'[^a-zA-Z0-9\s]+|\s+', profile.hobbies) if hobby.strip()]

        prompt = f"""
        You are analyzing neighborhoods in {profile.city} for someone with these characteristics:
        - Lifestyle: {profile.lifestyle}
        - Hobbies: {', '.join(hobbies_list)}
        - Career: {profile.career_path}

        Research and recommend the number one best fit neighborhood in {profile.city}. For each neighborhood, identify relevant tags/characteristics that match the user's profile.

        Respond with ONLY a JSON object in this exact format:
        {{
            "neighborhoods": [
                {{"name": "Neighborhood Name", "tags": ["tag1", "tag2", "tag3"], "match_score": 85}},
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

        except Exception as e:
            print(f"Gemini API failed, using fallback: {e}")
            # Fallback to mock data if Gemini fails
            mock_neighborhoods = [
                {
                    "name": "Downtown",
                    "tags": ["dining", "bar-hopping", "shopping", "theater", "concerts", "dancing",
                             "people-watching", "walking", "photography", "clubbing", "networking", "wine-tasting",
                             "comedy-shows", "live-music", "urban-exploration"],
                    "match_score": 50
                },

                {
                    "name": "Arts District",
                    "tags": ["painting", "photography", "pottery", "sculpture", "gallery-visiting",
                             "coffee-shop-hopping", "vintage-shopping", "crafting", "music", "writing", "sketching",
                             "antique-hunting", "art-collecting", "creative-workshops", "indie-films"],
                    "match_score": 50
                },
                {
                    "name": "Midtown",
                    "tags": ["jogging", "dog-walking", "picnicking", "playground-visits", "gardening", "reading",
                             "board-games", "cooking", "baking", "yoga", "meditation", "community-events",
                             "volunteering", "book-clubs", "family-activities"],
                    "match_score": 50
                },
                {
                    "name": "University Area",
                    "tags": ["studying", "trivia-nights", "casual-dining", "coffee-culture", "biking", "frisbee",
                             "basketball", "gaming", "tutoring", "language-exchange", "debate", "hackathons",
                             "student-organizations", "cheap-eats", "socializing"],
                    "match_score": 50
                },
                {
                    "name": "Tech District",
                    "tags": ["coding", "coworking", "networking", "coffee", "biking", "tech-meetups", "startups",
                             "innovation", "podcasting", "blogging", "gaming", "VR", "3D-printing", "robotics",
                             "app-development"],
                    "match_score": 50
                },
                {
                    "name": "Wellness District",
                    "tags": ["yoga", "meditation", "pilates", "spa-treatments", "healthy-cooking",
                             "juice-cleansing", "hiking", "running", "cycling", "rock-climbing", "CrossFit",
                             "massage", "acupuncture", "tai-chi", "mindfulness"],
                    "match_score": 50
                },
                {
                    "name": "Historic District",
                    "tags": ["history", "architecture-tours", "antique-collecting", "museum-visits",
                             "walking-tours", "genealogy", "historical-research", "vintage-shopping",
                             "cultural-events", "preservation", "storytelling", "ghost-tours", "local-history",
                             "heritage-crafts", "archaeology"],
                    "match_score": 50
                },
                {
                    "name": "Waterfront",
                    "tags": ["boating", "fishing", "sailing", "kayaking", "swimming", "beach-volleyball", "surfing",
                             "paddle-boarding", "marine-photography", "sunset-watching", "seafood-dining",
                             "dock-walking", "water-sports", "windsurfing", "jet-skiing"],
                    "match_score": 50
                }
            ]

            # Score based on hobby overlap for fallback
            hobbies_list = [hobby.strip() for hobby in re.split(r'[^a-zA-Z0-9\s]+|\s+', profile.hobbies) if hobby.strip()]
            user_hobbies_lower = [h.lower() for h in hobbies_list]
            user_lifestyle_lower = profile.lifestyle.lower() if profile.lifestyle else ""

            for neighborhood in mock_neighborhoods:
                # Calculate match score based on exact hobby-tag matches
                hobby_matches = 0
                neighborhood_tags_lower = [tag.lower() for tag in neighborhood["tags"]]

                # Count exact matches between user hobbies and neighborhood tags
                for hobby in user_hobbies_lower:
                    if hobby in neighborhood_tags_lower:
                        hobby_matches += 1

                # Mathematical equation: (matches / total_hobbies) * 100
                # If no hobbies provided, use base score of 30
                if user_hobbies_lower:
                    match_percentage = hobby_matches / len(user_hobbies_lower)
                    score = int(match_percentage * 100)
                else:
                    score = 30

                neighborhood["match_score"] = score

            mock_neighborhoods.sort(key=lambda x: x["match_score"], reverse=True)
            neighborhoods = [
                NeighborhoodFit(
                    name=n["name"],
                    tags=n["tags"],
                    match_score=n["match_score"]
                ) for n in mock_neighborhoods
            ]

        primary_fit = neighborhoods[0] if neighborhoods else NeighborhoodFit(name="Downtown", tags=["walkable"], match_score=50)

        return LifestyleOutput(
            primary_fit=primary_fit,
            explanation=f"Ranked neighborhoods by overlap between your hobbies ({', '.join(hobbies_list)}) and neighborhood characteristics."
        )
