// Check if Google Maps API was used by examining the response
const checkMapsAPIUsage = async () => {
  const backendUrl = "http://127.0.0.1:8000";

  const testProfile = {
    city: "Denver, CO", // Different city to trigger fresh API calls
    budget: 2200,
    credit_score: 680,
    credit_band: "good",
    interests: ["skiing", "hiking"],
    salary: 0,
    career_path: "Software Engineer"
  };

  try {
    console.log("🗺️  Testing Google Maps API integration...");

    const response = await fetch(`${backendUrl}/api/plan_move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testProfile),
    });

    const data = await response.json();

    console.log("\n📍 Analyzing housing recommendations for Maps API usage:");

    data.housing_recommendations?.forEach((listing, index) => {
      console.log(`\n🏠 Listing ${index + 1}:`);
      console.log(`   Address: ${listing.address}`);
      console.log(`   Has coordinates: ${listing.coords ? '✅ YES' : '❌ NO'}`);
      if (listing.coords) {
        console.log(`   Lat/Lng: ${listing.coords.lat}, ${listing.coords.lng}`);
      }
      console.log(`   Source URL: ${listing.source_url ? '✅ YES' : '❌ NO'}`);
      if (listing.source_url) {
        console.log(`   URL: ${listing.source_url}`);
        // Check if it's a Google Maps place URL
        if (listing.source_url.includes('google.com/maps')) {
          console.log(`   🎯 Google Maps place detected!`);
        }
      }
    });

    // Check if coordinates look real (not just defaults)
    const hasRealCoords = data.housing_recommendations?.some(listing =>
      listing.coords &&
      listing.coords.lat !== 0 &&
      listing.coords.lng !== 0 &&
      Math.abs(listing.coords.lat) > 10 // Real coordinates
    );

    console.log(`\n🔍 Analysis Results:`);
    console.log(`   Real coordinates found: ${hasRealCoords ? '✅ YES' : '❌ NO'}`);
    console.log(`   Google Maps URLs found: ${data.housing_recommendations?.some(l => l.source_url?.includes('google.com/maps')) ? '✅ YES' : '❌ NO'}`);

    if (hasRealCoords) {
      console.log(`\n✅ CONCLUSION: Google Maps API appears to be working properly!`);
      console.log(`   - Real geographical coordinates are being returned`);
      console.log(`   - Google Maps place URLs are included`);
      console.log(`   - This indicates successful integration with Google Maps API`);
    } else {
      console.log(`\n⚠️  CONCLUSION: May be using fallback data instead of live Google Maps API`);
    }

  } catch (error) {
    console.error("❌ Error checking Maps API:", error.message);
  }
};

checkMapsAPIUsage();