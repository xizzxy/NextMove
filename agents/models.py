
# agents/models.py
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Input Models
class UserProfile(BaseModel):
    name: str = ""
    city: str
    budget: int
    credit_band: Optional[Literal["excellent", "good", "fair", "poor"]] = None
    credit_score: Optional[int] = None
    lifestyle: str = ""
    hobbies: str = ""
    career_path: str
    experience_years: Optional[int] = None
    salary: int = 0
    fast_mode: bool = False

# Finance Agent Output Models
class AffordabilityInfo(BaseModel):
    recommended_max_rent: int
    credit_band: str
    budget_vs_recommended: Literal["below", "near", "above"]

class MoveCashNeeded(BaseModel):
    deposits: int
    moving: int
    setup: int
    buffer: int
    total: int

class FinanceOutput(BaseModel):
    affordability: AffordabilityInfo
    move_cash_needed: MoveCashNeeded
    tips: List[str]

# Housing Agent Output Models
class Coordinates(BaseModel):
    lat: float
    lng: float

# Lifestyle Agent Output Models
class NeighborhoodFit(BaseModel):
    name: str
    tags: List[str]
    match_score: int

class Place(BaseModel):
    name: str
    category_tags: List[str]
    coords: Coordinates
    reason: str
    match_score: int

class LifestyleOutput(BaseModel):
    primary_fit: NeighborhoodFit
    explanation: str
    places: List[Place] = []

class HousingRecommendation(BaseModel):
    address: str
    rent: Optional[int]
    min_credit_score: Optional[int]
    amenities: List[str]
    coords: Coordinates
    match_score: int
    reason: str
    source_url: Optional[str] = None

class HousingOutput(BaseModel):
    housing_recommendations: List[HousingRecommendation]

# Career Agent Output Models
class JobMatch(BaseModel):
    title: str
    company: str
    location: str
    salary_range: Optional[str] = None
    apply_url: Optional[str] = None
    match_score: int = 0

class JobRecommendations(BaseModel):
    job_matches: List[JobMatch]

class CareerOutput(BaseModel):
    job_recommendations: JobRecommendations

# Final Combined Output
class MovePlanSummary(BaseModel):
    headline: str
    top_apartment: Optional[Dict[str, Any]] = None
    job_target: Optional[Dict[str, Any]] = None
    cash_needed: int
    neighborhood: Optional[NeighborhoodFit] = None

class MovePlanResponse(BaseModel):
    status: str
    city: str
    finance: FinanceOutput
    lifestyle: LifestyleOutput
    housing_recommendations: List[HousingRecommendation]
    job_recommendations: JobRecommendations
    summary: MovePlanSummary