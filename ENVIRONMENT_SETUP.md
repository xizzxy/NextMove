# NextMove Environment Setup & Security Guide

⚠️ **CRITICAL SECURITY**: Never commit API keys to version control!

## Quick Setup

1. **Backend**: Copy `.env.example` to `.env` and add your API keys
2. **Frontend**: Copy `frontend/.env.local.example` to `frontend/.env.local` and add your keys
3. **Verification**: Keys should never appear in example files or git commits

## Required Environment Variables

### Backend (.env file in root directory)

```bash
# Google AI/Gemini API Key (required for all AI features)
GOOGLE_API_KEY="your_google_ai_api_key_here"

# Google Cloud settings (for Vertex AI)
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=global
export GOOGLE_GENAI_USE_VERTEXAI=True

# LinkedIn API for job search (optional - falls back to mocks)
LINKED_IN_API="your_linkedin_harvest_api_key"

# Google Maps API for backend Places search (optional - falls back to mocks)
GOOGLE_MAPS_API_KEY="your_google_maps_server_api_key"
```

### Frontend (frontend/.env.local file)

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"

# Google Maps JavaScript API key (for frontend maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_js_api_key"

# Map provider selection: "google" or "leaflet"
NEXT_PUBLIC_MAPS_PROVIDER="google"
```

## API Keys Setup

### 1. Google AI/Gemini API Key

- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Set as `GOOGLE_API_KEY` in backend .env

### 2. Google Maps API Keys

You need TWO Google Maps API keys:

- **Backend (Places API)**: For searching real apartment listings
- **Frontend (JavaScript API)**: For displaying interactive maps

#### Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API (New)
3. Create API keys with appropriate restrictions:
   - Backend key: Restrict to Places API
   - Frontend key: Restrict to Maps JavaScript API + your domain

### 3. LinkedIn API (Optional)

- Get API access from [Harvest API](https://api.harvest-api.com) or similar LinkedIn data provider
- Set as `LINKED_IN_API` in backend .env

## Map Provider Configuration

### Using Google Maps (Recommended)

```bash
NEXT_PUBLIC_MAPS_PROVIDER="google"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_frontend_maps_key"
```

### Using Leaflet (Fallback)

```bash
NEXT_PUBLIC_MAPS_PROVIDER="leaflet"
# No additional keys required
```

## Security Best Practices

### 🔐 Critical Security Measures

1. **Immediate Key Rotation**: If you've accidentally exposed API keys, rotate them immediately in Google Cloud Console
2. **Never Hardcode Keys**: All keys must come from environment variables
3. **Use .gitignore**: Ensure `.env`, `.env.local`, and all environment files are in `.gitignore`
4. **Separate Environments**: Use different keys for development/staging/production
5. **API Key Restrictions**:
   - Restrict backend keys to server IPs
   - Restrict frontend keys to specific domains
   - Enable only required APIs per key

### 🛡️ Additional Security

- **Monitor Usage**: Set up billing alerts and usage monitoring
- **Regular Rotation**: Rotate API keys quarterly
- **Principle of Least Privilege**: Only grant necessary API access
- **Audit Access**: Regularly review who has access to production keys

## Graceful Fallbacks

The application is designed to degrade gracefully when API keys are missing:

1. **No Google AI key**: App will not start (required)
2. **No Google Maps backend key**: Falls back to Gemini-generated mock apartments
3. **No LinkedIn API key**: Falls back to mock job listings
4. **No Google Maps frontend key**: Falls back to Leaflet maps
5. **Invalid map provider**: Defaults to Leaflet

## Development Setup

1. **Backend**:

   ```bash
   cd backend
   pip install -r requirements.txt
   # Copy .env.example to .env and add your keys
   uvicorn main:app --reload
   or
   uvicorn backend.main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Copy .env.local.example to .env.local and add your keys
   netstat -ano | findstr :3000
   npm run dev
   ```

## Testing the Setup

Use this example input to test the complete flow:

```json
{
  "name": "Jessica Thompson",
  "location": "Nashville, TN",
  "hobbies": "live music, food trucks, art galleries",
  "career": "Graphic Designer",
  "experience": 3,
  "budget": 1500,
  "credit": "705"
}
```

Expected transformed payload:

```json
{
  "city": "Nashville, TN",
  "budget": 1500,
  "credit_score": 705,
  "credit_band": "good",
  "interests": ["live music", "food trucks", "art galleries"],
  "career_path": "Graphic Designer",
  "salary": 0,
  "experience_years": 3
}
```

## Troubleshooting

### Common Issues:

1. **"Maps provider not working"**: Check `NEXT_PUBLIC_MAPS_PROVIDER` value in frontend .env.local
2. **"No apartments found"**: Verify Google Maps backend API key and Places API is enabled
3. **"Jobs not loading"**: LinkedIn API might be down, check fallback mocks
4. **"Credit band not calculated"**: Ensure both `credit_score` and `credit_band` logic is working
5. **"Google Maps not loading"**: Check frontend API key and JavaScript API is enabled

### Debug Mode:

- Check browser console for frontend errors
- Check backend logs for API call failures
- Verify environment variables are loaded correctly
- Test with `NEXT_PUBLIC_MAPS_PROVIDER="leaflet"` as fallback

### Emergency Key Rotation:

If keys are compromised:

1. Go to Google Cloud Console immediately
2. Delete the compromised keys
3. Create new keys with proper restrictions
4. Update your environment files
5. Restart all services
