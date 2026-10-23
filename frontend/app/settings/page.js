"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getHealth } from "@/lib/api";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Sliders,
  HelpCircle,
  Code2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function SettingsMethodologyPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const h = await getHealth();
        setHealth(h);
      } catch (e) {
        console.error("Health check error:", e);
      }
    }
    loadHealth();
  }, []);

  return (
    <div>
      <Header
        title="Settings, Methodology & System Architecture"
        subtitle="Operational parameters, mathematical formulations, algorithmic models, and provenance."
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* System Deployment & Mode Card */}
        <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
            <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#176B5B]" /> Environment & Integration Status
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#EDF7F2] border border-[#C6E7D6] text-[#247A52] text-xs font-semibold">
              {health?.mode || "Demo Mode Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
              <span className="text-[#6B7773] text-[10px] uppercase font-semibold">Backend Service</span>
              <div className="font-bold text-[#202A28] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#247A52]" /> FastAPI (Python 3.14)
              </div>
              <div className="text-[11px] text-[#6B7773]">
                {typeof window !== "undefined" && window.location.hostname !== "localhost"
                  ? "Cloud REST API on Render"
                  : "Local REST API at http://localhost:8000"}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
              <span className="text-[#6B7773] text-[10px] uppercase font-semibold">Persistence Layer</span>
              <div className="font-bold text-[#202A28] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#176B5B]" /> {health?.database || "SQLite (Local Fallback)"}
              </div>
              <div className="text-[11px] text-[#6B7773]">Supabase PostgreSQL turnkey schema ready</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
              <span className="text-[#6B7773] text-[10px] uppercase font-semibold">Hardware Telemetry</span>
              <div className="font-bold text-[#A56613] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> Software Simulation
              </div>
              <div className="text-[11px] text-[#6B7773]">Future MQTT boat integration point ready</div>
            </div>
          </div>
        </div>

        {/* Priority Scoring Methodology */}
        <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
            <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#176B5B]" /> Explainable Zone Priority Scoring Formulation
            </span>
            <span className="text-xs text-[#176B5B] font-mono font-semibold">0.0 to 100.0 Scale</span>
          </div>

          <div className="space-y-3 text-xs text-[#202A28] leading-relaxed">
            <p className="text-[#6B7773]">
              Each lake sector is evaluated dynamically using normalized environmental risk factors. Rather than an opaque black box, every score contribution is mathematically explainable:
            </p>

            <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] font-mono text-[#176B5B] text-xs font-semibold">
              Priority Score = 0.35 × Severity + 0.25 × Waste Density + 0.20 × Freshness + 0.20 × Runoff Exposure
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
                <span className="font-bold text-[#202A28]">1. Waste Severity (35% weight)</span>
                <p className="text-[11px] text-[#6B7773] leading-relaxed">
                  Reflects the physical hazard and entangling propensity of the reported debris (e.g. industrial film, beverage bottles, micro-polystyrene).
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
                <span className="font-bold text-[#202A28]">2. Waste Density (25% weight)</span>
                <p className="text-[11px] text-[#6B7773] leading-relaxed">
                  Estimated volume concentration per 100 square meters, indicating localized hotspots.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
                <span className="font-bold text-[#202A28]">3. Observation Freshness (20% weight)</span>
                <p className="text-[11px] text-[#6B7773] leading-relaxed">
                  Decays over time elapsed since observation (&lt;6 hrs: 100, &lt;24 hrs: 85, &lt;48 hrs: 70, &lt;7 days: 50, &gt;14 days: 15).
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] space-y-1">
                <span className="font-bold text-[#202A28]">4. Runoff Exposure (20% weight)</span>
                <p className="text-[11px] text-[#6B7773] leading-relaxed">
                  Vulnerability to stormwater influx from adjacent culverts and urban drainage outfalls.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-[#6B7773] pt-1">
              <em>Handling missing observations:</em> If freshness or runoff data is unavailable for a sector, the scoring service automatically utilizes transparent defaults and logs attribution in factor breakdowns without crashing.
            </p>
          </div>
        </div>

        {/* Route Planning & Constraint Verification Algorithm */}
        <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
            <span className="text-xs font-bold text-[#202A28] uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#238A78]" /> Deterministic Capacity-Aware Route Planner
            </span>
            <span className="text-xs text-[#238A78] font-mono font-semibold">Greedy Priority TSP</span>
          </div>

          <div className="space-y-3 text-xs text-[#202A28] leading-relaxed">
            <p className="text-[#6B7773]">
              To ensure safety and deterministic predictability, candidate mission routes are generated by an algorithmic planner in Python:
            </p>

            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-[#6B7773]">
              <li>
                <strong className="text-[#202A28]">Haversine Geodetic Metric:</strong> Accurately calculates nautical distances between docking berths and sector coordinates.
              </li>
              <li>
                <strong className="text-[#202A28]">Priority-Weighted Sequencing:</strong> Greedily prioritizes sectors balancing high environmental risk against minimal battery traversal cost.
              </li>
              <li>
                <strong className="text-[#202A28]">Mandatory Return-to-Dock Waypoint:</strong> Ensures the boat always reserves sufficient battery to navigate back to its launch dock slip.
              </li>
              <li>
                <strong className="text-[#202A28]">Multi-Constraint Feasibility Guard:</strong> Pre-flight verification rejects plans if remaining battery drops below safety reserve (e.g. 20%), if collection bin capacity overflows, or if any restricted wildlife sanctuary is selected.
              </li>
            </ul>
          </div>
        </div>

        {/* Data Provenance & Limitations */}
        <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-3 shadow-xs text-xs">
          <span className="font-bold text-[#202A28] uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#A56613]" /> Data Provenance & Limitations
          </span>

          <p className="text-[#6B7773] leading-relaxed text-[11px]">
            This application is constructed for academic demonstration and simulation. <strong>All lake bathymetry, waste coordinates, and boat telemetry are synthetic simulation models.</strong> Do not interpret demonstration records as measured toxicological water quality readings. Physical hardware integration requires connecting our boat telemetry MQTT broker with verified GPS transponders.
          </p>
        </div>
      </div>
    </div>
  );
}
