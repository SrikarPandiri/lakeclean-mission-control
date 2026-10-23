"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { getAnalyticsOverview, getMissions, getReports } from "@/lib/api";
import { formatWeight, formatDistance } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Download,
  Trash2,
  Navigation,
  CheckCircle,
  FileText,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";

// Calm environmental palette for charts
const CHART_COLORS = ["#176B5B", "#238A78", "#247A52", "#A56613", "#B83C3C", "#6B7773"];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [missions, setMissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, mData, rData] = await Promise.all([
          getAnalyticsOverview(),
          getMissions(),
          getReports(),
        ]);
        setAnalytics(anData);
        setMissions(mData || []);
        setReports(rData || []);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const exportCSV = () => {
    if (!missions.length) return;
    const headers = [
      "ID",
      "Name",
      "Status",
      "Distance_km",
      "Duration_mins",
      "Initial_Battery",
      "Final_Battery",
      "Final_Bin_Fill",
    ];
    const rows = missions.map((m) => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      m.status,
      m.planned_distance_km,
      m.estimated_duration_minutes,
      m.initial_battery_pct,
      m.current_battery_pct,
      m.current_bin_fill_pct,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `lakeclean_mission_analytics_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wasteCategoryData = analytics?.waste_by_category
    ? Object.entries(analytics.waste_by_category).map(([name, value]) => ({ name, value }))
    : [];

  const missionStatusData = analytics?.missions_by_status
    ? Object.entries(analytics.missions_by_status).map(([name, value]) => ({ name, value }))
    : [];

  const priorityDistData = analytics?.priority_distribution
    ? Object.entries(analytics.priority_distribution).map(([name, count]) => ({ name, count }))
    : [];

  const zoneStatusData = analytics?.zones_completed_vs_incomplete
    ? Object.entries(analytics.zones_completed_vs_incomplete).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div>
      <Header
        title="Analytics & Operations Reports"
        subtitle="Quantitative assessment of simulated waste removal, operational coverage, and sector risk profiles."
        actionButton={
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-[#176B5B]" />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Notice Pill */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E4EAE7] flex items-center justify-between text-xs text-[#6B7773] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#247A52]" />
            <span>
              All calculated figures represent <strong>simulated and estimated values</strong> derived from synthetic model observations.
            </span>
          </div>
          <span className="font-mono text-[#176B5B] text-[11px] font-semibold">
            Academic Demonstration Model
          </span>
        </div>

        {/* Aggregated KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sim Distance"
            value={analytics ? formatDistance(analytics.total_simulated_distance_km) : "--"}
            subtitle="Completed mission routes"
            icon={Navigation}
            variant="primary"
          />
          <StatCard
            title="Est. Waste Collected"
            value={analytics ? formatWeight(analytics.total_simulated_waste_kg) : "--"}
            subtitle="Synthetic retrieved debris"
            icon={Trash2}
            variant="teal"
          />
          <StatCard
            title="Recorded Hotspots"
            value={reports.length}
            subtitle="Cluster reports logged"
            icon={Layers}
            variant="warning"
          />
          <StatCard
            title="Total Missions"
            value={missions.length}
            subtitle="Logged mission runs"
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* 2-Column Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Waste Reports by Category (Donut/Pie) */}
          <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-2">
              <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider">
                Waste Reports by Category
              </span>
              <span className="text-[11px] text-[#6B7773]">Count breakdown</span>
            </div>

            <div className="h-64 w-full">
              {wasteCategoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#6B7773] text-xs">
                  No categorical waste data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {wasteCategoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E4EAE7",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Zone Priority Distribution (Bar) */}
          <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-2">
              <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider">
                Sector Priority Distribution
              </span>
              <span className="text-[11px] text-[#6B7773]">Risk Stratification</span>
            </div>

            <div className="h-64 w-full">
              {priorityDistData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#6B7773] text-xs">
                  No priority stratification data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityDistData}>
                    <XAxis dataKey="name" stroke="#6B7773" fontSize={11} />
                    <YAxis stroke="#6B7773" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E4EAE7",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar dataKey="count" fill="#176B5B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Missions by Operational Status */}
          <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-2">
              <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider">
                Missions by Operational Status
              </span>
              <span className="text-[11px] text-[#6B7773]">Execution States</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missionStatusData}>
                  <XAxis dataKey="name" stroke="#6B7773" fontSize={11} />
                  <YAxis stroke="#6B7773" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E4EAE7",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="value" fill="#238A78" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Sectors Cleaned vs Pending */}
          <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-2">
              <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider">
                Sectors Cleaned vs Pending
              </span>
              <span className="text-[11px] text-[#6B7773]">Basin Coverage</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#247A52" />
                    <Cell fill="#A56613" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E4EAE7",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Academic Project Summary Card */}
        <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-[#176B5B] font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>Academic Demonstration & Evaluation Summary</span>
          </div>
          <p className="text-xs text-[#6B7773] leading-relaxed">
            LakeClean Mission Control demonstrates a closed-loop environmental robotics operations platform. By fusing transparent priority scoring, capacity-aware route generation, and simulation feedback, the software verifies mission feasibility prior to autonomous boat dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
