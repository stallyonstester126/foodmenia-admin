"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

export interface RiderMapItem {
  id: number;
  name: string;
  availability_status: "OFFLINE" | "ONLINE" | "BUSY";
  vehicle_type?: string;
  vehicle_number?: string;
  current_order_id?: number;
  current_lat?: number;
  current_lng?: number;
  last_location_at?: string;
}

interface AdminFleetMapProps {
  riders: RiderMapItem[];
}

const createRiderDivIcon = (status: string, label: string) => {
  const isBusy = status === "BUSY";
  const bgColor = isBusy ? "bg-amber-500" : "bg-emerald-500";
  const iconEmoji = isBusy ? "🛵" : "🟢";

  return L.divIcon({
    className: "admin-fleet-marker",
    html: `
      <div class="relative flex flex-col items-center group select-none">
        <div class="w-9 h-9 rounded-full ${bgColor} border-2 border-white shadow-md flex items-center justify-center text-sm font-bold text-white transition-transform group-hover:scale-110">
          ${iconEmoji}
        </div>
        <div class="mt-1 bg-gray-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 52],
    iconAnchor: [18, 46],
    popupAnchor: [0, -40],
  });
};

function MapResizeAndBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size so Leaflet expands to 100% parent container size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    if (points.length > 0) {
      if (points.length === 1) {
        map.setView(points[0], 13);
      } else {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }

    return () => clearTimeout(timer);
  }, [map, points]);

  return null;
}

export default function AdminFleetMap({ riders }: AdminFleetMapProps) {
  // Filter active riders with valid GPS coordinates
  const activeRiders = riders.filter(
    (r) =>
      r.current_lat !== undefined &&
      r.current_lat !== null &&
      r.current_lng !== undefined &&
      r.current_lng !== null &&
      !isNaN(Number(r.current_lat)) &&
      !isNaN(Number(r.current_lng))
  );

  const points: [number, number][] = activeRiders.map((r) => [
    Number(r.current_lat),
    Number(r.current_lng),
  ]);

  const defaultCenter: [number, number] =
    points.length > 0 ? points[0] : [31.5204, 74.3587];

  return (
    <div className="w-full h-[320px] sm:h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-xs relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapResizeAndBounds points={points} />

        {activeRiders.map((r) => {
          const lat = Number(r.current_lat);
          const lng = Number(r.current_lng);
          const pos: [number, number] = [lat, lng];
          const icon = createRiderDivIcon(r.availability_status, r.name);
          const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

          return (
            <Marker key={r.id} position={pos} icon={icon}>
              <Popup>
                <div className="p-1 font-poppins text-xs flex flex-col gap-1 select-none">
                  <strong className="block text-[#1A1A1A] font-bold text-sm">
                    {r.name}
                  </strong>
                  <span className="text-gray-600 block">
                    Status:{" "}
                    <strong
                      className={
                        r.availability_status === "BUSY"
                          ? "text-amber-600 font-bold"
                          : "text-emerald-600 font-bold"
                      }
                    >
                      {r.availability_status}
                    </strong>
                  </span>
                  <span className="text-gray-500 block">
                    Vehicle: {r.vehicle_type || "Standard"} (
                    {r.vehicle_number || "N/A"})
                  </span>
                  {r.current_order_id && (
                    <span className="text-amber-700 block font-semibold">
                      Active Order #{r.current_order_id}
                    </span>
                  )}
                  <a
                    href={googleNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center justify-center gap-1 text-[11px] bg-[#FCBA08] text-[#2B1B0E] font-bold px-2.5 py-1 rounded-md shadow-2xs hover:bg-[#e5a807]"
                  >
                    🗺️ Open Location in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
