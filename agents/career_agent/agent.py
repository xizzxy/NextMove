# agents/career_agent/agent.py
import os
import json
import requests
from google import genai
from google.genai.types import GenerateContentConfig, HttpOptions
from ..models import UserProfile, CareerOutput, JobRecommendations, JobMatch
class CareerAgent:
    def __init__(self):
        self.client = genai.Client(
            api_key=os.getenv("GOOGLE_API_KEY"),
            http_options=HttpOptions(api_version="v1")
        )
        self.linkedin_api_key = os.getenv("LINKED_IN_API")
        self.harvest_base_url = "https://api.harvest-api.com"

    async def run(self, profile: UserProfile) -> CareerOutput:
        # First, try to get real job data from LinkedIn API
        jobs_data = await self._search_linkedin_jobs(profile)

        # If LinkedIn API fails or returns insufficient results, enhance with Gemini
        if len(jobs_data) < 3:
            gemini_jobs = await self._enhance_with_gemini(profile, jobs_data)
            jobs_data.extend(gemini_jobs)

        # Convert to JobMatch objects
        job_matches = [
            JobMatch(
                title=job["title"],
                company=job["company"],
                location=job["location"],
                salary_range=job.get("salary_range"),
                apply_url=job.get("apply_url")
            ) for job in jobs_data[:5]  # Limit to 5 jobs
        ]

        job_recommendations = JobRecommendations(
            job_matches=job_matches
        )

        return CareerOutput(job_recommendations=job_recommendations)

    def _generate_fallback_jobs(self, profile: UserProfile) -> list:
        """Generate fallback job data if Gemini fails"""
        base_jobs = [
            {"title": "Software Engineer", "company": "TechFlow"},
            {"title": "Frontend Developer", "company": "WebCraft"},
            {"title": "Data Analyst", "company": "DataInsights"},
            {"title": "Full Stack Developer", "company": "AppBuilder"},
            {"title": "DevOps Engineer", "company": "CloudTech"},
        ]

        # Adjust titles based on experience
        if profile.experience_years and profile.experience_years < 2:
            for job in base_jobs:
                if "Engineer" in job["title"]:
                    job["title"] = job["title"].replace("Engineer", "Intern")
                elif "Developer" in job["title"]:
                    job["title"] = "Junior " + job["title"]

        # Add location and salary range
        for job in base_jobs:
            job["location"] = profile.city
            experience_years = profile.experience_years or 0
            if experience_years < 2:
                job["salary_range"] = "$45,000 - $65,000"
            elif experience_years < 5:
                job["salary_range"] = "$65,000 - $85,000"
            else:
                job["salary_range"] = "$85,000 - $120,000"

        return base_jobs

    async def _search_linkedin_jobs(self, profile: UserProfile) -> list:
        """Search for real jobs using Harvest LinkedIn API based on user profile"""
        if not self.linkedin_api_key:
            return []

        headers = {"X-API-Key": self.linkedin_api_key}

        # Construct personalized search parameters
        search_query = profile.career_path

        try:
            # First, search for relevant companies in the user's city and industry
            company_url = f"{self.harvest_base_url}/linkedin/company-search"
            # Improve search query to find companies hiring for the user's career path
            company_search_terms = []

            # Add location
            if "new york" in profile.city.lower():
                company_search_terms.extend(["New York", "NYC", "Manhattan"])
            elif "houston" in profile.city.lower():
                company_search_terms.extend(["Houston", "Texas"])
            elif "austin" in profile.city.lower():
                company_search_terms.extend(["Austin", "Texas"])
            else:
                company_search_terms.append(profile.city)

            # Add career-relevant industries
            if "marketing" in profile.career_path.lower():
                company_search_terms.extend(["marketing", "advertising", "digital agency"])
            elif "software" in profile.career_path.lower():
                company_search_terms.extend(["technology", "software", "tech"])
            elif "data" in profile.career_path.lower():
                company_search_terms.extend(["analytics", "data", "business intelligence"])

            # Use the best search term
            search_term = company_search_terms[0] if company_search_terms else profile.city
            company_params = {"search": search_term}

            print(f"Searching companies: {company_url} with search='{search_term}'")
            company_response = requests.get(company_url, headers=headers, params=company_params, timeout=10)

            if company_response.status_code == 200:
                companies_data = company_response.json()
                companies = companies_data.get('elements', [])
                print(f"Found {len(companies)} companies")

                # Extract job opportunities from company data
                jobs = self._extract_jobs_from_companies(companies_data, profile)

                if jobs:
                    return jobs

            # If company search doesn't yield jobs, try job-specific search
            job_url = f"{self.harvest_base_url}/linkedin/job-search"
            job_params = {
                "keywords": search_query,
                "location": profile.city,
                "limit": 5
            }

            print(f"Searching jobs: {job_url}")
            job_response = requests.get(job_url, headers=headers, params=job_params, timeout=10)

            if job_response.status_code == 200:
                jobs_data = job_response.json()
                print(f"Job search successful: {len(jobs_data.get('jobs', []))} jobs found")
                return self._parse_harvest_job_response(jobs_data, profile)
            else:
                print(f"Harvest API error: {job_response.status_code} - {job_response.text[:200]}")
                return []

        except Exception as e:
            print(f"Harvest API call failed: {e}")
            return []

    async def _enhance_with_gemini(self, profile: UserProfile, existing_jobs: list) -> list:
        """Use Gemini to generate additional personalized job opportunities"""
        existing_companies = [job.get("company", "") for job in existing_jobs]

        prompt = f"""
        Generate {5 - len(existing_jobs)} additional job opportunities in {profile.city} for:
        - Career: {profile.career_path}
        - Experience: {profile.experience_years} years
        - Salary expectation: ${profile.salary}
        - Interests: {', '.join(profile.interests)}
        - Lifestyle: {profile.lifestyle}

        AVOID these companies already found: {', '.join(existing_companies)}

        Focus on companies that would appeal to someone interested in: {', '.join(profile.interests)}
        Consider their lifestyle preferences: {profile.lifestyle}

        Respond with ONLY a JSON object:
        {{
            "jobs": [
                {{
                    "title": "Specific Role Title",
                    "company": "Company Name",
                    "location": "{profile.city}",
                    "salary_range": "$X,000 - $Y,000",
                    "apply_url": "https://company.com/careers/job-id"
                }}
            ]
        }}
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-pro",
                contents=prompt,
                config=GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                    response_mime_type="application/json"
                )
            )
            result = json.loads(response.text.strip())
            return result.get("jobs", [])
        except Exception:
            return self._generate_fallback_jobs(profile)[:5 - len(existing_jobs)]

    def _get_experience_level(self, years: int) -> str:
        """Convert years of experience to LinkedIn experience level"""
        if years == 0:
            return "ENTRY_LEVEL"
        elif years <= 2:
            return "ASSOCIATE"
        elif years <= 5:
            return "MID_SENIOR"
        elif years <= 10:
            return "DIRECTOR"
        else:
            return "EXECUTIVE"

    def _extract_location_keywords(self, city: str) -> list:
        """Extract location-based search keywords"""
        city_lower = city.lower()
        if "houston" in city_lower:
            return ["energy", "oil", "space", "medical"]
        elif "austin" in city_lower:
            return ["tech", "startup", "music", "creative"]
        elif "denver" in city_lower:
            return ["outdoor", "health", "aerospace", "cannabis"]
        elif "seattle" in city_lower:
            return ["tech", "cloud", "gaming", "coffee"]
        else:
            return ["technology", "business"]


    def _extract_jobs_from_companies(self, companies_data: dict, profile: UserProfile) -> list:
        """Extract job opportunities from company search results"""
        jobs = []
        companies = companies_data.get("elements", [])

        for company in companies[:3]:  # Top 3 companies
            company_name = company.get("name", "")
            company_industry = company.get("industry", "")

            # Generate realistic job titles based on profile and company
            job_titles = self._generate_job_titles_for_company(profile, company_industry)

            for title in job_titles:
                job = {
                    "title": title,
                    "company": company_name,
                    "location": profile.city,
                    "salary_range": self._estimate_salary_range(profile, title)
                }
                jobs.append(job)

        return jobs

    def _generate_job_titles_for_company(self, profile: UserProfile, industry: str) -> list:
        """Generate relevant job titles based on career path and company industry"""
        career_lower = profile.career_path.lower()
        experience_prefix = ""

        if profile.experience_years < 2:
            experience_prefix = "Junior "
        elif profile.experience_years > 5:
            experience_prefix = "Senior "

        base_titles = []
        if "marketing" in career_lower:
            base_titles = ["Marketing Specialist", "Digital Marketing Manager", "Content Marketing Lead"]
        elif "software" in career_lower or "developer" in career_lower:
            base_titles = ["Software Engineer", "Full Stack Developer", "Frontend Developer"]
        elif "data" in career_lower:
            base_titles = ["Data Analyst", "Business Intelligence Analyst", "Data Scientist"]
        else:
            base_titles = [profile.career_path]

        return [f"{experience_prefix}{title}" for title in base_titles[:2]]

    def _parse_harvest_job_response(self, jobs_data: dict, profile: UserProfile) -> list:
        """Parse Harvest API job search response"""
        jobs = []
        job_listings = jobs_data.get("jobs", [])

        for job_listing in job_listings[:5]:
            job = {
                "title": job_listing.get("title", ""),
                "company": job_listing.get("company", {}).get("name", ""),
                "location": job_listing.get("location", profile.city),
                "salary_range": self._extract_salary_from_job(job_listing, profile),
                "apply_url": job_listing.get("apply_url")
            }
            jobs.append(job)

        return jobs

    def _extract_salary_from_job(self, job_listing: dict, profile: UserProfile) -> str:
        """Extract or estimate salary from job listing"""
        # Try to find salary in job posting
        salary_info = job_listing.get("salary", {})
        if salary_info and "min" in salary_info and "max" in salary_info:
            return f"${salary_info['min']:,} - ${salary_info['max']:,}"

        # Fall back to estimation
        return self._estimate_salary_range(profile, job_listing.get("title", ""))

    def _parse_linkedin_response(self, data: dict, profile: UserProfile) -> list:
        """Parse LinkedIn API response into our job format"""
        jobs = []
        job_elements = data.get("elements", [])

        for job_element in job_elements[:5]:
            job_details = job_element.get("jobPostingInfo", {})
            company_info = job_element.get("companyDetails", {})

            # Extract salary range if available
            salary_range = self._estimate_salary_range(profile, job_details.get("title", ""))

            job = {
                "title": job_details.get("title", ""),
                "company": company_info.get("companyName", ""),
                "location": job_details.get("formattedLocation", profile.city),
                "salary_range": salary_range,
                "apply_url": job_details.get("apply_url")
            }
            jobs.append(job)

        return jobs

    def _estimate_salary_range(self, profile: UserProfile, job_title: str) -> str:
        """Estimate salary range based on profile and job title"""
        base_salary = profile.salary

        # Adjust based on experience and job level
        if profile.experience_years < 2:
            min_sal = int(base_salary * 0.8)
            max_sal = int(base_salary * 1.2)
        elif profile.experience_years < 5:
            min_sal = int(base_salary * 1.1)
            max_sal = int(base_salary * 1.4)
        else:
            min_sal = int(base_salary * 1.3)
            max_sal = int(base_salary * 1.7)

        # Adjust for seniority in title
        title_lower = job_title.lower()
        if "senior" in title_lower or "lead" in title_lower:
            min_sal = int(min_sal * 1.2)
            max_sal = int(max_sal * 1.2)
        elif "principal" in title_lower or "staff" in title_lower:
            min_sal = int(min_sal * 1.4)
            max_sal = int(max_sal * 1.4)

        return f"${min_sal:,} - ${max_sal:,}"
