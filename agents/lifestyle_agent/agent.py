# agents/lifestyle_agent/agent.py
import os
import json
from google import genai
from google.genai.types import GenerateContentConfig, HttpOptions
from ..models import UserProfile, LifestyleOutput, NeighborhoodFit, Place, Coordinates

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

        # Get 10 POIs using Google Places
        places = await self._get_places_of_interest(profile)

        return LifestyleOutput(
            primary_fit=primary_fit,
            alternatives=alternatives,
            explanation=f"Ranked neighborhoods by overlap between your interests ({', '.join(profile.interests)}) and neighborhood characteristics.",
            places=places
        )

    async def _get_places_of_interest(self, profile: UserProfile) -> list:
        """Get 10 POIs using Google Places API based on user interests"""
        places = []

        if not self.maps_api_key:
            return self._get_fallback_places(profile)

        try:
            city_coords = self._get_city_coordinates(profile.city)

            # Map user interests to place types
            search_queries = self._map_interests_to_queries(profile.interests)

            for query in search_queries[:5]:  # Limit API calls
                place_results = await self._search_places_by_query(query, profile.city, city_coords)
                places.extend(place_results)

                if len(places) >= 10:
                    break

            # Fill remaining slots with general categories if needed
            if len(places) < 10:
                general_queries = ["restaurant", "coffee shop", "park", "gym", "shopping"]
                for query in general_queries:
                    if len(places) >= 10:
                        break
                    place_results = await self._search_places_by_query(query, profile.city, city_coords)
                    places.extend(place_results)

        except Exception as e:
            print(f"Google Places API error: {e}")
            return self._get_fallback_places(profile)

        # Ensure exactly 10 places with unique match scores
        places = places[:10]
        while len(places) < 10:
            places.extend(self._get_fallback_places(profile, count=10-len(places)))

        # Calculate match scores and ensure uniqueness
        for i, place in enumerate(places[:10]):
            place.match_score = self._calculate_place_match_score(place, profile, i)

        return places[:10]

    def _map_interests_to_queries(self, interests: list) -> list:
        """Map user interests to Google Places search queries"""
        query_map = {
            "gym": "gym fitness center",
            "fitness": "gym fitness center",
            "workout": "gym fitness center",
            "coffee": "coffee shop cafe",
            "food": "restaurant",
            "dining": "restaurant",
            "vegan": "vegan restaurant",
            "nightlife": "bar nightclub",
            "music": "music venue concert hall",
            "art": "art gallery museum",
            "gallery": "art gallery",
            "park": "park outdoor recreation",
            "hiking": "hiking trail park",
            "outdoor": "park outdoor recreation",
            "shopping": "shopping mall store",
            "yoga": "yoga studio",
            "spa": "spa wellness center"
        }

        queries = []
        for interest in interests:
            interest_lower = interest.lower()
            for key, query in query_map.items():
                if key in interest_lower:
                    queries.append(query)
                    break
            else:
                # Fallback: use the interest directly
                queries.append(interest)

        return list(set(queries))  # Remove duplicates

    async def _search_places_by_query(self, query: str, city: str, city_coords: dict) -> list:
        """Search Google Places for a specific query"""
        places_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

        params = {
            "query": f"{query} in {city}",
            "key": self.maps_api_key,
            "location": f"{city_coords['lat']},{city_coords['lng']}",
            "radius": "20000",  # 20km radius
            "fields": "name,formatted_address,geometry,types,rating"
        }

        response = requests.get(places_url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])

            places = []
            for result in results[:3]:  # Max 3 per query to avoid overwhelming
                if result.get("geometry", {}).get("location"):
                    place = self._convert_google_place_to_poi(result, query, city_coords)
                    if place:
                        places.append(place)

            return places

        return []

    def _convert_google_place_to_poi(self, place_data: dict, query: str, city_coords: dict) -> Place:
        """Convert Google Places result to our Place model"""
        location = place_data.get("geometry", {}).get("location", {})

        # Extract categories from place types
        place_types = place_data.get("types", [])
        category_tags = [t.replace("_", " ").title() for t in place_types[:3]]

        # Add query as primary category
        if query not in category_tags:
            category_tags.insert(0, query.title())

        reason = f"Matches your interest in {query.lower()}"

        return Place(
            name=place_data.get("name", "Unknown Place"),
            category_tags=category_tags[:4],  # Limit to 4 tags
            coords=Coordinates(
                lat=location.get("lat", city_coords["lat"]),
                lng=location.get("lng", city_coords["lng"])
            ),
            reason=reason,
            match_score=0  # Will be calculated later
        )

    def _calculate_place_match_score(self, place: Place, profile: UserProfile, index: int) -> int:
        """Calculate match score using formula: 0.7*interest_relevance + 0.3*distance_score"""
        import random
        from math import sqrt

        # Interest relevance (70% weight)
        user_interests_lower = [i.lower() for i in profile.interests]
        place_tags_lower = [tag.lower() for tag in place.category_tags]

        # Calculate overlap
        interest_terms = set()
        for interest in user_interests_lower:
            interest_terms.update(interest.split())

        tag_terms = set()
        for tag in place_tags_lower:
            tag_terms.update(tag.split())

        if interest_terms:
            intersection = len(interest_terms.intersection(tag_terms))
            union = len(interest_terms.union(tag_terms))
            interest_relevance = (intersection / union * 100) if union > 0 else 0
        else:
            interest_relevance = 50  # neutral if no interests

        # Distance score (30% weight) - closer is better
        city_coords = self._get_city_coordinates(profile.city)
        lat_diff = place.coords.lat - city_coords["lat"]
        lng_diff = place.coords.lng - city_coords["lng"]
        distance_km = sqrt(lat_diff**2 + lng_diff**2) * 111  # rough km conversion

        if distance_km <= 1:
            distance_score = 100
        elif distance_km <= 20:
            distance_score = 100 * (1 - (distance_km - 1) / 19)
        else:
            distance_score = 0

        # Combine scores
        match = (0.7 * interest_relevance + 0.3 * distance_score)

        # Add jitter to avoid ties (±2 points) + index offset
        jitter = (random.random() - 0.5) * 4 + (index * 0.5)  # Ensure uniqueness
        final_score = max(0, min(100, int(match + jitter)))

        return final_score

    def _get_fallback_places(self, profile: UserProfile, count: int = 10) -> list:
        """Generate fallback places when API fails"""
        city_coords = self._get_city_coordinates(profile.city)

        fallback_places = [
            {"name": "Central Park", "categories": ["Park", "Recreation"], "reason": "Great outdoor space"},
            {"name": "Downtown Gym", "categories": ["Fitness", "Gym"], "reason": "Stay in shape"},
            {"name": "Coffee Corner", "categories": ["Coffee", "Cafe"], "reason": "Perfect for work/study"},
            {"name": "Local Art Gallery", "categories": ["Art", "Culture"], "reason": "Cultural enrichment"},
            {"name": "Main Street Restaurants", "categories": ["Food", "Dining"], "reason": "Diverse dining options"},
            {"name": "Music Venue", "categories": ["Music", "Entertainment"], "reason": "Live entertainment"},
            {"name": "Shopping District", "categories": ["Shopping", "Retail"], "reason": "All your shopping needs"},
            {"name": "Yoga Studio", "categories": ["Yoga", "Wellness"], "reason": "Health and wellness"},
            {"name": "Hiking Trails", "categories": ["Hiking", "Nature"], "reason": "Outdoor activities"},
            {"name": "Community Center", "categories": ["Community", "Events"], "reason": "Social activities"}
        ]

        places = []
        for i, fallback in enumerate(fallback_places[:count]):
            # Add slight coordinate variation
            lat_offset = (i - 5) * 0.01
            lng_offset = (i - 5) * 0.01

            place = Place(
                name=fallback["name"],
                category_tags=fallback["categories"],
                coords=Coordinates(
                    lat=city_coords["lat"] + lat_offset,
                    lng=city_coords["lng"] + lng_offset
                ),
                reason=fallback["reason"],
                match_score=75 - (i * 5)  # Decreasing scores
            )
            places.append(place)

        return places

    def _get_city_coordinates(self, city: str) -> dict:
        """Get approximate coordinates for a city"""
        city_lower = city.lower()
        if "houston" in city_lower:
            return {"lat": 29.7604, "lng": -95.3698}
        elif "austin" in city_lower:
            return {"lat": 30.2672, "lng": -97.7431}
        elif "dallas" in city_lower:
            return {"lat": 32.7767, "lng": -96.7970}
        elif "new york" in city_lower:
            return {"lat": 40.7128, "lng": -74.0060}
        elif "los angeles" in city_lower:
            return {"lat": 34.0522, "lng": -118.2437}
        elif "san francisco" in city_lower:
            return {"lat": 37.7749, "lng": -122.4194}
        elif "seattle" in city_lower:
            return {"lat": 47.6062, "lng": -122.3321}
        else:
            # Default to Houston coordinates
            return {"lat": 29.7604, "lng": -95.3698}
