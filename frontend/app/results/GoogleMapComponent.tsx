"use client";

import { useEffect, useRef, useState } from "react";

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

interface GoogleMapComponentProps {
  center: { lat: number; lng: number };
  listings: Listing[];
  hoveredListing: number | null;
  selectedListing: number | null;
  onMarkerHover: (index: number | null) => void;
  onMarkerClick: (index: number | null) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

export default function GoogleMapComponent({
  center,
  listings,
  hoveredListing,
  selectedListing,
  onMarkerHover,
  onMarkerClick,
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setIsLoaded(false);
      return;
    }

    if (window.google) {
      setIsLoaded(true);
      return;
    }

    // Create the script loading function
    window.initGoogleMaps = () => {
      setIsLoaded(true);
    };

    // Load the script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initGoogleMaps;
    };
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();

  }, [isLoaded, center]);

  // Create/update markers separately to prevent unnecessary recreation
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create markers for listings with valid coordinates
    listings.filter(listing => listing.coords).forEach((listing, index) => {
      const marker = new window.google.maps.Marker({
        position: listing.coords!,
        map: mapInstanceRef.current,
        title: listing.address,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${(listing.match_score || 0)}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
        },
      });

      // Mouse events
      marker.addListener("mouseover", () => {
        onMarkerHover(listing.index || index);

        // Show tooltip with improved content
        const content = `
          <div style="padding: 8px; min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${listing.address}</div>
            <div style="color: #666; font-size: 13px; margin-bottom: 4px;">
              ${listing.rent ? `$${listing.rent}/mo` : ""} • Match: ${listing.match_score || 0}%
            </div>
            ${listing.matched_hobbies && listing.matched_hobbies.length > 0 ?
              `<div style="color: #4f46e5; font-size: 12px;">Matches: ${listing.matched_hobbies.join(', ')}</div>` : ''
            }
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      marker.addListener("mouseout", () => {
        onMarkerHover(null);
        infoWindowRef.current.close();
      });

      marker.addListener("click", () => {
        onMarkerClick(listing.index || index);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to markers if we have any
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      mapInstanceRef.current.fitBounds(bounds);

      // Prevent over-zooming for single markers
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, "idle", () => {
        if (mapInstanceRef.current.getZoom()! > 15) {
          mapInstanceRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [listings, onMarkerHover, onMarkerClick]);

  // Update marker styles based on hover/selection
  useEffect(() => {
    markersRef.current.forEach((marker, index) => {
      const listing = listings[index];
      if (!listing) return;

      let color = "#3b82f6"; // default blue
      let scale = 24;

      if (selectedListing === (listing.index || index)) {
        color = "#ef4444"; // red for selected
        scale = 28;
      } else if (hoveredListing === (listing.index || index)) {
        color = "#10b981"; // green for hovered
        scale = 26;
      }

      marker.setIcon({
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="${scale}" height="${scale}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${(listing.match_score || 0)}</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(scale, scale),
      });
    });
  }, [hoveredListing, selectedListing, listings]);

  // Center map when selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedListing !== null) {
      const listing = listings.find(l => (l.index || 0) === selectedListing);
      if (listing?.coords) {
        mapInstanceRef.current.panTo(listing.coords);
      }
    }
  }, [selectedListing, listings]);

  if (!isLoaded) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return (
      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "rgb(237, 237, 237)",
        padding: "2rem",
        textAlign: "center"
      }}>
        {!apiKey ? (
          <>
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>Map unavailable</div>
            <div style={{ fontSize: "14px", opacity: 0.7 }}>
              Google Maps API key not configured. Listings are still available in the sidebar.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>Loading Google Maps...</div>
            <div style={{ fontSize: "14px", opacity: 0.7 }}>Please wait while the map loads</div>
          </>
        )}
      </div>
    );
  }

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}