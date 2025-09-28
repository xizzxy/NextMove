"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Lazy-load react-leaflet bits client-side only
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false });
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, { ssr: false });
const Tooltip = dynamic(async () => (await import("react-leaflet")).Tooltip, { ssr: false });

// Google Maps component
const GoogleMapComponent = dynamic(() => import("./GoogleMapComponent"), { ssr: false });

// Light Map component
const LightMapComponent = dynamic(() => import("./LightMapComponent"), { ssr: false });

// Loading skeleton component
const LoadingSkeleton = dynamic(() => import("./LoadingSkeleton"), { ssr: false });

type Listing = {
  address: string;
  rent?: number;
  match_score?: number;
  reason?: string;
  coords?: { lat: number; lng: number };
  source_url?: string;
  amenities?: string[];
  min_credit_score?: number;
  matched_hobbies?: string[];
  index?: number;
};

type Job = {
  title: string;
  company: string;
  location: string;
  salary_range?: string;
  apply_url?: string;
  index?: number;
};

type Place = {
  name: string;
  type: string;
  tags: string[];
  match_score?: number;
  coords?: { lat: number; lng: number };
  index?: number;
};

type SortOption = "best_match" | "price_asc" | "price_desc" | "distance" | "salary_asc" | "salary_desc" | "relevance" | "closest";

