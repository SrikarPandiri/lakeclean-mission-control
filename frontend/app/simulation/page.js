"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import MapContainerDynamic from "@/components/map/MapContainerDynamic";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  getMissions,
  getMission,
  getLakes,
  getAllZones,
  startMission,
  pauseMission,
  resumeMission,
  abortMission,
  tickMission,
  getMissionEvents,
} from "@/lib/api";
import { formatDistance, formatDuration, formatTimeAgo } from "@/lib/formatters";
import {
  Play,
  Pause,
  Square,
  FastForward,
  Battery,
  Trash2,
  Navigation,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity,
  Layers,
} from "lucide-react";

function SimulationContent() {
  const searchParams = useSearchParams();
  const urlMissionId = searchParams.get("mission_id");

  const [missionsList, setMissionsList] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [lake, setLake] = useState(null);
  const [zones, setZones] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [tickSpeed, setTickSpeed] = useState(2500); // ms per step
  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);

  const timerRef = useRef(null);

  // Load available missions & lake
  const loadInitial = async () => {
    try {
      const [allMissions, lakesData, zonesData] = await Promise.all([
        getMissions(),
        getLakes(),
        getAllZones(),
      ]);

      setMissionsList(allMissions || []);
      if (lakesData && lakesData.length > 0) setLake(lakesData[0]);
      setZones(zonesData || []);

      let target = null;
      if (urlMissionId) {
        target = allMissions.find((m) => m.id === urlMissionId);
      }
      if (!target && allMissions.length > 0) {
        target =
          allMissions.find((m) => ["RUNNING", "PAUSED", "PLANNED"].includes(m.status)) ||
          allMissions[0];
      }

      if (target) {
        setActiveMission(target);
        if (target.status === "RUNNING") {
          setAutoPlay(true);
        }
        const evs = await getMissionEvents(target.id);
        setEvents(evs || []);
      }
    } catch (err) {
      console.error("Failed to load simulation environment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, [urlMissionId]);

  // Tick step forward
  const performTick = async () => {
    if (!activeMission || activeMission.status !== "RUNNING") return;
    try {
      const tickResult = await tickMission(activeMission.id);
      const updated = await getMission(activeMission.id);
      setActiveMission(updated);

      const evs = await getMissionEvents(activeMission.id);
      setEvents(evs || []);

      if (tickResult.is_finished) {
        setAutoPlay(false);
      }
    } catch (err) {
      console.error("Simulation tick error:", err);
      setAutoPlay(false);
    }
  };

  // Autoplay loop timer
  useEffect(() => {
    if (autoPlay && activeMission?.status === "RUNNING") {
      timerRef.current = setInterval(() => {
        performTick();
      }, tickSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, activeMission?.status, tickSpeed]);

  // Control Handlers
  const handleStart = async () => {
    if (!activeMission) return;
    try {
      const updated = await startMission(activeMission.id);
      setActiveMission(updated);
      setAutoPlay(true);
      const evs = await getMissionEvents(activeMission.id);
      setEvents(evs || []);
    } catch (err) {
      alert(`Cannot start mission: ${err.message}`);
    }
  };

  const handlePause = async () => {
    if (!activeMission) return;
    try {
      setAutoPlay(false);
      const updated = await pauseMission(activeMission.id);
      setActiveMission(updated);
      const evs = await getMissionEvents(activeMission.id);
      setEvents(evs || []);
    } catch (err) {
      alert(`Cannot pause mission: ${err.message}`);
    }
  };

  const handleResume = async () => {
    if (!activeMission) return;
    try {
      const updated = await resumeMission(activeMission.id);
      setActiveMission(updated);
      setAutoPlay(true);
      const evs = await getMissionEvents(activeMission.id);
      setEvents(evs || []);
    } catch (err) {
      alert(`Cannot resume mission: ${err.message}`);
    }
  };

  const confirmAbort = async () => {
    if (!activeMission) return;
    try {
      setAutoPlay(false);
      const updated = await abortMission(activeMission.id);
      setActiveMission(updated);
      setIsAbortModalOpen(false);
      const evs = await getMissionEvents(activeMission.id);
      setEvents(evs || []);
    } catch (err) {
      alert(`Cannot abort mission: ${err.message}`);
    }
  };

  const handleSwitchMission = async (missionId) => {
    setAutoPlay(false);
    const selected = missionsList.find((m) => m.id === missionId);
    if (selected) {
      const full = await getMission(selected.id);
      setActiveMission(full);
      const evs = await getMissionEvents(full.id);
      setEvents(evs || []);
    }
  };

  const currentLat = activeMission?.current_lat || lake?.launch_point_lat || 30.2540;
  const currentLng = activeMission?.current_lng || lake?.launch_point_lng || -97.7495;
  const boatPos = {
    lat: currentLat,
    lng: currentLng,
    battery: activeMission?.current_battery_pct || 100,
    binFill: activeMission?.current_bin_fill_pct || 0,
  };

  const waypoints = activeMission?.planning_summary?.waypoints || [];
  const currentWpIndex = activeMission?.current_waypoint_index || 0;
  const totalWps = waypoints.length;
  const progressPct = totalWps > 0 ? Math.round((currentWpIndex / (totalWps - 1)) * 100) : 0;

  const targetSectorsCount = activeMission?.selected_zone_ids?.length || 0;
  const completedSectorsCount = activeMission?.completed_zone_ids?.length || 0;
  const remainingSectorsCount = Math.max(0, targetSectorsCount - completedSectorsCount);

  return (
    <div>
      <Header
        title="Live Mission Simulation"
        subtitle="Autonomous boat navigation, telemetry streaming, dynamic battery degradation, and bin fill tracking."
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Mission Selector & Operational Control Ribbon */}
        <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2.5 rounded-lg bg-[#EAF5F2] text-[#176B5B] shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#6B7773] tracking-wider block">
                Active Simulation Subject
              </span>
              <select
                value={activeMission?.id || ""}
                onChange={(e) => handleSwitchMission(e.target.value)}
                className="mt-0.5 px-3 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-sm font-semibold focus:outline-hidden focus:border-[#176B5B]"
              >
                {missionsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context-Appropriate Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {activeMission?.status === "PLANNED" && (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold shadow-xs transition"
              >
                <Play className="w-4 h-4" />
                <span>Start Simulation</span>
              </button>
            )}

            {activeMission?.status === "RUNNING" && (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FDF6EC] hover:bg-[#FBEFD9] border border-[#F5D9AF] text-[#9A5809] text-xs font-semibold transition"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={performTick}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F7F9F8] hover:bg-[#EAEFEA] text-[#202A28] text-xs font-semibold border border-[#E4EAE7] transition"
                  title="Advance 1 waypoint step"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Step (+1)</span>
                </button>
                <button
                  onClick={() => setIsAbortModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FDF0F0] hover:bg-[#FBE4E4] border border-[#F7C8C8] text-[#B83C3C] text-xs font-semibold transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Abort</span>
                </button>
              </>
            )}

            {activeMission?.status === "PAUSED" && (
              <>
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold shadow-xs transition"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={() => setIsAbortModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FDF0F0] hover:bg-[#FBE4E4] border border-[#F7C8C8] text-[#B83C3C] text-xs font-semibold transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Abort</span>
                </button>
              </>
            )}

            {["COMPLETED", "ABORTED"].includes(activeMission?.status) && (
              <div className="flex items-center gap-2">
                <StatusBadge status={activeMission.status} />
              </div>
            )}
          </div>
        </div>

        {/* Real-time Telemetry Status Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E4EAE7] shadow-xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs font-semibold uppercase">
              <span>Overall Progress</span>
              <Activity className="w-4 h-4 text-[#176B5B]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#202A28]">
              {progressPct}%
            </div>
            <div className="mt-1.5 w-full h-1.5 bg-[#F0F4F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#176B5B] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-[#6B7773]">
              Waypoint {currentWpIndex + 1} of {Math.max(1, totalWps)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4EAE7] shadow-xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs font-semibold uppercase">
              <span>Battery State</span>
              <Battery className="w-4 h-4 text-[#176B5B]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#176B5B]">
              {Math.round(activeMission?.current_battery_pct || 100)}%
            </div>
            <div className="mt-1.5 w-full h-1.5 bg-[#F0F4F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#176B5B] rounded-full transition-all duration-300"
                style={{ width: `${activeMission?.current_battery_pct || 100}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-[#6B7773]">
              Route distance: {formatDistance(activeMission?.planned_distance_km)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4EAE7] shadow-xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs font-semibold uppercase">
              <span>Bin Capacity Load</span>
              <Trash2 className="w-4 h-4 text-[#238A78]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#238A78]">
              {Math.round(activeMission?.current_bin_fill_pct || 0)}%
            </div>
            <div className="mt-1.5 w-full h-1.5 bg-[#F0F4F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#238A78] rounded-full transition-all duration-300"
                style={{ width: `${activeMission?.current_bin_fill_pct || 0}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-[#6B7773]">
              {completedSectorsCount} cleaned · {remainingSectorsCount} remaining
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4EAE7] shadow-xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs font-semibold uppercase">
              <span>Simulation Status</span>
              <Clock className="w-4 h-4 text-[#A56613]" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={activeMission?.status || "PLANNED"} />
            </div>
            <div className="mt-3 text-[11px] text-[#6B7773]">
              Est. Duration: {formatDuration(activeMission?.estimated_duration_minutes)}
            </div>
          </div>
        </div>

        {/* 2-Column Main Simulation Grid: Large Map (8 Cols) + Event Timeline (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulation Geospatial Map */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B7773] px-1">
              <span className="font-semibold text-[#202A28] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#176B5B]" /> Live Simulated Boat Position
              </span>
              <span className="text-[11px]">
                Simulating autonomous GPS waypoint traversal
              </span>
            </div>

            <MapContainerDynamic
              waterBody={lake}
              zones={zones.filter((z) => activeMission?.selected_zone_ids?.includes(z.id))}
              plannedRoute={activeMission?.planned_route_geojson}
              activeBoatPosition={boatPos}
              height="540px"
            />
          </div>

          {/* Telemetry Events & Timeline */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#176B5B]" /> Mission Event Timeline
                </span>
                <span className="text-[11px] text-[#176B5B] font-mono font-semibold">
                  {events.length} events
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <div className="text-xs text-[#6B7773] py-8 text-center">
                    No simulation events recorded yet. Click Start Simulation to begin.
                  </div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#176B5B] text-[11px]">
                          {ev.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-[#6B7773]">
                          {formatTimeAgo(ev.created_at)}
                        </span>
                      </div>
                      <p className="text-[#202A28] text-[11px] leading-relaxed">{ev.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Abort Mission */}
      <Modal
        isOpen={isAbortModalOpen}
        onClose={() => setIsAbortModalOpen(false)}
        title="Confirm Abort Mission"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#6B7773] leading-relaxed">
            Are you sure you want to abort the current autonomous mission? The simulated boat will cease route traversal immediately and log an abort event.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E4EAE7]">
            <button
              onClick={() => setIsAbortModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E4EAE7] hover:bg-[#F7F9F8] text-[#6B7773] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmAbort}
              className="px-4 py-2 rounded-lg bg-[#B83C3C] hover:bg-[#9B2F2F] text-white font-semibold shadow-xs"
            >
              Abort Mission
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-[#6B7773] flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#176B5B]" />
          <span>Loading simulation engine...</span>
        </div>
      }
    >
      <SimulationContent />
    </Suspense>
  );
}
