
# agents/models.py
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Input Models
class UserProfile(BaseModel):
    name: str
    city: str
    budget: int
    credit_band: Literal["excellent", "good", "fair", "poor"]
    credit_score: Optional[int] = None
    interests: List[str] = []
    lifestyle: str = ""
    hobbies: str = ""
    career_path: str
    experience_years: int
    salary: int

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

# Lifestyle Agent Output Models
class NeighborhoodFit(BaseModel):
    name: str
    tags: List[str]
    match_score: int

class LifestyleOutput(BaseModel):
    primary_fit: NeighborhoodFit
    alternatives: List[NeighborhoodFit]
    explanation: str

# Housing Agent Output Models
class Coordinates(BaseModel):
    lat: float
    lng: float

class HousingRecommendation(BaseModel):
    address: str
    rent: int
    min_credit_score: int
    amenities: List[str]
    coords: Coordinates
    match_score: int
    reason: str

class HousingOutput(BaseModel):
    housing_recommendations: List[HousingRecommendation]

# Career Agent Output Models
class JobMatch(BaseModel):
    title: str
    company: str
    skills: List[str]
    location: str
    salary_range: Optional[str] = None

class RecruiterTarget(BaseModel):
    company: str
    role: str

class EmailDraft(BaseModel):
    to: str
    subject: str
    body: str

class JobRecommendations(BaseModel):
    job_matches: List[JobMatch]
    recruiter_targets: List[RecruiterTarget]
    email_drafts: List[EmailDraft]

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