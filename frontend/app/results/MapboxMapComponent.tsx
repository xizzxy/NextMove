'use client';

import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

type Listing = {
  address: string;
  rent?: number;
  match_score?: number;
  reason?: string;
  coords?: { lat: number; lng: number };
  source_url?: string;
  amenities?: string[];
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

interface MapboxMapComponentProps {
  center: { lat: number; lng: number };
  listings: Listing[];
  places?: Place[];
  hoveredListing: number | null;
  selectedListing: number | null;
  onMarkerHover: (index: number | null) => void;
  onMarkerClick: (index: number | null) => void;
}

export default function MapboxMapComponent({
  center,
  listings,
  places = [],
  hoveredListing,
  selectedListing,
  onMarkerHover,
  onMarkerClick,
}: MapboxMapComponentProps) {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 11
  });
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'listing' | 'place';
    data: Listing | Place;
    coords: { lat: number; lng: number };
  } | null>(null);

  const mapboxToken = "pk.eyJ1Ijoic2NoaWFwcGFjYXN0MjAyMyIsImEiOiJjbWczcDkwOHcxYmd0MmtxMnRjcXJobDB1In0.9zjNRAXmSBWh-QddBPP-xQ";

  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: center.lng,
      latitude: center.lat
    }));
  }, [center]);

  // Auto-fit bounds when listings change
  useEffect(() => {
    if (mapRef.current && listings.length > 0) {
      const validCoords = listings
        .filter(l => l.coords && typeof l.coords.lat === 'number' && typeof l.coords.lng === 'number')
        .map(l => l.coords!);

      const allCoords = [
        ...validCoords,
        ...places.filter(p => p.coords).map(p => p.coords!)
      ];

      if (allCoords.length > 1) {
        const bounds = allCoords.reduce(
          (bounds, coord) => {
            return [
              [Math.min(coord.lng, bounds[0][0]), Math.min(coord.lat, bounds[0][1])],
              [Math.max(coord.lng, bounds[1][0]), Math.max(coord.lat, bounds[1][1])]
            ];
          },
          [[allCoords[0].lng, allCoords[0].lat], [allCoords[0].lng, allCoords[0].lat]]
        );

        // Add padding
        const padding = 50;
        mapRef.current?.fitBounds(bounds, { padding, duration: 1000 });
      }
    }
  }, [listings, places]);

  if (!mapboxToken) {
    return (
      <div className="mapbox-error">
        <p>Mapbox token not configured</p>
      </div>
    );
  }

  const handleMarkerClick = (type: 'listing' | 'place', data: Listing | Place, coords: { lat: number; lng: number }) => {
    setSelectedMarker({ type, data, coords });
    if (type === 'listing') {
      onMarkerClick((data as Listing).index ?? null);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {/* Apartment Listings */}
        {listings
          .filter(listing => listing.coords && typeof listing.coords.lat === 'number' && typeof listing.coords.lng === 'number')
          .map((listing, i) => {
            const isHovered = hoveredListing === listing.index;
            const isSelected = selectedListing === listing.index;

            return (
              <Marker
                key={`listing-${listing.index || i}`}
                longitude={listing.coords!.lng}
                latitude={listing.coords!.lat}
                anchor="bottom"
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#ef4444',
                    border: '2px solid white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'white',
                    fontWeight: 'bold',
                    transform: isSelected || isHovered ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    zIndex: isSelected ? 1000 : isHovered ? 500 : 1
                  }}
                  onMouseEnter={() => onMarkerHover(listing.index ?? null)}
                  onMouseLeave={() => onMarkerHover(null)}
                  onClick={() => handleMarkerClick('listing', listing, listing.coords!)}
                >
                  🏠
                </div>
              </Marker>
            );
          })}

        {/* Places */}
        {places
          .filter(place => place.coords && typeof place.coords.lat === 'number' && typeof place.coords.lng === 'number')
          .map((place, i) => (
            <Marker
              key={`place-${place.index || i}`}
              longitude={place.coords!.lng}
              latitude={place.coords!.lat}
              anchor="bottom"
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  border: '2px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                onClick={() => handleMarkerClick('place', place, place.coords!)}
              >
                📍
              </div>
            </Marker>
          ))}

        {/* Popup */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.coords.lng}
            latitude={selectedMarker.coords.lat}
            anchor="top"
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
            style={{ maxWidth: '300px' }}
          >
            <div style={{ padding: '8px', fontSize: '12px', color: '#333' }}>
              {selectedMarker.type === 'listing' ? (
                <div>
                  <strong>{(selectedMarker.data as Listing).address}</strong>
                  <br />
                  {(selectedMarker.data as Listing).rent && `$${(selectedMarker.data as Listing).rent}/mo`}
                  <br />
                  Match: {(selectedMarker.data as Listing).match_score || 0}%
                  {(selectedMarker.data as Listing).reason && (
                    <>
                      <br />
                      <em>{(selectedMarker.data as Listing).reason}</em>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <strong>{(selectedMarker.data as Place).name}</strong>
                  <br />
                  Type: {(selectedMarker.data as Place).type}
                  {(selectedMarker.data as Place).match_score && (
                    <>
                      <br />
                      Match: {(selectedMarker.data as Place).match_score}%
                    </>
                  )}
                  {(selectedMarker.data as Place).tags?.length > 0 && (
                    <>
                      <br />
                      Tags: {(selectedMarker.data as Place).tags.join(', ')}
                    </>
                  )}
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      <style jsx>{`
        .mapbox-error {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          font-family: 'Geist', sans-serif;
        }
      `}</style>
    </div>
  );
}