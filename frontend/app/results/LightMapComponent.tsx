"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamic imports for Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

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

interface LightMapComponentProps {
  center: { lat: number; lng: number };
  listings: Listing[];
  hoveredListing: number | null;
  selectedListing: number | null;
  onMarkerHover: (index: number | null) => void;
  onMarkerClick: (index: number | null) => void;
}

export default function LightMapComponent({
  center,
  listings,
  hoveredListing,
  selectedListing,
  onMarkerHover,
  onMarkerClick,
}: LightMapComponentProps) {
  const mapRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const intersectionRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to only load map when visible
  useEffect(() => {
    if (!intersectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(intersectionRef.current);

    return () => observer.disconnect();
  }, []);

  // Limit and memoize markers for performance (max 50)
  const optimizedListings = useMemo(() => {
    const validListings = listings.filter(l => l.coords);
    // Limit to first 50 for performance
    return validListings.slice(0, 50);
  }, [listings]);

  // Memoize map center and bounds
  const mapCenter = useMemo<[number, number]>(() => {
    if (optimizedListings.length > 0) {
      return [optimizedListings[0].coords!.lat, optimizedListings[0].coords!.lng];
    }
    return [center.lat, center.lng];
  }, [optimizedListings, center]);

  // Custom icon creation function
  const createIcon = (listing: Listing) => {
    if (typeof window === 'undefined') return null;

    const L = require('leaflet');

    let color = '#3b82f6';
    let size = 24;

    if (selectedListing === (listing.index || 0)) {
      color = '#ef4444';
      size = 28;
    } else if (hoveredListing === (listing.index || 0)) {
      color = '#10b981';
      size = 26;
    }

    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${listing.match_score || 0}</text>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      className: 'custom-marker-icon'
    });
  };

  if (!isVisible) {
    return (
      <div
        ref={intersectionRef}
        style={{
          height: "100%",
          background: "rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgb(200, 200, 200)",
          fontSize: "16px"
        }}
      >
        Lightweight map loading...
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {typeof window !== 'undefined' && (
        <MapContainer
          // @ts-ignore
          center={mapCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          whenReady={() => setIsMapLoaded(true)}
        >
          {/* @ts-ignore */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {isMapLoaded && optimizedListings.map((listing, index) => (
            /* @ts-ignore */
            <Marker
              key={listing.index || index}
              position={[listing.coords!.lat, listing.coords!.lng]}
              /* @ts-ignore */
              icon={createIcon(listing)}
              /* @ts-ignore */
              eventHandlers={{
                mouseover: () => onMarkerHover(listing.index || index),
                mouseout: () => onMarkerHover(null),
                click: () => onMarkerClick(listing.index || index),
              }}
            >
              {/* @ts-ignore */}
              <Popup>
                <div style={{
                  minWidth: "200px",
                  fontFamily: "system-ui, sans-serif",
                  padding: "4px"
                }}>
                  <div style={{
                    fontWeight: "bold",
                    marginBottom: "4px",
                    fontSize: "14px"
                  }}>
                    {listing.address}
                  </div>
                  <div style={{
                    color: "#666",
                    fontSize: "13px",
                    marginBottom: "4px"
                  }}>
                    {listing.rent ? `$${listing.rent}/mo` : ""} • Match: {listing.match_score || 0}%
                  </div>
                  {listing.matched_hobbies && listing.matched_hobbies.length > 0 && (
                    <div style={{
                      color: "#4f46e5",
                      fontSize: "12px",
                      fontStyle: "italic"
                    }}>
                      Matches: {listing.matched_hobbies.join(', ')}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {optimizedListings.length > 50 && (
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          zIndex: 1000
        }}>
          Showing first 50 of {listings.length} listings
        </div>
      )}

      <style jsx global>{`
        .custom-marker-icon {
          border: none !important;
          background: transparent !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }

        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}