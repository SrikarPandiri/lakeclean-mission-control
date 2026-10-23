"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import MapContainerDynamic from "@/components/map/MapContainerDynamic";
import {
  getDashboardSummary,
  getDashboardActivity,
  getLakes,
  getAllZones,
  getReports,
} from "@/lib/api";
import { formatTimeAgo, formatWeight, formatDistance } from "@/lib/formatters";
import {
  AlertTriangle,
  Compass,
  CheckCircle2,
  PlayCircle,
  Battery,
  Trash2,
  MapPin,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Radio,
  FileText,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import LoginView from "@/components/auth/LoginView";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(null);
  const [lake, setLake] = useState(null);
  const [zones, setZones] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [sumData, actData, lakesData, zonesData, reportsData] = await Promise.all([
        getDashboardSummary(),
        getDashboardActivity(),
        getLakes(),
        getAllZones(),
        getReports(),
      ]);

      setSummary(sumData);
      setActivity(actData);
      if (lakesData && lakesData.length > 0) {
        setLake(lakesData[0]);
      }
      setZones(zonesData || []);
      setReports(reportsData || []);
    } catch (err) {
      console.error("Dashboard data load failed:", err);
      setError("Unable to connect to LakeClean backend service. Please verify that the FastAPI backend is running on port 8000.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { isAuthenticated, loading: authLoading, user, isGuest } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#176B5B]/30 border-t-[#176B5B] rounded-full animate-spin" />
      </div>
    );
  }

  // Welcome / Authentication Portal for Unauthenticated Visitors
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F7F9F8]">
        <LoginView />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Operations Dashboard"
        subtitle="Autonomous water-surface purification and environmental cleanup intelligence."
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Greeting & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4EAE7] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#EDF7F2] text-[#247A52] border border-[#C6E7D6]">
                Demo Mode · Simulated Data
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202A28]">
              LakeClean Operations
            </h1>
            <p className="text-xs text-[#6B7773] mt-1 leading-relaxed">
              Monitoring {lake?.name || "Lady Bird Lake Basin"} with priority scoring and autonomous route simulation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/map"
              className="px-3.5 py-2 rounded-lg border border-[#E4EAE7] hover:bg-[#F7F9F8] text-xs font-semibold text-[#202A28] transition"
            >
              View Lake Map
            </Link>
            <Link
              href="/missions"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Plan New Mission</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#FDF0F0] border border-[#F7C8C8] text-xs text-[#B83C3C] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-2.5 py-1 rounded bg-white border border-[#F7C8C8] text-[11px] font-semibold hover:bg-[#FDF0F0]"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Essential Operational Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Priority Zones"
            value={summary ? summary.high_priority_zones : "--"}
            subtitle="Sectors scoring ≥ 55"
            icon={MapPin}
            variant="warning"
          />
          <StatCard
            title="Active Missions"
            value={summary ? summary.missions_running : "--"}
            subtitle="Running or paused in simulator"
            icon={Activity}
            variant="primary"
          />
          <StatCard
            title="Completed Missions"
            value={summary ? summary.missions_completed : "--"}
            subtitle={`${summary ? summary.average_completion_rate_pct : 0}% success rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Estimated Waste Collected"
            value={summary ? `${formatWeight(summary.estimated_waste_collected_kg)}` : "--"}
            subtitle="Simulated surface debris"
            icon={Trash2}
            variant="teal"
          />
        </div>

        {/* Balanced Two-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Section (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Lake Map Preview */}
            <div className="bg-white rounded-xl border border-[#E4EAE7] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#202A28] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#176B5B]" />
                    Demonstration Lake Overview
                  </h2>
                  <p className="text-xs text-[#6B7773] mt-0.5">
                    Interactive view of water boundaries, cleaning zones, and reported hotspots.
                  </p>
                </div>
                <Link
                  href="/map"
                  className="text-xs font-semibold text-[#176B5B] hover:underline flex items-center gap-1"
                >
                  <span>Open Full Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <MapContainerDynamic
                waterBody={lake}
                zones={zones}
                reports={reports}
                height="380px"
              />
            </div>

            {/* High Priority Cleaning Zones */}
            <div className="bg-white rounded-xl border border-[#E4EAE7] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[#202A28]">
                    High-Priority Cleaning Sectors
                  </h2>
                  <p className="text-xs text-[#6B7773]">
                    Ranked by explainable severity, density, and runoff scores.
                  </p>
                </div>
                <Link
                  href="/missions"
                  className="text-xs font-semibold text-[#176B5B] hover:underline"
                >
                  Plan Route
                </Link>
              </div>

              <div className="space-y-2">
                {activity?.priority_zones?.map((pz) => (
                  <div
                    key={pz.id}
                    className="p-3 rounded-lg border border-[#E4EAE7] bg-[#F7F9F8] hover:bg-white hover:border-[#CCD6D2] transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#202A28]">{pz.name}</div>
                      <div className="text-[11px] text-[#6B7773] mt-0.5">
                        Severity: <span className="font-medium text-[#202A28]">{pz.severity_score}</span> · Waste Density: <span className="font-medium text-[#202A28]">{pz.waste_density_score}</span>
                      </div>
                    </div>
                    {pz.is_restricted ? (
                      <SeverityBadge severity="CRITICAL">Restricted Sanctuary</SeverityBadge>
                    ) : (
                      <SeverityBadge
                        severity={pz.priority_score >= 75 ? "CRITICAL" : pz.priority_score >= 55 ? "HIGH" : "MEDIUM"}
                      >
                        Priority {Math.round(pz.priority_score)}
                      </SeverityBadge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Mission Activity */}
            <div className="bg-white rounded-xl border border-[#E4EAE7] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[#202A28]">Recent Mission Activity</h2>
                  <p className="text-xs text-[#6B7773]">Completed and simulated cleaning operations.</p>
                </div>
                <Link
                  href="/history"
                  className="text-xs font-semibold text-[#176B5B] hover:underline"
                >
                  View Archive
                </Link>
              </div>

              <div className="divide-y divide-[#E4EAE7]">
                {activity?.recent_missions?.length === 0 ? (
                  <p className="text-xs text-[#6B7773] py-4 text-center">No missions planned yet.</p>
                ) : (
                  activity?.recent_missions?.map((m) => (
                    <div
                      key={m.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#202A28]">{m.name}</div>
                        <div className="text-[11px] text-[#6B7773] mt-0.5">
                          {formatDistance(m.distance_km)} · {formatTimeAgo(m.created_at)}
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Secondary Section (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Simulated Boat Status Panel */}
            <div className="bg-white rounded-xl border border-[#E4EAE7] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
                <h3 className="text-sm font-bold text-[#202A28] flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#176B5B]" />
                  Simulated Boat Status
                </h3>
                <span className="text-[10px] uppercase font-semibold text-[#247A52] bg-[#EDF7F2] px-2 py-0.5 rounded-full border border-[#C6E7D6]">
                  Software Engine
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Battery Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#6B7773] font-medium flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-[#176B5B]" /> Battery State
                    </span>
                    <span className="font-bold text-[#202A28]">
                      {summary ? `${Math.round(summary.simulated_battery_level_pct)}%` : "--"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F4F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#176B5B] rounded-full transition-all duration-300"
                      style={{ width: `${summary ? summary.simulated_battery_level_pct : 100}%` }}
                    />
                  </div>
                </div>

                {/* Bin Load Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#6B7773] font-medium flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5 text-[#238A78]" /> Collection Bin Load
                    </span>
                    <span className="font-bold text-[#202A28]">
                      {summary ? `${Math.round(summary.simulated_bin_capacity_pct)}%` : "--"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F4F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#238A78] rounded-full transition-all duration-300"
                      style={{ width: `${summary ? summary.simulated_bin_capacity_pct : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[11px] text-[#6B7773] leading-relaxed">
                  The simulated vessel is currently docked at the home slip. Launching a mission will track waypoint telemetry and drain battery deterministically.
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-xl border border-[#E4EAE7] p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#202A28]">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/missions"
                  className="w-full p-2.5 rounded-lg border border-[#E4EAE7] hover:border-[#176B5B] hover:bg-[#F7F9F8] transition flex items-center justify-between text-xs font-semibold text-[#202A28]"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#176B5B]" />
                    <span>Plan Candidate Mission</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7773]" />
                </Link>

                <Link
                  href="/reports"
                  className="w-full p-2.5 rounded-lg border border-[#E4EAE7] hover:border-[#176B5B] hover:bg-[#F7F9F8] transition flex items-center justify-between text-xs font-semibold text-[#202A28]"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#A56613]" />
                    <span>Log Waste Observation</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7773]" />
                </Link>

                <Link
                  href="/simulation"
                  className="w-full p-2.5 rounded-lg border border-[#E4EAE7] hover:border-[#176B5B] hover:bg-[#F7F9F8] transition flex items-center justify-between text-xs font-semibold text-[#202A28]"
                >
                  <span className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-[#247A52]" />
                    <span>Live Mission Simulator</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7773]" />
                </Link>
              </div>
            </div>

            {/* Recent Reports Feed */}
            <div className="bg-white rounded-xl border border-[#E4EAE7] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-2">
                <h3 className="text-sm font-bold text-[#202A28]">Recent Waste Reports</h3>
                <Link href="/reports" className="text-xs text-[#176B5B] font-semibold hover:underline">
                  All
                </Link>
              </div>

              <div className="space-y-2.5">
                {activity?.recent_reports?.slice(0, 4).map((r) => (
                  <div key={r.id} className="text-xs space-y-1 pb-2 border-b border-[#F0F3F2] last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[#202A28] truncate">{r.title}</span>
                      <SeverityBadge severity={r.severity} />
                    </div>
                    <div className="text-[11px] text-[#6B7773] flex justify-between">
                      <span>{r.category}</span>
                      <span>{formatTimeAgo(r.observed_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
