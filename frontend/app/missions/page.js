"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import MapContainerDynamic from "@/components/map/MapContainerDynamic";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { getLakes, getAllZones, planMission, createMission } from "@/lib/api";
import { formatDistance, formatDuration, formatWeight } from "@/lib/formatters";
import {
  Compass,
  CheckCircle,
  AlertTriangle,
  Battery,
  Trash2,
  Clock,
  Navigation,
  ShieldAlert,
  Sliders,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export default function MissionPlannerPage() {
  const router = useRouter();
  const [lake, setLake] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState([]);
  const [zoneSearch, setZoneSearch] = useState("");
  const [missionName, setMissionName] = useState("Operation Clean Basin Alpha");

  // Step 2 Resources
  const [initialBattery, setInitialBattery] = useState(100);
  const [initialBinFill, setInitialBinFill] = useState(0);
  const [batteryReserve, setBatteryReserve] = useState(20);
  const [maxBinCapacity, setMaxBinCapacity] = useState(40);
  const [boatSpeed, setBoatSpeed] = useState(4.5);
  const [cleaningTimePerZone, setCleaningTimePerZone] = useState(12);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Feasibility & Route State
  const [feasibility, setFeasibility] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [lakesData, zonesData] = await Promise.all([getLakes(), getAllZones()]);
        if (lakesData && lakesData.length > 0) setLake(lakesData[0]);
        setZones(zonesData || []);

        // Default: auto-select top 2 high priority non-restricted zones
        const highPriority = (zonesData || [])
          .filter((z) => !z.is_restricted && z.priority_score >= 50)
          .slice(0, 2)
          .map((z) => z.id);
        setSelectedZoneIds(highPriority);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // Recalculate route plan
  const evaluateRoutePlan = async () => {
    if (!lake) return;
    setPlanning(true);
    setError(null);

    try {
      const payload = {
        water_body_id: lake.id,
        mission_name: missionName,
        selected_zone_ids: selectedZoneIds,
        initial_battery_pct: parseFloat(initialBattery),
        initial_bin_fill_pct: parseFloat(initialBinFill),
        battery_reserve_pct: parseFloat(batteryReserve),
        max_bin_capacity_kg: parseFloat(maxBinCapacity),
        boat_speed_kmh: parseFloat(boatSpeed),
        cleaning_time_per_zone_mins: parseFloat(cleaningTimePerZone),
      };

      const result = await planMission(payload);
      setFeasibility(result);
    } catch (err) {
      console.error("Planning error:", err);
      setError(err.message || "Failed to calculate candidate route.");
    } finally {
      setPlanning(false);
    }
  };

  useEffect(() => {
    if (lake && zones.length > 0) {
      evaluateRoutePlan();
    }
  }, [
    lake,
    selectedZoneIds,
    initialBattery,
    initialBinFill,
    batteryReserve,
    maxBinCapacity,
    boatSpeed,
    cleaningTimePerZone,
  ]);

  const toggleZone = (zoneId) => {
    if (selectedZoneIds.includes(zoneId)) {
      setSelectedZoneIds(selectedZoneIds.filter((id) => id !== zoneId));
    } else {
      setSelectedZoneIds([...selectedZoneIds, zoneId]);
    }
  };

  const handleRecommendZones = () => {
    const recommended = zones
      .filter((z) => !z.is_restricted && z.priority_score >= 55)
      .map((z) => z.id);
    setSelectedZoneIds(recommended);
  };

  const handleApproveMission = async () => {
    if (!feasibility || !feasibility.is_feasible) return;
    setApproving(true);
    try {
      const payload = {
        water_body_id: lake.id,
        name: missionName,
        selected_zone_ids: selectedZoneIds,
        planned_route_geojson: feasibility.route_geojson,
        planned_distance_km: feasibility.total_distance_km,
        estimated_duration_minutes: feasibility.total_duration_minutes,
        initial_battery_pct: parseFloat(initialBattery),
        initial_bin_fill_pct: parseFloat(initialBinFill),
        estimated_final_battery_pct: feasibility.final_battery_pct,
        estimated_final_bin_fill_pct: feasibility.final_bin_fill_pct,
        feasibility_status: feasibility.status,
        planning_summary: feasibility,
      };

      const created = await createMission(payload);
      router.push(`/simulation?mission_id=${created.id}`);
    } catch (err) {
      alert(`Failed to approve mission: ${err.message}`);
      setApproving(false);
    }
  };

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(zoneSearch.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Mission Planner"
        subtitle="Guided 3-step route configuration, resource checking, and pre-flight validation."
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Step Navigation Indicator Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-[#E4EAE7] shadow-xs text-xs">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#176B5B] text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <div>
              <div className="font-bold text-[#202A28]">Select Sectors</div>
              <div className="text-[11px] text-[#6B7773]">{selectedZoneIds.length} zones selected</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#EAF5F2] text-[#176B5B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#BDE0D8]">
              2
            </span>
            <div>
              <div className="font-bold text-[#202A28]">Review Resources</div>
              <div className="text-[11px] text-[#6B7773]">Battery & bin capacities</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#EAF5F2] text-[#176B5B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#BDE0D8]">
              3
            </span>
            <div>
              <div className="font-bold text-[#202A28]">Pre-Flight Check</div>
              <div className="text-[11px] text-[#6B7773]">
                {feasibility?.is_feasible ? (
                  <span className="text-[#247A52] font-semibold">Feasible for dispatch</span>
                ) : (
                  <span className="text-[#B83C3C] font-semibold">Requires adjustment</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Step 1 & 2 (Left) + Step 3 Route & Validation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Mission Name Input */}
            <div className="bg-white p-4 rounded-xl border border-[#E4EAE7] shadow-xs space-y-1.5">
              <label className="block text-xs font-semibold text-[#202A28] uppercase tracking-wider">
                Mission Name
              </label>
              <input
                type="text"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-xs font-semibold text-[#202A28] focus:outline-hidden focus:border-[#176B5B] focus:bg-white"
              />
            </div>

            {/* Step 1: Select Cleaning Zones */}
            <div className="bg-white p-5 rounded-xl border border-[#E4EAE7] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#202A28]">
                    Step 1: Target Cleaning Sectors
                  </h3>
                  <p className="text-xs text-[#6B7773] mt-0.5">
                    {selectedZoneIds.length} of {zones.length} sectors selected
                  </p>
                </div>
                <button
                  onClick={handleRecommendZones}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EDF7F2] hover:bg-[#DDF0E6] text-[#247A52] text-xs font-semibold border border-[#C6E7D6] transition"
                  title="Auto-select non-restricted zones with priority >= 55"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recommend High</span>
                </button>
              </div>

              {/* Search Zones */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B7773] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter cleaning sectors..."
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-xs text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
                />
              </div>

              {/* Zones List with Checkboxes */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredZones.map((zone) => {
                  const isSelected = selectedZoneIds.includes(zone.id);
                  return (
                    <div
                      key={zone.id}
                      onClick={() => !zone.is_restricted && toggleZone(zone.id)}
                      className={`p-3 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between gap-3 ${
                        zone.is_restricted
                          ? "bg-[#FDF0F0] border-[#F7C8C8] text-[#B83C3C] cursor-not-allowed opacity-90"
                          : isSelected
                          ? "bg-[#EAF5F2] border-[#176B5B] text-[#202A28]"
                          : "bg-[#F7F9F8] border-[#E4EAE7] text-[#6B7773] hover:border-[#CCD6D2]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={zone.is_restricted}
                          onChange={() => {}}
                          className="rounded-xs accent-[#176B5B] pointer-events-none"
                        />
                        <div>
                          <div className="font-semibold text-[#202A28]">{zone.name}</div>
                          <div className="text-[11px] text-[#6B7773]">
                            Severity: {zone.severity_score} · Density: {zone.waste_density_score}
                          </div>
                        </div>
                      </div>

                      <div>
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Review Resources */}
            <div className="bg-white p-5 rounded-xl border border-[#E4EAE7] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#202A28]">
                    Step 2: Resource Assumptions
                  </h3>
                  <p className="text-xs text-[#6B7773] mt-0.5">
                    Configure boat charge and collection capacities.
                  </p>
                </div>
                <Sliders className="w-4 h-4 text-[#176B5B]" />
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Available Battery */}
                <div>
                  <div className="flex justify-between text-[#202A28] mb-1">
                    <span className="font-medium">Available Battery:</span>
                    <span className="font-bold text-[#176B5B]">{initialBattery}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={initialBattery}
                    onChange={(e) => setInitialBattery(e.target.value)}
                    className="w-full accent-[#176B5B]"
                  />
                  <div className="text-[11px] text-[#6B7773] mt-0.5">
                    State of charge at mission departure.
                  </div>
                </div>

                {/* Safety Battery Reserve */}
                <div>
                  <div className="flex justify-between text-[#202A28] mb-1">
                    <span className="font-medium">Safety Reserve Threshold:</span>
                    <span className="font-bold text-[#A56613]">{batteryReserve}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={batteryReserve}
                    onChange={(e) => setBatteryReserve(e.target.value)}
                    className="w-full accent-[#A56613]"
                  />
                  <div className="text-[11px] text-[#6B7773] mt-0.5">
                    Minimum buffer reserved to safely return and dock.
                  </div>
                </div>

                {/* Current Bin Fill */}
                <div>
                  <div className="flex justify-between text-[#202A28] mb-1">
                    <span className="font-medium">Current Bin Load:</span>
                    <span className="font-bold text-[#238A78]">{initialBinFill}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={initialBinFill}
                    onChange={(e) => setInitialBinFill(e.target.value)}
                    className="w-full accent-[#238A78]"
                  />
                </div>

                {/* Collapsible Advanced Settings */}
                <div className="pt-2 border-t border-[#E4EAE7]">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-[#176B5B] hover:text-[#125648]"
                  >
                    <span>Advanced Simulation Parameters</span>
                    {showAdvancedSettings ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showAdvancedSettings && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#F0F3F2]">
                      <div>
                        <label className="block text-[#6B7773] text-[11px] font-medium mb-1">
                          Max Bin Cap (kg)
                        </label>
                        <input
                          type="number"
                          value={maxBinCapacity}
                          onChange={(e) => setMaxBinCapacity(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#6B7773] text-[11px] font-medium mb-1">
                          Boat Speed (km/h)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={boatSpeed}
                          onChange={(e) => setBoatSpeed(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Step 3 Review & Pre-Flight Validation */}
          <div className="lg:col-span-7 space-y-5">
            {/* Candidate Route Leaflet Map */}
            <div className="bg-white p-5 rounded-xl border border-[#E4EAE7] shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#202A28] flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#176B5B]" />
                    Step 3: Candidate Cleaning Route
                  </h3>
                  <p className="text-xs text-[#6B7773] mt-0.5">
                    Deterministic TSP path starting from dock and returning to dock.
                  </p>
                </div>
                {feasibility && (
                  <span className="text-[#176B5B] font-mono font-semibold text-[11px]">
                    {feasibility.waypoints?.length || 0} Waypoints
                  </span>
                )}
              </div>

              <MapContainerDynamic
                waterBody={lake}
                zones={zones.filter((z) => selectedZoneIds.includes(z.id))}
                plannedRoute={feasibility?.route_geojson}
                height="340px"
              />
            </div>

            {/* Pre-Flight Feasibility Assessment Card */}
            {feasibility && (
              <div
                className={`p-5 rounded-xl border shadow-xs space-y-4 ${
                  feasibility.is_feasible
                    ? "bg-white border-[#E4EAE7]"
                    : "bg-[#FDF0F0] border-[#F7C8C8]"
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                  <div className="flex items-center gap-2">
                    {feasibility.is_feasible ? (
                      <CheckCircle className="w-5 h-5 text-[#247A52]" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-[#B83C3C]" />
                    )}
                    <div>
                      <span className="font-bold text-sm text-[#202A28] block">
                        Pre-Flight Feasibility Status
                      </span>
                      <span className="text-xs text-[#6B7773]">
                        {feasibility.is_feasible
                          ? "All physical and safety constraints satisfied."
                          : "Mission violates configured safety constraints."}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={feasibility.status} />
                </div>

                {/* Constraint Violations (if infeasible) */}
                {!feasibility.is_feasible && feasibility.violations?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#B83C3C]">
                      Constraints to resolve before launch:
                    </div>
                    {feasibility.violations.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white border border-[#F7C8C8] text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#B83C3C]">{v.message}</div>
                        <div className="text-[11px] text-[#6B7773]">
                          <strong>Correction:</strong> {v.suggested_action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resource Summary Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7]">
                    <span className="text-[10px] text-[#6B7773] uppercase font-semibold">Planned Distance</span>
                    <div className="text-sm font-bold text-[#202A28] mt-0.5">
                      {formatDistance(feasibility.total_distance_km)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7]">
                    <span className="text-[10px] text-[#6B7773] uppercase font-semibold">Estimated Time</span>
                    <div className="text-sm font-bold text-[#202A28] mt-0.5">
                      {formatDuration(feasibility.total_duration_minutes)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7]">
                    <span className="text-[10px] text-[#6B7773] uppercase font-semibold">Final Battery</span>
                    <div
                      className={`text-sm font-bold mt-0.5 ${
                        feasibility.final_battery_pct < batteryReserve
                          ? "text-[#B83C3C]"
                          : "text-[#176B5B]"
                      }`}
                    >
                      {feasibility.final_battery_pct}%
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7]">
                    <span className="text-[10px] text-[#6B7773] uppercase font-semibold">Final Bin Fill</span>
                    <div
                      className={`text-sm font-bold mt-0.5 ${
                        feasibility.final_bin_fill_pct > 100 ? "text-[#B83C3C]" : "text-[#238A78]"
                      }`}
                    >
                      {feasibility.final_bin_fill_pct}%
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleApproveMission}
                    disabled={!feasibility.is_feasible || approving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs shadow-xs transition ${
                      feasibility.is_feasible
                        ? "bg-[#176B5B] hover:bg-[#125648] text-white"
                        : "bg-[#E4EAE7] text-[#6B7773] cursor-not-allowed border border-[#CCD6D2]"
                    }`}
                  >
                    {approving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Mission...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Approve and Start Simulation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
