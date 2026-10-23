"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { Layers, Navigation, AlertTriangle, Battery, Trash2 } from "lucide-react";

// Fix for default Leaflet icon paths in webpack / Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveLakeMap({
  waterBody,
  zones = [],
  reports = [],
  plannedRoute = null,
  activeBoatPosition = null,
  selectedZone = null,
  onSelectZone = null,
  onSelectReport = null,
  height = "520px",
}) {
  const [showZones, setShowZones] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  const defaultCenter = waterBody
    ? [waterBody.launch_point_lat || 30.2540, waterBody.launch_point_lng || -97.7495]
    : [30.2540, -97.7495];

  // Custom Boat Marker Icon - Calm Environmental Teal
  const boatIcon = L.divIcon({
    className: "custom-boat-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(23, 107, 91, 0.25); animation: boat-pulse 1.8s infinite;"></div>
        <div style="width: 20px; height: 20px; border-radius: 50%; background: #176B5B; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
          <div style="width: 5px; height: 5px; border-radius: 50%; background: #FFFFFF;"></div>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  // Dock Marker Icon
  const dockIcon = L.divIcon({
    className: "custom-dock-marker",
    html: `
      <div style="width: 24px; height: 24px; border-radius: 6px; background: #FFFFFF; border: 2px solid #176B5B; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
        <div style="width: 8px; height: 8px; background: #176B5B; border-radius: 2px;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Color mapper for priority - calm restrained colors
  const getZoneColor = (score, isRestricted) => {
    if (isRestricted) return { color: "#B83C3C", fill: "#B83C3C" };
    if (score >= 75) return { color: "#B83C3C", fill: "#B83C3C" };
    if (score >= 55) return { color: "#A56613", fill: "#A56613" };
    if (score >= 35) return { color: "#238A78", fill: "#238A78" };
    return { color: "#176B5B", fill: "#176B5B" };
  };

  const routeCoordinates = plannedRoute?.coordinates
    ? plannedRoute.coordinates.map((pt) => [pt[1], pt[0]])
    : plannedRoute?.geometry?.coordinates
    ? plannedRoute.geometry.coordinates.map((pt) => [pt[1], pt[0]])
    : [];

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[#E4EAE7] bg-[#F7F9F8] shadow-xs"
      style={{ height }}
    >
      {/* Map Layer Controls floating bar */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-[#E4EAE7] rounded-lg p-1.5 flex items-center gap-1.5 text-xs shadow-sm">
        <span className="text-[#6B7773] font-medium flex items-center gap-1 px-1.5">
          <Layers className="w-3.5 h-3.5 text-[#176B5B]" /> Layers:
        </span>
        <button
          onClick={() => setShowZones(!showZones)}
          className={`px-2 py-1 rounded-md transition text-xs font-medium ${
            showZones
              ? "bg-[#EAF5F2] text-[#176B5B] border border-[#BDE0D8]"
              : "text-[#6B7773] hover:text-[#202A28]"
          }`}
        >
          Zones
        </button>
        <button
          onClick={() => setShowReports(!showReports)}
          className={`px-2 py-1 rounded-md transition text-xs font-medium ${
            showReports
              ? "bg-[#FDF6EC] text-[#9A5809] border border-[#F5D9AF]"
              : "text-[#6B7773] hover:text-[#202A28]"
          }`}
        >
          Reports
        </button>
        {routeCoordinates.length > 0 && (
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`px-2 py-1 rounded-md transition text-xs font-medium ${
              showRoute
                ? "bg-[#EDF7F2] text-[#247A52] border border-[#C6E7D6]"
                : "text-[#6B7773] hover:text-[#202A28]"
            }`}
          >
            Route
          </button>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-[#E4EAE7] rounded-lg p-3 text-xs text-[#202A28] shadow-sm hidden sm:block">
        <div className="font-semibold text-xs text-[#202A28] mb-1.5 flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-[#176B5B]" /> Map Legend
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[#6B7773]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B83C3C] inline-block" />
            <span>Critical (≥75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A56613] inline-block" />
            <span>High (55–74)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#238A78] inline-block" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs border border-[#B83C3C] bg-[#FDF0F0] inline-block" />
            <span>Restricted Zone</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <ChangeView center={defaultCenter} zoom={14} />

        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Demonstration Lake Boundary Polygon */}
        {waterBody?.boundary_geojson?.coordinates && (
          <Polygon
            positions={waterBody.boundary_geojson.coordinates[0].map((pt) => [pt[1], pt[0]])}
            pathOptions={{
              color: "#176B5B",
              weight: 2,
              dashArray: "4, 6",
              fillColor: "#238A78",
              fillOpacity: 0.08,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs p-0.5">
                <strong className="text-[#202A28]">{waterBody.name}</strong>
                <p className="text-[10px] text-[#6B7773]">Demonstration Water Basin</p>
              </div>
            </Tooltip>
          </Polygon>
        )}

        {/* Launch Point / Dock Marker */}
        {waterBody && (
          <Marker
            position={[waterBody.launch_point_lat, waterBody.launch_point_lng]}
            icon={dockIcon}
          >
            <Popup>
              <div className="text-xs p-1 max-w-[200px]">
                <div className="font-bold text-[#176B5B]">Launch Dock & Berthing Slip</div>
                <div className="text-[#6B7773] mt-0.5 leading-snug">
                  Autonomous boat charging dock and discharge berth.
                </div>
                <div className="text-[10px] text-[#6B7773] mt-1 font-mono">
                  GPS: {waterBody.launch_point_lat.toFixed(4)}, {waterBody.launch_point_lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Cleaning Zones */}
        {showZones &&
          zones.map((zone) => {
            const coords = zone.geometry_geojson?.coordinates;
            if (!coords || !coords[0]) return null;
            const polyCoords = coords[0].map((pt) => [pt[1], pt[0]]);
            const styling = getZoneColor(zone.priority_score, zone.is_restricted);

            return (
              <Polygon
                key={zone.id}
                positions={polyCoords}
                pathOptions={{
                  color: styling.color,
                  weight: selectedZone?.id === zone.id ? 3 : 1.5,
                  fillColor: styling.fill,
                  fillOpacity: selectedZone?.id === zone.id ? 0.35 : 0.18,
                  dashArray: zone.is_restricted ? "5, 5" : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectZone && onSelectZone(zone),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-[#202A28] font-bold">{zone.name}</strong>
                      {zone.is_restricted ? (
                        <SeverityBadge severity="CRITICAL">Restricted</SeverityBadge>
                      ) : (
                        <SeverityBadge
                          severity={
                            zone.priority_score >= 75
                              ? "CRITICAL"
                              : zone.priority_score >= 55
                              ? "HIGH"
                              : "MEDIUM"
                          }
                        >
                          Score {Math.round(zone.priority_score)}
                        </SeverityBadge>
                      )}
                    </div>
                    <p className="text-[#6B7773] text-[11px] mb-2 leading-relaxed">
                      {zone.description}
                    </p>
                    <div className="space-y-1 text-[11px] bg-[#F7F9F8] p-2 rounded-lg border border-[#E4EAE7]">
                      <div className="flex justify-between">
                        <span className="text-[#6B7773]">Severity:</span>
                        <span className="font-semibold text-[#202A28]">{zone.severity_score}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7773]">Waste Density:</span>
                        <span className="font-semibold text-[#202A28]">{zone.waste_density_score}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7773]">Runoff Exposure:</span>
                        <span className="font-semibold text-[#202A28]">{zone.runoff_exposure_score}/100</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* Waste Reports Point Markers */}
        {showReports &&
          reports.map((rep) => {
            if (!rep.latitude || !rep.longitude) return null;
            const isResolved = rep.report_status === "RESOLVED";
            const markerColor = isResolved
              ? "#247A52"
              : rep.severity === "CRITICAL"
              ? "#B83C3C"
              : rep.severity === "HIGH"
              ? "#A56613"
              : "#238A78";

            return (
              <CircleMarker
                key={rep.id}
                center={[rep.latitude, rep.longitude]}
                radius={6}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 2,
                  fillColor: markerColor,
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => onSelectReport && onSelectReport(rep),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 max-w-[220px]">
                    <div className="font-semibold text-[#202A28] mb-1">{rep.title}</div>
                    <div className="flex gap-1.5 mb-1.5">
                      <SeverityBadge severity={rep.severity} />
                      <StatusBadge status={rep.report_status} />
                    </div>
                    <p className="text-[11px] text-[#6B7773] leading-relaxed mb-1.5">
                      {rep.description}
                    </p>
                    <div className="text-[10px] text-[#6B7773]">
                      Category: <span className="font-medium text-[#202A28]">{rep.category}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Planned Route LineString */}
        {showRoute && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#176B5B",
              weight: 3,
              opacity: 0.85,
              dashArray: "6, 6",
            }}
          />
        )}

        {/* Simulated Autonomous Boat Live Position */}
        {activeBoatPosition && activeBoatPosition.lat && activeBoatPosition.lng && (
          <Marker
            position={[activeBoatPosition.lat, activeBoatPosition.lng]}
            icon={boatIcon}
          >
            <Popup>
              <div className="text-xs p-1 min-w-[190px]">
                <div className="font-bold text-[#176B5B] flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#176B5B]" />
                  Simulated Boat Position
                </div>
                <div className="text-[11px] text-[#6B7773] mb-2">Simulated Autonomous Telemetry</div>
                <div className="space-y-1 bg-[#F7F9F8] p-2 rounded-lg border border-[#E4EAE7] text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7773] flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-[#176B5B]" /> Battery:
                    </span>
                    <span className="font-semibold text-[#202A28]">
                      {Math.round(activeBoatPosition.battery || 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7773] flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5 text-[#238A78]" /> Bin Fill:
                    </span>
                    <span className="font-semibold text-[#202A28]">
                      {Math.round(activeBoatPosition.binFill || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
