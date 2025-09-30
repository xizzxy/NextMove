
# NextMove 🏡

Built over 36 hours during ShellHacks 2025 in Miami, FL, NextMove transforms hours of scattered research into one comprehensive search. Our web application leverages 4 parallel AI agents to consolidate everything you need to relocate with confidence—all in one place.

## 🎯 What It Does

**Stop juggling dozens of websites and spreadsheets.** NextMove provides a one-stop shop for your entire relocation journey through four specialized AI agents working simultaneously:

- **Financial Agent**: Calculates upfront moving costs (first month's rent, security deposit, moving expenses) and recommends a sensible monthly rent budget based on the 30% rule
- **Career Agent**: Discovers job opportunities in your target city that match your qualifications and career goals
- **Lifestyle Agent**: Identifies best-fit neighborhoods based on your interests, lifestyle preferences, and priorities
- **Housing Agent**: Finds apartments that meet your requirements in your preferred areas

**What typically takes hours of research across multiple platforms—budgeting calculators, job boards, neighborhood reviews, apartment listings—NextMove delivers in a single, comprehensive search.**

## ✨ Features

- **One Search, Complete Results**: Get financial planning, job matches, neighborhood recommendations, and housing options all at once
- **Parallel Agent Architecture**: Four AI agents work simultaneously to gather comprehensive relocation data while you wait
- **Personalized Recommendations**: Tailored suggestions based on your unique preferences and circumstances
- **Intuitive Interface**: Clean, responsive UI built with Next.js and React for seamless user experience
- **Real-World Data Integration**: Leverages Google Maps, Google Places, HarvestAPI(LinkedIn Scraper), and Mapbox APIs for accurate, up-to-date information
- **Time-Saving**: Condenses what would be hours of individual searches into minutes

## 🛠️ Built With

- [Google ADK](https://ai.google.dev/adk) - AI agent development framework
- [Google Generative AI SDK](https://ai.google.dev/gemini-api/docs/sdks) - SDK for building with Gemini models
- [Next.js](https://nextjs.org/) - React framework for the frontend
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Google Maps API](https://developers.google.com/maps) - Location and mapping data
- [Google Places API](https://developers.google.com/maps/documentation/places) - Local business information
- [Harvest API](https://harvest-api.com/) - Job listings and career data
- [Mapbox API](https://www.mapbox.com/) - Mapping for apartment locations
- Python - Backend logic and agent orchestration

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- API keys for Google Gen AI, Google Maps, Harvest, and Mapbox

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/nextmove.git
cd NextMove

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your API keys to .env
```
### Running the Application

You'll need two terminal windows/tabs running simultaneously:

**Terminal 1 - Backend:**
```bash
uvicorn backend.main:app --reload --port 8000
```
**Terminal 2 - Frontend:**
```
cd frontend
npm run dev
```
The frontend will be available at http://localhost:3000

**Built with ❤️ at ShellHacks 2025**










