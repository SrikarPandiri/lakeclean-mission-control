"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { getMissions, getMission, getMissionEvents, getAllZones } from "@/lib/api";
import { formatDate, formatDistance, formatDuration, formatTimeAgo } from "@/lib/formatters";
import {
  History,
  Search,
  Filter,
  PlayCircle,
  Clock,
  Compass,
  Battery,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function MissionHistoryPage() {
  const [missions, setMissions] = useState([]);
  const [zones, setZones] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedMission, setSelectedMission] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [missionsData, zonesData] = await Promise.all([
        getMissions(statusFilter),
        getAllZones(),
      ]);
      setMissions(missionsData || []);
      setZones(zonesData || []);
    } catch (err) {
      console.error("Failed to load mission history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleInspectMission = async (m) => {
    setSelectedMission(m);
    try {
      const evs = await getMissionEvents(m.id);
      setEvents(evs || []);
    } catch (err) {
      console.error("Failed to load mission events:", err);
    }
  };

  const filteredMissions = missions.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Mission History & Flight Logs"
        subtitle="Chronological archive of autonomous cleaning operations, battery consumption, and recorded telemetry."
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Search & Status Filters */}
        <div className="p-4 rounded-xl border border-[#E4EAE7] bg-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#6B7773] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search missions by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs focus:outline-hidden focus:border-[#176B5B] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-[#6B7773] font-medium">Filter by Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs focus:outline-hidden focus:border-[#176B5B]"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="RUNNING">Running</option>
              <option value="PAUSED">Paused</option>
              <option value="PLANNED">Planned</option>
              <option value="ABORTED">Aborted</option>
            </select>
          </div>
        </div>

        {/* Missions Table for Desktop */}
        <div className="rounded-xl border border-[#E4EAE7] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9F8] text-[#6B7773] font-semibold border-b border-[#E4EAE7] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Mission Operation</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Distance</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Battery Margin</th>
                  <th className="px-4 py-3.5">Bin Load</th>
                  <th className="px-4 py-3.5">Target Sectors</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE7]">
                {filteredMissions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-[#6B7773]">
                      No matching historical mission records found.
                    </td>
                  </tr>
                ) : (
                  filteredMissions.map((m) => {
                    const sectorCount = m.selected_zone_ids?.length || 0;
                    const completedCount = m.completed_zone_ids?.length || 0;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-[#F7F9F8] transition cursor-pointer"
                        onClick={() => handleInspectMission(m)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#202A28]">{m.name}</div>
                          <div className="text-[10px] text-[#6B7773] font-mono">{m.id}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3.5 text-[#202A28] font-medium">
                          {formatDistance(m.planned_distance_km)}
                        </td>
                        <td className="px-4 py-3.5 text-[#6B7773]">
                          {formatDuration(m.estimated_duration_minutes)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[#176B5B] font-semibold">
                            {Math.round(m.initial_battery_pct)}% → {Math.round(m.current_battery_pct)}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[#238A78] font-semibold">
                            {Math.round(m.current_bin_fill_pct)}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#6B7773]">
                          {completedCount}/{sectorCount} sectors
                        </td>
                        <td className="px-4 py-3.5 text-[#6B7773]">
                          {formatTimeAgo(m.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/simulation?mission_id=${m.id}`}
                              className="px-2.5 py-1 rounded bg-[#EAF5F2] hover:bg-[#D5EDE7] text-[#176B5B] text-[11px] font-semibold transition flex items-center gap-1"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Simulate</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Mission Details & Timeline */}
      <Modal
        isOpen={Boolean(selectedMission)}
        onClose={() => setSelectedMission(null)}
        title="Mission Flight Log & Resource Verification"
      >
        {selectedMission && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-[#E4EAE7] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#202A28]">{selectedMission.name}</h3>
                <span className="text-[10px] text-[#6B7773] font-mono">
                  ID: {selectedMission.id} · Initiated by {selectedMission.created_by}
                </span>
              </div>
              <StatusBadge status={selectedMission.status} />
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F9F8] p-3.5 rounded-lg border border-[#E4EAE7] text-xs">
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Planned Distance</span>
                <span className="font-semibold text-[#202A28]">
                  {formatDistance(selectedMission.planned_distance_km)}
                </span>
              </div>
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Estimated Time</span>
                <span className="font-semibold text-[#202A28]">
                  {formatDuration(selectedMission.estimated_duration_minutes)}
                </span>
              </div>
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Battery Consumed</span>
                <span className="font-semibold text-[#176B5B]">
                  {Math.round(selectedMission.initial_battery_pct - selectedMission.current_battery_pct)}%
                </span>
              </div>
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Final Bin Load</span>
                <span className="font-semibold text-[#238A78]">
                  {Math.round(selectedMission.current_bin_fill_pct)}%
                </span>
              </div>
            </div>

            {/* Mission Events Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#202A28] uppercase tracking-wider block">
                Recorded Flight Timeline ({events.length} Events)
              </span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <div className="text-[#6B7773] text-center py-4">No events recorded.</div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-xs space-y-0.5"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-[#176B5B]">
                          {ev.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[#6B7773]">{formatDate(ev.created_at)}</span>
                      </div>
                      <p className="text-[#202A28] text-[11px] leading-relaxed">{ev.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EAE7]">
              <Link
                href={`/simulation?mission_id=${selectedMission.id}`}
                className="px-4 py-2 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white font-semibold transition flex items-center gap-1.5 shadow-xs"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Open in Simulation</span>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