type PlanData = {
  status: string;
  city: string;
  summary: any;
  housing_recommendations: Listing[];
  lifestyle?: any;
  finance?: any;
  job_recommendations?: any;
};

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("best_match");
  const [hoveredListing, setHoveredListing] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"apartments" | "jobs" | "places" | "map">("apartments");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const mapsProvider = process.env.NEXT_PUBLIC_MAPS_PROVIDER || "leaflet";
  const tileUrl = process.env.NEXT_PUBLIC_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = process.env.NEXT_PUBLIC_TILE_ATTRIBUTION || "&copy; OpenStreetMap contributors";
  const [tilesLoaded, setTilesLoaded] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("nextmove_result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUserProfile(parsed.profile);

        if (parsed.loading) {
          setLoading(true);
          setError(null);
          setData(null);
        } else if (parsed.error) {
          setLoading(false);
          setError(parsed.error);
          setData(null);
        } else if (parsed.data) {
          setLoading(false);
          setError(null);
          setData(parsed.data);
        } else {
          // No data yet but not in loading state, redirect to intake
          router.push("/intake");
        }
      } catch {
        // Invalid data, redirect to intake
        router.push("/intake");
      }
    } else {
      // No session data, redirect to intake
      router.push("/intake");
    }

    // Poll for storage changes since sessionStorage doesn't trigger storage events in same tab
    let pollInterval: NodeJS.Timeout | null = null;

    if (loading) {
      pollInterval = setInterval(() => {
        const newRaw = sessionStorage.getItem("nextmove_result");
        if (newRaw) {
          try {
            const newParsed = JSON.parse(newRaw);
            if (!newParsed.loading) {
              if (newParsed.error) {
                setLoading(false);
                setError(newParsed.error);
                setData(null);
              } else if (newParsed.data) {
                setLoading(false);
                setError(null);
                setData(newParsed.data);
              }
            }
          } catch {}
        }
      }, 500); // Check every 500ms
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [router, loading]);

  // Load map immediately when data is available
  useEffect(() => {
    if (data && !loading) {
      setMapLoaded(true);
      setMapVisible(true);
    }
  }, [data, loading]);

  // Synthesize realistic rent based on address hash
  const synthesizeRent = useCallback((address: string, city: string) => {
    const hash = address.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const cityLower = city.toLowerCase();
    let baseMin = 1200, baseMax = 3500;

    if (cityLower.includes('new york') || cityLower.includes('san francisco')) {
      baseMin = 2500; baseMax = 6000;
    } else if (cityLower.includes('houston') || cityLower.includes('austin') || cityLower.includes('dallas')) {
      baseMin = 1000; baseMax = 2800;
    } else if (cityLower.includes('los angeles') || cityLower.includes('seattle')) {
      baseMin = 2000; baseMax = 4500;
    }

    const range = baseMax - baseMin;
    const normalizedHash = Math.abs(hash) % 1000 / 1000;
    return Math.round(baseMin + (range * normalizedHash));
  }, []);

  // Calculate client-side match scores with new formula
  const calculateMatchScore = useCallback((listing: Listing) => {
    if (!userProfile) return { score: listing.match_score || 0, matchedHobbies: [] };

    const matchedHobbies: string[] = [];

    // Ensure listing has rent
    const listingRent = listing.rent || synthesizeRent(listing.address, data?.city || '');

    // Price fit (50% weight) - new formula
    let priceFit = 0;
    if (userProfile.budget) {
      if (listingRent <= userProfile.budget) {
        priceFit = 100;
      } else if (listingRent <= userProfile.budget * 1.5) {
        priceFit = 100 * (1 - (listingRent - userProfile.budget) / (userProfile.budget * 0.5));
      } else {
        priceFit = 0;
      }
    } else {
      priceFit = 50;
    }

    // Lifestyle overlap (40% weight) - Jaccard similarity
    let lifestyleOverlap = 0;
    if (userProfile.hobbies || userProfile.lifestyle) {
      const userInterests = [
        ...(userProfile.hobbies || '').toLowerCase().split(','),
        ...(userProfile.lifestyle || '').toLowerCase().split(',')
      ].map((s: string) => s.trim()).filter(Boolean);

      if (userInterests.length > 0) {
        const amenityText = (listing.amenities || []).join(' ').toLowerCase();
        const addressText = listing.address.toLowerCase();
        const reasonText = (listing.reason || '').toLowerCase();
        const fullText = `${amenityText} ${addressText} ${reasonText}`;

        const matchedInterests = new Set<string>();
        userInterests.forEach((interest: string) => {
          if (fullText.includes(interest)) {
            matchedInterests.add(interest);
            matchedHobbies.push(interest);
          }
        });

        // Jaccard similarity
        lifestyleOverlap = (matchedInterests.size / userInterests.length) * 100;
      }
    }

    // Distance score (10% weight) - simplified for now
    let distanceScore = 50; // Default score
    const addressLower = listing.address.toLowerCase();
    if (addressLower.includes('downtown') || addressLower.includes('center')) {
      distanceScore = 100;
    } else if (addressLower.includes('suburb') || addressLower.includes('outskirt')) {
      distanceScore = 20;
    }

    // Final score using specified formula
    const finalScore = Math.round(0.5 * priceFit + 0.4 * lifestyleOverlap + 0.1 * distanceScore);

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      matchedHobbies: [...new Set(matchedHobbies)],
      rent: listingRent
    };
  }, [userProfile, synthesizeRent, data?.city]);

  const listings = useMemo(() => {
    const rawListings = data?.housing_recommendations ?? [];
    const processedListings = rawListings.map((listing, index) => {
      const matchResult = calculateMatchScore(listing);
      return {
        ...listing,
        rent: matchResult.rent,
        match_score: matchResult.score,
        matched_hobbies: matchResult.matchedHobbies,
        index
      };
    });
    // Ensure exactly 15 apartments
    return processedListings.slice(0, 15);
  }, [data?.housing_recommendations, calculateMatchScore]);

  // Estimate salary based on role and experience
  const estimateSalary = useCallback((title: string, experience: number = 0, city: string) => {
    const titleLower = title.toLowerCase();
    let baseMin = 50000, baseMax = 70000;

    // Role-based salary ranges
    if (titleLower.includes('senior') || titleLower.includes('lead')) {
      baseMin = 90000; baseMax = 140000;
    } else if (titleLower.includes('principal') || titleLower.includes('staff')) {
      baseMin = 130000; baseMax = 200000;
    } else if (titleLower.includes('engineer') || titleLower.includes('developer')) {
      baseMin = 65000; baseMax = 95000;
    } else if (titleLower.includes('data scientist')) {
      baseMin = 75000; baseMax = 115000;
    } else if (titleLower.includes('product manager')) {
      baseMin = 80000; baseMax = 120000;
    } else if (titleLower.includes('designer')) {
      baseMin = 60000; baseMax = 90000;
    }

    // Experience adjustment
    const expMultiplier = 1 + (experience * 0.1);
    baseMin *= expMultiplier;
    baseMax *= expMultiplier;

    // City adjustment
    const cityLower = city.toLowerCase();
    if (cityLower.includes('new york') || cityLower.includes('san francisco')) {
      baseMin *= 1.4; baseMax *= 1.4;
    } else if (cityLower.includes('seattle') || cityLower.includes('los angeles')) {
      baseMin *= 1.2; baseMax *= 1.2;
    }

    const minK = Math.round(baseMin / 1000);
    const maxK = Math.round(baseMax / 1000);
    return `$${minK}k–$${maxK}k`;
  }, []);

  const jobs = useMemo(() => {
    const rawJobs = data?.job_recommendations?.job_matches ?? [];
    const processedJobs = rawJobs.map((job: any, index: number) => {
      let salaryRange = job.salary_range;

      // If no salary or shows $0, estimate it
      if (!salaryRange || salaryRange.includes('$0') || salaryRange === 'Salary not disclosed') {
        salaryRange = estimateSalary(job.title, userProfile?.experience || 0, data?.city || '');
      }

      return {
        ...job,
        salary_range: salaryRange,
        index
      };
    });
    // Ensure exactly 15 jobs
    return processedJobs.slice(0, 15);
  }, [data?.job_recommendations?.job_matches, estimateSalary, userProfile?.experience, data?.city]);

  // Calculate meaningful place match scores
  const calculatePlaceMatchScore = useCallback((place: any) => {
    if (!userProfile) return place.match_score || 50;

    const userInterests = [
      ...(userProfile.hobbies || '').toLowerCase().split(','),
      ...(userProfile.lifestyle || '').toLowerCase().split(',')
    ].map((s: string) => s.trim()).filter(Boolean);

    if (userInterests.length === 0) return 50;

    const placeTags = (place.tags || []).map((tag: string) => tag.toLowerCase());
    const placeName = place.name.toLowerCase();
    const allPlaceText = `${placeName} ${placeTags.join(' ')}`;

    // Relevance score (70% weight)
    let relevanceMatches = 0;
    userInterests.forEach((interest: string) => {
      if (allPlaceText.includes(interest)) {
        relevanceMatches++;
      }
    });

    const relevanceScore = (relevanceMatches / userInterests.length) * 100;

    // Distance score (30% weight) - simplified
    let distanceScore = 70; // Default
    if (placeName.includes('downtown') || placeName.includes('center')) {
      distanceScore = 100;
    } else if (placeName.includes('suburb')) {
      distanceScore = 40;
    }

    return Math.round(0.7 * relevanceScore + 0.3 * distanceScore);
  }, [userProfile]);

  const places = useMemo(() => {
    const places: Place[] = [];

    // Add primary neighborhood as a place
    if (data?.lifestyle?.primary_fit) {
      places.push({
        name: data.lifestyle.primary_fit.name,
        type: "Neighborhood",
        tags: data.lifestyle.primary_fit.tags || [],
        match_score: calculatePlaceMatchScore(data.lifestyle.primary_fit),
        index: 0
      });
    }

    // Add alternative neighborhoods
    if (data?.lifestyle?.alternatives) {
      data.lifestyle.alternatives.forEach((alt: any, index: number) => {
        places.push({
          name: alt.name,
          type: "Alternative Neighborhood",
          tags: alt.tags || [],
          match_score: calculatePlaceMatchScore(alt),
          index: index + 1
        });
      });
    }

    // Ensure exactly 10 places
    return places.slice(0, 10);
  }, [data?.lifestyle, calculatePlaceMatchScore]);

  const sortedListings = useMemo(() => {
    const sorted = [...listings];

    switch (sortOption) {
      case "best_match":
        return sorted.sort((a, b) => {
          const scoreA = a.match_score || 0;
          const scoreB = b.match_score || 0;
          if (scoreA === scoreB) {
            // Secondary sort by rent (ascending) if scores are equal
            const rentA = a.rent || Infinity;
            const rentB = b.rent || Infinity;
            return rentA - rentB;
          }
          return scoreB - scoreA;
        });
      case "price_asc":
        return sorted.sort((a, b) => {
          const aRent = a.rent;
          const bRent = b.rent;

          // Handle missing rent values - put them at the end
          if (aRent === undefined && bRent === undefined) return 0;
          if (aRent === undefined) return 1;
          if (bRent === undefined) return -1;

          if (aRent === bRent) {
            // Secondary sort by match score if rents are equal
            return (b.match_score || 0) - (a.match_score || 0);
          }
          return aRent - bRent;
        });
      case "price_desc":
        return sorted.sort((a, b) => {
          const aRent = a.rent;
          const bRent = b.rent;

          // Handle missing rent values - put them at the end
          if (aRent === undefined && bRent === undefined) return 0;
          if (aRent === undefined) return 1;
          if (bRent === undefined) return -1;

          if (aRent === bRent) {
            // Secondary sort by match score if rents are equal
            return (b.match_score || 0) - (a.match_score || 0);
          }
          return bRent - aRent;
        });
      case "distance":
        // Enhanced distance sort - currently using match score as proxy
        // In future, this could calculate actual distance from city center
        return sorted.sort((a, b) => {
          const scoreA = a.match_score || 0;
          const scoreB = b.match_score || 0;
          if (scoreA === scoreB) {
            // Secondary sort by rent (ascending) for consistent ordering
            const rentA = a.rent || Infinity;
            const rentB = b.rent || Infinity;
            return rentA - rentB;
          }
          return scoreB - scoreA;
        });
      default:
        return sorted;
    }
  }, [listings, sortOption]);

  const sortedJobs = useMemo(() => {
    const sorted = [...jobs];

    switch (sortOption) {
      case "best_match":
        return sorted; // Jobs don't have match scores, keep original order
      case "salary_asc":
        return sorted.sort((a, b) => {
          const salaryA = extractSalaryValue(a.salary_range);
          const salaryB = extractSalaryValue(b.salary_range);
          return salaryA - salaryB;
        });
      case "salary_desc":
        return sorted.sort((a, b) => {
          const salaryA = extractSalaryValue(a.salary_range);
          const salaryB = extractSalaryValue(b.salary_range);
          return salaryB - salaryA;
        });
      default:
        return sorted;
    }
  }, [jobs, sortOption]);

  const sortedPlaces = useMemo(() => {
    const sorted = [...places];

    switch (sortOption) {
      case "relevance":
      case "best_match":
        return sorted.sort((a, b) => {
          const scoreA = a.match_score || 0;
          const scoreB = b.match_score || 0;
          return scoreB - scoreA;
        });
      case "closest":
        // For now, just sort by match score (could implement actual distance later)
        return sorted.sort((a, b) => {
          const scoreA = a.match_score || 0;
          const scoreB = b.match_score || 0;
          return scoreB - scoreA;
        });
      default:
        return sorted;
    }
  }, [places, sortOption]);

  // Helper function to extract numeric value from salary range
  const extractSalaryValue = (salaryRange?: string): number => {
    if (!salaryRange) return 0;
    const numbers = salaryRange.match(/\d{1,3}(?:,\d{3})*/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0].replace(/,/g, ''));
    }
    return 0;
  };

  const markers = useMemo(() => {
    return listings.filter(
      (l) => l.coords && typeof l.coords.lat === "number" && typeof l.coords.lng === "number"
    );
  }, [listings]);

  const center = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].coords!.lat, markers[0].coords!.lng];
    // default center for "empty" map; Houston coords as fallback
    return [29.7604, -95.3698];
  }, [markers]);

  const handleRetry = () => {
    router.push("/intake");
  };

  // Removed Fast Mode - no longer needed

  // Show loading skeleton while loading
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Show error state with retry options
  if (error) {
    return (
      <main className="screen error-screen" role="main">
        <div className="brand">NextMove</div>
        <div className="bg">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="blob b3" />
          <div className="ambient a1" />
          <div className="p p1" />
          <div className="p p2" />
          <div className="p p3" />
        </div>

        <div className="error-container">
          <div className="error-content">
            <h1 className="error-title">
              Something went wrong
            </h1>
            <p className="error-message">
              We couldn't generate your plan right now. Please try again.
            </p>
            <div className="error-actions">
              <button className="retry-button" onClick={handleRetry}>
                Try Again
              </button>
              <button className="retry-button" onClick={handleRetry}>
                ← Back to Start
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="screen" role="main">
      {/* Brand */}
      <div className="brand">NextMove</div>

      {/* Background effects */}
      <div className="bg">
        {/* Gradient circles */}
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
        <div className="blob b5" />
        {/* Ambient lighting */}
        <div className="ambient a1" />
        <div className="ambient a2" />
        {/* Floating particles */}
        <div className="p p1" />
        <div className="p p2" />
        <div className="p p3" />
        <div className="p p4" />
        <div className="p p5" />
      </div>

      <div className="results-container">
        {/* Header */}
        <header className="header">
          <div className="header-nav">
            <button
              className="back-button"
              onClick={() => router.push("/intake")}
              aria-label="Go back to intake form"
            >
              ← Back
            </button>
          </div>
          <h1 className="title">Your plan for {data?.city ?? "—"}</h1>
          {data?.summary && (
            <div className="summary-section">
              <div className="summary-item">
                <span className="summary-label">Cash needed upfront:</span>
                <span className="summary-value">${data.summary.cash_needed ?? "—"}</span>
                <span className="summary-detail">Estimated upfront cost to move (first month + deposit + moving fees)</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Best neighborhood:</span>
                <span className="summary-value">{data.summary.neighborhood?.name ?? "Downtown"}</span>
                <span className="summary-detail">Best fit based on your interests</span>
              </div>
            </div>
          )}
        </header>

        {/* Main content */}
        <div className="content-wrapper">
          {/* Tabbed Interface */}
          <div className="main-content">
            {/* Tab Navigation */}
            <div className="tab-nav">
              <button
                className={`tab-button ${activeTab === "apartments" ? "active" : ""}`}
                onClick={() => setActiveTab("apartments")}
              >
                Apartments ({sortedListings.length})
              </button>
              <button
                className={`tab-button ${activeTab === "jobs" ? "active" : ""}`}
                onClick={() => setActiveTab("jobs")}
              >
                Jobs ({sortedJobs.length})
              </button>
              <button
                className={`tab-button ${activeTab === "places" ? "active" : ""}`}
                onClick={() => setActiveTab("places")}
              >
                Places ({sortedPlaces.length})
              </button>
              {mapVisible && (
                <button
                  className={`tab-button map-tab ${activeTab === "map" ? "active" : ""}`}
                  onClick={() => setActiveTab("map")}
                >
                  🗺️ Map
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Apartments Tab */}
              {activeTab === "apartments" && (
                <div className="tab-panel">
                  <div className="tab-header">
                    <select
                      className="sort-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                    >
                      <option value="best_match">Best Match</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="distance">Distance</option>
                    </select>
                  </div>

                  <div className="items-grid">
                    {sortedListings.map((listing, i) => (
                      <div
                        key={listing.index}
                        data-listing-index={listing.index}
                        className={`item-card apartment-card ${
                          hoveredListing === listing.index ? 'hovered' : ''
                        } ${
                          selectedListing === listing.index ? 'selected' : ''
                        }`}
                        onMouseEnter={() => setHoveredListing(listing.index ?? null)}
                        onMouseLeave={() => setHoveredListing(null)}
                        onClick={() => setSelectedListing(listing.index)}
                      >
                        <div className="item-header">
                          <div className="item-title">{listing.address}</div>
                          <div className="item-meta">
                            {listing.rent ? `$${listing.rent}/mo` : ""}
                            <br />
                            Match: {listing.match_score || 0}%
                          </div>
                        </div>

                        {listing.reason && (
                          <div className="item-description">{listing.reason}</div>
                        )}

                        {listing.matched_hobbies && listing.matched_hobbies.length > 0 && (
                          <div className="matched-hobbies">
                            <span className="hobbies-label">Matches your interests:</span>
                            <div className="hobby-chips">
                              {listing.matched_hobbies.map((hobby: string, idx: number) => (
                                <span key={idx} className="hobby-chip">{hobby}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {listing.source_url && (
                          <a
                            href={listing.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="item-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View listing ↗
                          </a>
                        )}
                      </div>
                    ))}

                    {sortedListings.length === 0 && (
                      <div className="no-items">No apartments available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Jobs Tab */}
              {activeTab === "jobs" && (
                <div className="tab-panel">
                  <div className="tab-header">
                    <select
                      className="sort-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                    >
                      <option value="best_match">Best Match</option>
                      <option value="salary_asc">Salary: Low to High</option>
                      <option value="salary_desc">Salary: High to Low</option>
                    </select>
                  </div>

                  <div className="items-grid">
                    {sortedJobs.map((job, i) => (
                      <div key={job.index} className="item-card job-card">
                        <div className="item-header">
                          <div className="item-title">{job.title}</div>
                          <div className="item-meta">
                            {job.salary_range || "Salary not disclosed"}
                          </div>
                        </div>

                        <div className="job-details">
                          <div className="job-company">{job.company}</div>
                          <div className="job-location">{job.location}</div>
                        </div>

                        {job.apply_url && (
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noreferrer"
                            className="item-link"
                          >
                            Apply now ↗
                          </a>
                        )}
                      </div>
                    ))}

                    {sortedJobs.length === 0 && (
                      <div className="no-items">No job listings available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Places Tab */}
              {activeTab === "places" && (
                <div className="tab-panel">
                  <div className="tab-header">
                    <select
                      className="sort-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="closest">Closest</option>
                    </select>
                  </div>

                  <div className="items-grid">
                    {sortedPlaces.map((place, i) => (
                      <div key={place.index} className="item-card place-card">
                        <div className="item-header">
                          <div className="item-title">{place.name}</div>
                          <div className="item-meta">
                            {place.type}
                            {place.match_score && (
                              <>
                                <br />
                                Match: {place.match_score}%
                              </>
                            )}
                          </div>
                        </div>

                        {place.tags && place.tags.length > 0 && (
                          <div className="place-tags">
                            {place.tags.map((tag, idx) => (
                              <span key={idx} className="place-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {sortedPlaces.length === 0 && (
                      <div className="no-items">No places available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Map Tab */}
              {activeTab === "map" && mapLoaded && (
                <div className="tab-panel map-panel">
                  <div className="map-container">
                    {mapsProvider === "google" ? (
                      <GoogleMapComponent
                        center={{ lat: center[0], lng: center[1] }}
                        listings={sortedListings}
                        hoveredListing={hoveredListing}
                        selectedListing={selectedListing}
                        onMarkerHover={setHoveredListing}
                        onMarkerClick={setSelectedListing}
                      />
                    ) : mapsProvider === "leaflet_light" ? (
                      <LightMapComponent
                        center={{ lat: center[0], lng: center[1] }}
                        listings={sortedListings}
                        hoveredListing={hoveredListing}
                        selectedListing={selectedListing}
                        onMarkerHover={setHoveredListing}
                        onMarkerClick={setSelectedListing}
                      />
                    ) : (
                      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                        {!mapReady && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            zIndex: 1000,
                            fontSize: '16px'
                          }}>
                            Loading map…
                          </div>
                        )}
                        {/* @ts-ignore - Dynamic import typing issues */}
                        <MapContainer
                          center={center}
                          zoom={12}
                          style={{ height: '100dvh', minHeight: '560px', width: '100%' }}
                          whenReady={() => {
                            setMapReady(true);
                            // Fit bounds after markers load
                            setTimeout(() => {
                              if (markers.length > 0) {
                                const bounds = markers.map(m => [m.coords!.lat, m.coords!.lng]);
                                // Map will auto-fit to bounds
                              }
                            }, 100);
                          }}
                        >
                          {/* @ts-ignore */}
                          <TileLayer
                            url={tileUrl}
                            attribution={tileAttribution}
                            maxZoom={19}
                            maxNativeZoom={19}
                            updateWhenIdle={true}
                            updateWhenZooming={false}
                            keepBuffer={2}
                            detectRetina={true}
                            eventHandlers={{
                              tileload: () => {
                                setTilesLoaded(prev => {
                                  const newCount = prev + 1;
                                  if (newCount >= 8) {
                                    setTimeout(() => setMapReady(true), 100);
                                  }
                                  return newCount;
                                });
                              }
                            }}
                          />
                          {markers.map((m, i) => {
                            const isHovered = hoveredListing === m.index;
                            const isSelected = selectedListing === m.index;
                            return (
                              // @ts-ignore
                              <Marker
                                key={i}
                                position={[m.coords!.lat, m.coords!.lng]}
                                zIndexOffset={isSelected ? 1000 : isHovered ? 500 : 0}
                                eventHandlers={{
                                  mouseover: () => setHoveredListing(m.index ?? null),
                                  mouseout: () => setHoveredListing(null),
                                  click: () => {
                                    setSelectedListing(m.index ?? null);
                                    // Scroll to card
                                    const cardElement = document.querySelector(`[data-listing-index="${m.index}"]`);
                                    if (cardElement) {
                                      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }
                                }}
                              >
                                {/* @ts-ignore */}
                                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                  <div style={{ fontSize: 12 }}>
                                    <strong>{m.address}</strong>
                                    <br />
                                    {m.rent ? `$${m.rent}/mo` : ""} • Match: {m.match_score || 0}%
                                    <br />
                                    {m.reason || ""}
                                  </div>
                                </Tooltip>
                              </Marker>
                            );
                          })}
                        </MapContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map Loading State */}
              {activeTab === "map" && !mapLoaded && (
                <div className="tab-panel">
                  <div className="map-loading">
                    <div className="map-loading-spinner"></div>
                    <div className="map-loading-text">Loading interactive map...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(html, body) {
          margin: 0;
          padding: 0;
          background: #000;
        }

        .screen {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #000;
          display: flex;
          flex-direction: column;
        }

        /* Brand */
        .brand {
          position: absolute;
          top: 32px;
          left: 32px;
          z-index: 20;
          font-family: "Forma", "Forma Fallback", Arial, Helvetica, sans-serif;
          font-size: 24px;
          font-weight: 400;
          color: rgb(237, 237, 237);
          text-shadow: 0 10px 25px rgba(147, 197, 253, 0.2);
        }

        /* Background effects */
        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.35;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(64px);
        }

        .b1 {
          width: 384px;
          height: 384px;
          top: 22%;
          left: 18%;
          background: radial-gradient(
            circle at bottom right,
            rgba(147, 197, 253, 0.08),
            rgba(196, 181, 253, 0.06)
          );
        }
        .b2 {
          width: 320px;
          height: 320px;
          top: 28%;
          right: 20%;
          background: radial-gradient(
            circle at bottom left,
            rgba(199, 210, 254, 0.1),
            rgba(191, 219, 254, 0.08)
          );
        }
        .b3 {
          width: 288px;
          height: 288px;
          bottom: 22%;
          left: 26%;
          background: radial-gradient(
            circle at top right,
            rgba(196, 181, 253, 0.07),
            rgba(221, 214, 254, 0.09)
          );
        }
        .b4 {
          width: 256px;
          height: 256px;
          top: 50%;
          right: 28%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at top left,
            rgba(165, 243, 252, 0.07),
            rgba(219, 234, 254, 0.08)
          );
        }
        .b5 {
          width: 352px;
          height: 352px;
          bottom: 28%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle at bottom right,
            rgba(226, 232, 240, 0.06),
            rgba(199, 210, 254, 0.07)
          );
        }

        .ambient {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.04;
        }
        .a1 {
          width: 1200px;
          height: 1200px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(219, 234, 254, 0.05),
            rgba(243, 232, 255, 0.03),
            transparent 70%
          );
        }
        .a2 {
          width: 800px;
          height: 800px;
          top: 18%;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(224, 231, 255, 0.04),
            rgba(237, 233, 254, 0.02),
            transparent 70%
          );
        }

        .p {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          animation: pulse 2s infinite ease-in-out;
          opacity: 0.6;
        }
        .p1 {
          width: 4px;
          height: 4px;
          left: 20%;
          top: 30%;
          background: rgba(191, 219, 254, 0.7);
          animation-delay: 0.2s;
        }
        .p2 {
          width: 8px;
          height: 8px;
          left: 72%;
          top: 28%;
          background: rgba(196, 181, 253, 0.7);
          animation-delay: 0.6s;
        }
        .p3 {
          width: 6px;
          height: 6px;
          left: 55%;
          top: 62%;
          background: rgba(165, 243, 252, 0.7);
          animation-delay: 1s;
        }
        .p4 {
          width: 4px;
          height: 4px;
          left: 35%;
          top: 70%;
          background: rgba(199, 210, 254, 0.7);
          animation-delay: 0.8s;
        }
        .p5 {
          width: 6px;
          height: 6px;
          left: 15%;
          top: 55%;
          background: rgba(221, 214, 254, 0.7);
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.9;
          }
        }

        /* Results container */
        .results-container {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding-top: 80px;
        }

        .header {
          padding: 1rem 2rem;
          margin-bottom: 1rem;
        }

        .header-nav {
          margin-bottom: 1rem;
        }

        .back-button {
          padding: 10px 20px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.12);
          color: rgb(255, 255, 255);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .back-button:active {
          transform: translateY(0);
        }

        .title {
          margin: 0;
          font-family: "Forma", "Forma Fallback", Arial, Helvetica, sans-serif;
          font-weight: 400;
          font-size: 36px;
          color: rgb(237, 237, 237);
          text-shadow: 0 12px 28px rgba(196, 181, 253, 0.3);
        }

        .summary-section {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-label {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 15px;
          color: rgb(136, 136, 136);
          font-weight: 500;
        }

        .summary-value {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: rgb(237, 237, 237);
          text-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .summary-detail {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          color: rgb(136, 136, 136);
          opacity: 0.8;
        }

        /* Content wrapper */
        .content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin: 0 2rem 2rem 2rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.35);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Tab Navigation */
        .tab-nav {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
          padding: 0.5rem 1rem;
          gap: 0.5rem;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: rgb(200, 200, 200);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(6px);
        }

        .tab-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          color: rgb(255, 255, 255);
        }

        .tab-button.active {
          background: rgba(147, 197, 253, 0.2);
          border-color: rgba(147, 197, 253, 0.5);
          color: rgb(147, 197, 253);
          font-weight: 600;
        }

        .tab-button.map-tab {
          margin-left: auto;
        }

        /* Tab Content */
        .tab-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tab-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tab-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
        }

        .sort-select {
          width: 200px;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
          color: rgb(255, 255, 255);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 15px;
          font-weight: 500;
          backdrop-filter: blur(6px);
          outline: none;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .sort-select:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sort-select:focus {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .sort-select option {
          background: #1a1a1a;
          color: rgb(237, 237, 237);
        }

        /* Items Grid */
        .items-grid {
          flex: 1;
          overflow: auto;
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          align-content: start;
        }

        .item-card {
          padding: 1.5rem;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          min-height: fit-content;
          display: flex;
          flex-direction: column;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .item-card:hover,
        .item-card.hovered {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(147, 197, 253, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .item-card.selected {
          background: rgba(147, 197, 253, 0.15);
          border-color: rgba(147, 197, 253, 0.8);
          box-shadow: 0 0 20px rgba(147, 197, 253, 0.3);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .item-title {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-weight: 600;
          font-size: 19px;
          color: rgb(255, 255, 255);
          line-height: 1.5;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          flex: 1;
          margin-right: 1rem;
        }

        .item-meta {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgb(200, 200, 200);
          text-align: right;
          line-height: 1.5;
          flex-shrink: 0;
        }

        .item-description {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          color: rgb(180, 180, 180);
          font-size: 16px;
          margin-bottom: 1rem;
          line-height: 1.5;
          flex-grow: 1;
        }

        .matched-hobbies {
          margin: 0.75rem 0 0.5rem 0;
        }

        .hobbies-label {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgb(200, 200, 200);
          display: block;
          margin-bottom: 8px;
        }

        .hobby-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .hobby-chip {
          padding: 4px 10px;
          background: rgba(147, 197, 253, 0.25);
          border: 1px solid rgba(147, 197, 253, 0.5);
          border-radius: 14px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 12px;
          color: rgba(147, 197, 253, 1);
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .item-link {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: rgba(147, 197, 253, 1);
          text-decoration: none;
          transition: color 0.2s ease;
          margin-top: auto;
          display: inline-block;
          align-self: flex-start;
        }

        .item-link:hover {
          color: rgba(199, 210, 254, 1);
          text-decoration: underline;
        }

        .no-items {
          grid-column: 1 / -1;
          padding: 3rem;
          text-align: center;
          color: rgb(136, 136, 136);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 16px;
        }

        /* Job specific styles */
        .job-details {
          margin-bottom: 1rem;
        }

        .job-company {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: rgb(219, 234, 254);
          margin-bottom: 0.25rem;
        }

        .job-location {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 14px;
          color: rgb(180, 180, 180);
        }

        /* Place specific styles */
        .place-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .place-tag {
          padding: 0.25rem 0.75rem;
          background: rgba(196, 181, 253, 0.2);
          border: 1px solid rgba(196, 181, 253, 0.4);
          border-radius: 12px;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 12px;
          color: rgba(196, 181, 253, 1);
          font-weight: 500;
        }

        /* Map styles */
        .map-panel {
          padding: 0;
        }

        .map-container {
          height: 100dvh;
          min-height: 560px;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .map-loading {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          color: rgb(200, 200, 200);
          gap: 1rem;
        }

        .map-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(147, 197, 253, 0.3);
          border-top: 3px solid rgba(147, 197, 253, 1);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .map-loading-text {
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          color: rgb(200, 200, 200);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error state styles */
        .error-screen {
          align-items: center;
          justify-content: center;
        }

        .error-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 600px;
          padding: 2rem;
          margin: 0 auto;
        }

        .error-content {
          text-align: center;
          padding: 3rem 2rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .error-title {
          margin: 0 0 1rem 0;
          font-family: "Forma", "Forma Fallback", Arial, Helvetica, sans-serif;
          font-weight: 400;
          font-size: 36px;
          color: rgb(255, 255, 255);
          text-shadow: 0 12px 28px rgba(196, 181, 253, 0.3);
        }

        .error-message {
          margin: 0 0 2rem 0;
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 18px;
          color: rgb(200, 200, 200);
          line-height: 1.6;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .retry-button {
          padding: 12px 24px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.12);
          color: rgb(255, 255, 255);
          font-family: "Geist", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }


        @media (max-width: 768px) {
          .title {
            font-size: 28px;
          }

          .results-container {
            padding-top: 60px;
          }

          .content-wrapper {
            margin: 0 1rem 1rem 1rem;
          }

          .tab-nav {
            flex-wrap: wrap;
            gap: 0.25rem;
          }

          .tab-button {
            padding: 0.5rem 1rem;
            font-size: 14px;
          }

          .items-grid {
            grid-template-columns: 1fr;
            padding: 0.5rem;
            gap: 0.75rem;
          }

          .sort-select {
            width: 150px;
          }

          .error-title {
            font-size: 28px;
          }

          .error-message {
            font-size: 16px;
          }

          .error-actions {
            flex-direction: column;
            align-items: center;
          }

          .retry-button {
            width: 200px;
          }
        }
      `}</style>
    </main>
  );
}
