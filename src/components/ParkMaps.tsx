
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L, { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";


import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface ApiPark {
  park_id: number;
  park_name: string;
  state: string;
}


const US_NATIONAL_PARK_COORDS = [
  { name: "Acadia", lat: 44.35, lng: -68.21 },
  { name: "American Samoa", lat: -14.25, lng: -170.68 },
  { name: "Arches", lat: 38.68, lng: -109.57 },
  { name: "Badlands", lat: 43.75, lng: -102.5 },
  { name: "Big Bend", lat: 29.25, lng: -103.25 },
  { name: "Biscayne", lat: 25.65, lng: -80.08 },
  { name: "Black Canyon of the Gunnison", lat: 38.57, lng: -107.72 },
  { name: "Bryce Canyon", lat: 37.57, lng: -112.18 },
  { name: "Canyonlands", lat: 38.2, lng: -109.93 },
  { name: "Capitol Reef", lat: 38.2, lng: -111.17 },
  { name: "Carlsbad Caverns", lat: 32.17, lng: -104.44 },
  { name: "Channel Islands", lat: 34.01, lng: -119.42 },
  { name: "Congaree", lat: 33.78, lng: -80.78 },
  { name: "Crater Lake", lat: 42.94, lng: -122.1 },
  { name: "Cuyahoga Valley", lat: 41.24, lng: -81.55 },
  { name: "Death Valley", lat: 36.24, lng: -116.82 },
  { name: "Denali", lat: 63.33, lng: -150.5 },
  { name: "Dry Tortugas", lat: 24.63, lng: -82.87 },
  { name: "Everglades", lat: 25.32, lng: -80.93 },
  { name: "Gates of the Arctic", lat: 67.78, lng: -153.3 },
  { name: "Glacier", lat: 48.8, lng: -114.0 },
  { name: "Glacier Bay", lat: 58.5, lng: -137.0 },
  { name: "Grand Canyon", lat: 36.06, lng: -112.14 },
  { name: "Grand Teton", lat: 43.73, lng: -110.8 },
  { name: "Great Basin", lat: 38.98, lng: -114.3 },
  { name: "Great Sand Dunes", lat: 37.73, lng: -105.51 },
  { name: "Great Smoky Mountains", lat: 35.68, lng: -83.53 },
  { name: "Guadalupe Mountains", lat: 31.92, lng: -104.87 },
  { name: "Haleakalā", lat: 20.72, lng: -156.17 },
  { name: "Hawaiʻi Volcanoes", lat: 19.38, lng: -155.2 },
  { name: "Hot Springs", lat: 34.51, lng: -93.05 },
  { name: "Indiana Dunes", lat: 41.65, lng: -87.07 },
  { name: "Isle Royale", lat: 48.1, lng: -88.55 },
  { name: "Joshua Tree", lat: 33.79, lng: -115.9 },
  { name: "Katmai", lat: 58.5, lng: -155.0 },
  { name: "Kenai Fjords", lat: 59.92, lng: -149.65 },
  { name: "Kings Canyon", lat: 36.8, lng: -118.55 },
  { name: "Kobuk Valley", lat: 67.55, lng: -159.28 },
  { name: "Lake Clark", lat: 60.97, lng: -153.42 },
  { name: "Lassen Volcanic", lat: 40.49, lng: -121.51 },
  { name: "Mammoth Cave", lat: 37.18, lng: -86.1 },
  { name: "Mesa Verde", lat: 37.18, lng: -108.49 },
  { name: "Mount Rainier", lat: 46.88, lng: -121.72 },
  { name: "New River Gorge", lat: 37.83, lng: -81.08 },
  { name: "North Cascades", lat: 48.7, lng: -121.2 },
  { name: "Olympic", lat: 47.97, lng: -123.5 },
  { name: "Petrified Forest", lat: 35.07, lng: -109.78 },
  { name: "Pinnacles", lat: 36.48, lng: -121.16 },
  { name: "Redwood", lat: 41.3, lng: -124.0 },
  { name: "Rocky Mountain", lat: 40.4, lng: -105.58 },
  { name: "Saguaro", lat: 32.25, lng: -110.5 },
  { name: "Sequoia", lat: 36.43, lng: -118.68 },
  { name: "Shenandoah", lat: 38.53, lng: -78.35 },
  { name: "Theodore Roosevelt", lat: 46.97, lng: -103.45 },
  { name: "Virgin Islands", lat: 18.33, lng: -64.73 },
  { name: "Voyageurs", lat: 48.5, lng: -92.88 },
  { name: "White Sands", lat: 32.78, lng: -106.17 },
  { name: "Wind Cave", lat: 43.57, lng: -103.48 },
  { name: "Wrangell–St. Elias", lat: 61.0, lng: -142.0 },
  { name: "Yellowstone", lat: 44.6, lng: -110.5 },
  { name: "Yosemite", lat: 37.83, lng: -119.5 },
  { name: "Zion", lat: 37.3, lng: -113.05 },
] as const;


const normalizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/national park( and preserve)?/g, "")
    .replace(/national park & preserve/g, "")
    .replace(/national and state parks/g, "")
    .replace(/–/g, "-")
    .replace(/[^a-z]/g, "");


const COORDS_BY_KEY: Record<string, { lat: number; lng: number }> = {};
US_NATIONAL_PARK_COORDS.forEach((p) => {
  const key = normalizeName(p.name);
  COORDS_BY_KEY[key] = { lat: p.lat, lng: p.lng };
});

const ParksMap = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; 

    const map = L.map(mapContainerRef.current, {
      center: [39.5, -98.35],
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;


    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);


    const fetchParks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:3001/api/parks/map");
        if (!response.ok) {
          throw new Error("Failed to load parks for map");
        }

        const apiParks: ApiPark[] = await response.json();

        if (!Array.isArray(apiParks) || apiParks.length === 0) {
          setError("No parks available to display on the map.");
          setLoading(false);
          return;
        }

        const markers: LeafletMarker[] = [];

        apiParks.forEach((park) => {
          const key = normalizeName(park.park_name);
          const coords = COORDS_BY_KEY[key];


          if (!coords) {
            console.warn("No static coordinates for park:", park.park_name);
            return;
          }

          const marker = L.marker([coords.lat, coords.lng]).addTo(map);

          const popupHtml = `
            <div>
              <div style="font-weight:600;margin-bottom:4px;">
                ${park.park_name}
              </div>
              <div style="font-size:12px;color:#555;margin-bottom:6px;">
                ${park.state}
              </div>
              <div style="font-size:12px;color:#2563eb;cursor:pointer;text-decoration:underline;">
                View park details →
              </div>
            </div>
          `;

          marker.bindPopup(popupHtml);

          marker.on("click", () => {
            
            navigate(`/park/${park.park_id}`);
          });

          markers.push(marker);
        });


        if (markers.length > 0) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.25));
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error loading parks for map:", err);
        setError(err.message || "Failed to load parks for map.");
        setLoading(false);
      }
    };

    fetchParks();


    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [navigate]);

  return (
    <div className="relative w-full h-full">
      {}
      <div ref={mapContainerRef} className="w-full h-full" />

      {}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
          <span className="text-sm text-muted-foreground">
            Loading parks on the map...
          </span>
        </div>
      )}

      {}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              Try refreshing the page, or check if the backend is running.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParksMap;

