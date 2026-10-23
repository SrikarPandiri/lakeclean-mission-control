"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import MapContainerDynamic from "@/components/map/MapContainerDynamic";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { getLakes, getAllZones, getReports, createReport } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import {
  MapPin,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Sliders,
  Info,
  Calendar,
  Layers,
  CheckCircle,
  ArrowRight,
  Compass,
} from "lucide-react";

export default function LakeMapPage() {
  const [lake, setLake] = useState(null);
  const [zones, setZones] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // New report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    title: "",
    category: "Plastic bottles",
    severity: "HIGH",
    estimated_density: 65,
    latitude: 30.255,
    longitude: -97.745,
    description: "",
    zone_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [lakesData, zonesData, reportsData] = await Promise.all([
        getLakes(),
        getAllZones(),
        getReports(),
      ]);
      if (lakesData && lakesData.length > 0) setLake(lakesData[0]);
      setZones(zonesData || []);
      setReports(reportsData || []);
      if (zonesData && zonesData.length > 0 && !selectedZone) {
        setSelectedZone(zonesData[0]);
      }
    } catch (err) {
      console.error("Failed to load map data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!lake) return;
    setSubmitting(true);
    try {
      await createReport({
        ...newReport,
        water_body_id: lake.id,
        zone_id: newReport.zone_id || (selectedZone ? selectedZone.id : null),
        latitude: parseFloat(newReport.latitude),
        longitude: parseFloat(newReport.longitude),
        estimated_density: parseFloat(newReport.estimated_density),
      });
      setIsReportModalOpen(false);
      setNewReport({
        title: "",
        category: "Plastic bottles",
        severity: "HIGH",
        estimated_density: 65,
        latitude: 30.255,
        longitude: -97.745,
        description: "",
        zone_id: "",
      });
      await loadData();
    } catch (err) {
      alert(`Error submitting report: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header
        title="Lake Map & Cleaning Zones"
        subtitle="Georeferenced waste distribution, cleaning sectors, and navigational boundaries."
        actionButton={
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sample Report</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Main Map + Inspector Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map Workspace (8 Cols on lg) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#6B7773] px-1">
              <span className="flex items-center gap-1.5 font-semibold text-[#202A28]">
                <MapPin className="w-3.5 h-3.5 text-[#176B5B]" />
                {lake?.name || "Demonstration Water Basin"}
              </span>
              <span>Click any zone polygon or marker to inspect</span>
            </div>

            <MapContainerDynamic
              waterBody={lake}
              zones={zones}
              reports={reports}
              selectedZone={selectedZone}
              onSelectZone={(z) => {
                setSelectedZone(z);
                setSelectedReport(null);
              }}
              onSelectReport={(r) => {
                setSelectedReport(r);
                const matchingZone = zones.find((z) => z.id === r.zone_id);
                if (matchingZone) setSelectedZone(matchingZone);
              }}
              height="620px"
            />
          </div>

          {/* Contextual Inspector Panel (4 Cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Zone Detail Card */}
            {selectedZone ? (
              <div className="p-5 rounded-xl border border-[#E4EAE7] bg-white space-y-4 shadow-xs">
                <div className="flex items-start justify-between gap-2 border-b border-[#E4EAE7] pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7773]">
                      Selected Cleaning Sector
                    </span>
                    <h2 className="text-base font-bold text-[#202A28] mt-0.5">
                      {selectedZone.name}
                    </h2>
                  </div>
                  {selectedZone.is_restricted ? (
                    <SeverityBadge severity="CRITICAL">Restricted</SeverityBadge>
                  ) : (
                    <SeverityBadge
                      severity={
                        selectedZone.priority_score >= 75
                          ? "CRITICAL"
                          : selectedZone.priority_score >= 55
                          ? "HIGH"
                          : "MEDIUM"
                      }
                    >
                      Priority {Math.round(selectedZone.priority_score)}
                    </SeverityBadge>
                  )}
                </div>

                <p className="text-xs text-[#6B7773] leading-relaxed">
                  {selectedZone.description}
                </p>

                {/* Priority Factor Breakdown with Clean Progress Bars */}
                <div className="space-y-3 bg-[#F7F9F8] p-3.5 rounded-lg border border-[#E4EAE7] text-xs">
                  <div className="text-[11px] font-semibold text-[#202A28] flex items-center justify-between">
                    <span>Priority Factor Contributions</span>
                    <span className="text-[10px] text-[#6B7773] font-mono">0–100 Scale</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7773]">Waste Severity (35%):</span>
                        <span className="font-semibold text-[#202A28]">
                          {selectedZone.severity_score}/100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E4EAE7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#B83C3C] rounded-full"
                          style={{ width: `${selectedZone.severity_score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7773]">Waste Density (25%):</span>
                        <span className="font-semibold text-[#202A28]">
                          {selectedZone.waste_density_score}/100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E4EAE7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#A56613] rounded-full"
                          style={{ width: `${selectedZone.waste_density_score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7773]">Runoff Exposure (20%):</span>
                        <span className="font-semibold text-[#202A28]">
                          {selectedZone.runoff_exposure_score}/100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E4EAE7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#238A78] rounded-full"
                          style={{ width: `${selectedZone.runoff_exposure_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedZone.is_restricted && (
                  <div className="p-3 rounded-lg bg-[#FDF0F0] border border-[#F7C8C8] text-xs text-[#B83C3C] flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Protected Wildlife Sanctuary</div>
                      <div className="text-[11px] mt-0.5 leading-snug">
                        Autonomous boat navigation in this sector is prohibited by safety constraints to safeguard local waterbird habitats.
                      </div>
                    </div>
                  </div>
                )}

                {/* Action: Plan Route with this zone */}
                <div className="pt-1">
                  <Link
                    href={`/missions`}
                    className="w-full py-2 px-3 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Plan Mission for this Sector</span>
                  </Link>
                </div>

                {/* Hotspot Reports Associated to This Zone */}
                <div className="space-y-2 pt-2 border-t border-[#E4EAE7]">
                  <div className="text-xs font-semibold text-[#202A28] uppercase tracking-wider flex items-center justify-between">
                    <span>Reports in Sector</span>
                    <span className="text-[11px] text-[#6B7773] font-normal">
                      {reports.filter((r) => r.zone_id === selectedZone.id).length} recorded
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {reports
                      .filter((r) => r.zone_id === selectedZone.id)
                      .map((rep) => (
                        <div
                          key={rep.id}
                          onClick={() => setSelectedReport(rep)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            selectedReport?.id === rep.id
                              ? "bg-[#EAF5F2] border-[#176B5B] text-[#202A28]"
                              : "bg-[#F7F9F8] border-[#E4EAE7] text-[#6B7773] hover:border-[#CCD6D2]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-semibold text-[#202A28] truncate">{rep.title}</span>
                            <SeverityBadge severity={rep.severity} />
                          </div>
                          <div className="text-[10px] text-[#6B7773] flex items-center justify-between">
                            <span>{rep.category}</span>
                            <span>{formatDate(rep.observed_at)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-[#E4EAE7] bg-white text-center text-[#6B7773] text-xs">
                Click any zone on the map to inspect its factors.
              </div>
            )}

            {/* Selected Waste Report Detail Preview */}
            {selectedReport && (
              <div className="p-4 rounded-xl border border-[#E4EAE7] bg-white space-y-2 text-xs shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-[#202A28]">{selectedReport.title}</div>
                  <StatusBadge status={selectedReport.report_status} />
                </div>
                <p className="text-[#6B7773] leading-relaxed text-[11px]">
                  {selectedReport.description}
                </p>
                <div className="text-[10px] text-[#6B7773] flex items-center justify-between pt-1 border-t border-[#E4EAE7]">
                  <span>Category: {selectedReport.category}</span>
                  <span>Density: {selectedReport.estimated_density}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Sample Report */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Add Demonstration Waste Report"
      >
        <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#202A28] font-semibold mb-1">Report Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Discarded beverage bottles near shoreline"
              value={newReport.title}
              onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#202A28] font-semibold mb-1">Waste Category</label>
              <select
                value={newReport.category}
                onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
              >
                <option value="Plastic bottles">Plastic bottles</option>
                <option value="Plastic wrappers">Plastic wrappers</option>
                <option value="Floating packaging">Floating packaging</option>
                <option value="Organic debris">Organic debris</option>
                <option value="Mixed waste">Mixed waste</option>
                <option value="Other visible floating waste">Other visible floating waste</option>
              </select>
            </div>

            <div>
              <label className="block text-[#202A28] font-semibold mb-1">Severity Level</label>
              <select
                value={newReport.severity}
                onChange={(e) => setNewReport({ ...newReport, severity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#202A28] font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newReport.latitude}
                onChange={(e) => setNewReport({ ...newReport, latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
              />
            </div>

            <div>
              <label className="block text-[#202A28] font-semibold mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newReport.longitude}
                onChange={(e) => setNewReport({ ...newReport, longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#202A28] font-semibold mb-1">
              Estimated Waste Density: {newReport.estimated_density}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={newReport.estimated_density}
              onChange={(e) => setNewReport({ ...newReport, estimated_density: e.target.value })}
              className="w-full accent-[#176B5B]"
            />
          </div>

          <div>
            <label className="block text-[#202A28] font-semibold mb-1">Target Sector (Optional)</label>
            <select
              value={newReport.zone_id}
              onChange={(e) => setNewReport({ ...newReport, zone_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
            >
              <option value="">Auto-associate</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#202A28] font-semibold mb-1">Description</label>
            <textarea
              rows="3"
              placeholder="Describe observation circumstances..."
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EAE7]">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E4EAE7] hover:bg-[#F7F9F8] text-[#6B7773] font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white font-semibold shadow-xs transition"
            >
              {submitting ? "Submitting..." : "Save Sample Report"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
