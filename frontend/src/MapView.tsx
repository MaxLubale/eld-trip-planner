import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapProps = {
  geometry: [number, number][] | null;
};

// Internal component to handle map fix
function MapFixer() {
  const map = useMap();
  useEffect(() => {
    // This forces Leaflet to recalculate the container size
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
}

export default function MapView({ geometry }: MapProps) {
  if (!geometry || geometry.length === 0) return null;

  const positions = geometry.map(([lon, lat]) => [lat, lon] as [number, number]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border-2 border-black relative h-[400px] w-full bg-[#f0f0f0]">
      <div className="absolute top-2 left-2 z-[1000] bg-black text-white px-2 py-1 text-[10px] font-mono font-bold uppercase">
        Live Route Tracking
      </div>
      
      <MapContainer
        key={JSON.stringify(geometry)} // Force re-render on any geometry change
        center={positions[0]}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "400px", width: "100%" }} // Pixel height is vital
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline 
          positions={positions} 
          pathOptions={{ color: '#1d4ed8', weight: 5, opacity: 0.8 }} 
        />
        <MapFixer />
      </MapContainer>
    </div>
  );
}