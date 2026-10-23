"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  verifyReport,
  getLakes,
  getAllZones,
} from "@/lib/api";
import { formatDate, formatTimeAgo } from "@/lib/formatters";
import {
  AlertOctagon,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Layers,
  Info,
  Loader2,
  Check,
  RefreshCw,
} from "lucide-react";

export default function WasteReportsPage() {
  const [reports, setReports] = useState([]);
  const [lake, setLake] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Plastic bottles",
    severity: "HIGH",
    estimated_density: 60,
    latitude: 30.255,
    longitude: -97.745,
    description: "",
    zone_id: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadReportsData = async () => {
    try {
      const [reps, lakesData, zonesData] = await Promise.all([
        getReports({
          search: searchTerm,
          category: selectedCategory,
          severity: selectedSeverity,
          report_status: selectedStatus,
        }),
        getLakes(),
        getAllZones(),
      ]);

      setReports(reps || []);
      if (lakesData && lakesData.length > 0) setLake(lakesData[0]);
      setZones(zonesData || []);
    } catch (err) {
      console.error("Failed to load waste reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [searchTerm, selectedCategory, selectedSeverity, selectedStatus]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Please provide a report title.";
    if (isNaN(parseFloat(formData.latitude))) errors.latitude = "Valid latitude is required.";
    if (isNaN(parseFloat(formData.longitude))) errors.longitude = "Valid longitude is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm() || !lake) return;
    setSubmitting(true);
    try {
      await createReport({
        ...formData,
        water_body_id: lake.id,
        zone_id: formData.zone_id || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        estimated_density: parseFloat(formData.estimated_density),
      });
      setIsCreateOpen(false);
      setFormData({
        title: "",
        category: "Plastic bottles",
        severity: "HIGH",
        estimated_density: 60,
        latitude: 30.255,
        longitude: -97.745,
        description: "",
        zone_id: "",
      });
      setFieldErrors({});
      await loadReportsData();
    } catch (err) {
      alert(`Error creating report: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (reportId, status) => {
    try {
      await verifyReport(reportId, status);
      await loadReportsData();
      if (selectedDetail && selectedDetail.id === reportId) {
        setSelectedDetail({ ...selectedDetail, verification_status: status });
      }
    } catch (err) {
      alert(`Verification update failed: ${err.message}`);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await updateReport(reportId, { report_status: newStatus });
      await loadReportsData();
      if (selectedDetail && selectedDetail.id === reportId) {
        setSelectedDetail({ ...selectedDetail, report_status: newStatus });
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div>
      <Header
        title="Waste Reports Registry"
        subtitle="Catalog of scout and volunteer waste observations, verification triage, and cleanup status."
        actionButton={
          <button
            onClick={() => {
              setFieldErrors({});
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Waste Report</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-xl border border-[#E4EAE7] bg-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#6B7773] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports by title or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs focus:outline-hidden focus:border-[#176B5B] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs focus:outline-hidden focus:border-[#176B5B]"
            >
              <option value="">All Categories</option>
              <option value="Plastic bottles">Plastic bottles</option>
              <option value="Plastic wrappers">Plastic wrappers</option>
              <option value="Floating packaging">Floating packaging</option>
              <option value="Organic debris">Organic debris</option>
              <option value="Mixed waste">Mixed waste</option>
              <option value="Other visible floating waste">Other visible waste</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs focus:outline-hidden focus:border-[#176B5B]"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F7F9F8] border border-[#E4EAE7] text-[#202A28] text-xs focus:outline-hidden focus:border-[#176B5B]"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Reports Table / Card List */}
        <div className="rounded-xl border border-[#E4EAE7] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9F8] text-[#6B7773] font-semibold border-b border-[#E4EAE7] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Report Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Severity</th>
                  <th className="px-4 py-3.5">Sector</th>
                  <th className="px-4 py-3.5">Observed</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE7]">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-[#6B7773]">
                      No matching waste reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => {
                    const zone = zones.find((z) => z.id === r.zone_id);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-[#F7F9F8] transition cursor-pointer"
                        onClick={() => setSelectedDetail(r)}
                      >
                        <td className="px-4 py-3 font-semibold text-[#202A28] max-w-[220px] truncate">
                          {r.title}
                        </td>
                        <td className="px-4 py-3 text-[#202A28]">{r.category}</td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={r.severity} />
                        </td>
                        <td className="px-4 py-3 text-[#6B7773]">
                          {zone ? zone.name : "Unassigned"}
                        </td>
                        <td className="px-4 py-3 text-[#6B7773]">
                          {formatTimeAgo(r.observed_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              r.verification_status === "VERIFIED"
                                ? "bg-[#EAF5F2] text-[#176B5B] border-[#BDE0D8]"
                                : r.verification_status === "REJECTED"
                                ? "bg-[#FDF0F0] text-[#B83C3C] border-[#F7C8C8]"
                                : "bg-[#F0F3F2] text-[#6B7773] border-[#E4EAE7]"
                            }`}
                          >
                            {r.verification_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.report_status} />
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {r.verification_status !== "VERIFIED" && (
                              <button
                                onClick={() => handleVerify(r.id, "VERIFIED")}
                                className="px-2 py-1 rounded bg-[#EAF5F2] hover:bg-[#D5EDE7] text-[#176B5B] text-[11px] font-semibold transition"
                                title="Verify observation"
                              >
                                Verify
                              </button>
                            )}
                            {r.report_status !== "RESOLVED" && (
                              <button
                                onClick={() => handleStatusChange(r.id, "RESOLVED")}
                                className="px-2 py-1 rounded bg-[#EDF7F2] hover:bg-[#DDF0E6] text-[#247A52] text-[11px] font-semibold transition"
                                title="Mark as resolved / cleaned"
                              >
                                Resolve
                              </button>
                            )}
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

      {/* Modal: View Details */}
      <Modal
        isOpen={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        title="Waste Report Inspector"
      >
        {selectedDetail && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-[#E4EAE7] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#202A28]">{selectedDetail.title}</h3>
                <span className="text-[11px] text-[#6B7773]">
                  Observed {formatDate(selectedDetail.observed_at)} by {selectedDetail.created_by}
                </span>
              </div>
              <div className="flex gap-1.5">
                <SeverityBadge severity={selectedDetail.severity} />
                <StatusBadge status={selectedDetail.report_status} />
              </div>
            </div>

            <p className="text-[#202A28] leading-relaxed text-xs">
              {selectedDetail.description || "No narrative details recorded."}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-[#F7F9F8] p-3.5 rounded-lg border border-[#E4EAE7] text-xs">
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Category</span>
                <span className="font-semibold text-[#202A28]">{selectedDetail.category}</span>
              </div>
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Waste Density</span>
                <span className="font-semibold text-[#202A28]">{selectedDetail.estimated_density}%</span>
              </div>
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Coordinates</span>
                <span className="font-semibold text-[#202A28] font-mono">
                  {selectedDetail.latitude.toFixed(4)}, {selectedDetail.longitude.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-[#6B7773] block text-[10px] uppercase font-semibold">Verification</span>
                <span className="font-semibold text-[#176B5B]">
                  {selectedDetail.verification_status}
                </span>
              </div>
            </div>

            {/* Verification & Status Toggles */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E4EAE7]">
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(selectedDetail.id, "VERIFIED")}
                  className="px-3 py-1.5 rounded-lg bg-[#EAF5F2] hover:bg-[#D5EDE7] text-[#176B5B] font-semibold transition"
                >
                  Verify Report
                </button>
                <button
                  onClick={() => handleVerify(selectedDetail.id, "REJECTED")}
                  className="px-3 py-1.5 rounded-lg bg-[#FDF0F0] hover:bg-[#FBE4E4] text-[#B83C3C] font-semibold transition"
                >
                  Reject
                </button>
              </div>

              {selectedDetail.report_status !== "RESOLVED" ? (
                <button
                  onClick={() => handleStatusChange(selectedDetail.id, "RESOLVED")}
                  className="px-3.5 py-1.5 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white font-semibold transition"
                >
                  Mark Resolved
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(selectedDetail.id, "OPEN")}
                  className="px-3 py-1.5 rounded-lg border border-[#E4EAE7] text-[#6B7773] hover:text-[#202A28] font-semibold transition"
                >
                  Re-open
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Report */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Waste Report"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#202A28] font-semibold mb-1">
              Report Title <span className="text-[#B83C3C]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Accumulation of plastic wrappers near boat ramp"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg bg-white border text-[#202A28] focus:outline-hidden ${
                fieldErrors.title ? "border-[#B83C3C]" : "border-[#E4EAE7] focus:border-[#176B5B]"
              }`}
            />
            {fieldErrors.title && (
              <span className="text-[11px] text-[#B83C3C] mt-1 block">{fieldErrors.title}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#202A28] font-semibold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
              >
                <option value="Plastic bottles">Plastic bottles</option>
                <option value="Plastic wrappers">Plastic wrappers</option>
                <option value="Floating packaging">Floating packaging</option>
                <option value="Organic debris">Organic debris</option>
                <option value="Mixed waste">Mixed waste</option>
                <option value="Other visible floating waste">Other visible waste</option>
              </select>
            </div>

            <div>
              <label className="block text-[#202A28] font-semibold mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
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
              <label className="block text-[#202A28] font-semibold mb-1">
                Latitude <span className="text-[#B83C3C]">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg bg-white border text-[#202A28] focus:outline-hidden ${
                  fieldErrors.latitude ? "border-[#B83C3C]" : "border-[#E4EAE7] focus:border-[#176B5B]"
                }`}
              />
              {fieldErrors.latitude && (
                <span className="text-[11px] text-[#B83C3C] mt-1 block">{fieldErrors.latitude}</span>
              )}
            </div>
            <div>
              <label className="block text-[#202A28] font-semibold mb-1">
                Longitude <span className="text-[#B83C3C]">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg bg-white border text-[#202A28] focus:outline-hidden ${
                  fieldErrors.longitude ? "border-[#B83C3C]" : "border-[#E4EAE7] focus:border-[#176B5B]"
                }`}
              />
              {fieldErrors.longitude && (
                <span className="text-[11px] text-[#B83C3C] mt-1 block">{fieldErrors.longitude}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[#202A28] font-semibold mb-1">
              Estimated Waste Density: {formData.estimated_density}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={formData.estimated_density}
              onChange={(e) => setFormData({ ...formData, estimated_density: e.target.value })}
              className="w-full accent-[#176B5B]"
            />
          </div>

          <div>
            <label className="block text-[#202A28] font-semibold mb-1">Cleaning Sector (Optional)</label>
            <select
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
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
            <label className="block text-[#202A28] font-semibold mb-1">Narrative Description</label>
            <textarea
              rows="3"
              placeholder="Describe observation circumstances, debris type, and physical clustering..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4EAE7] text-[#202A28] focus:outline-hidden focus:border-[#176B5B]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EAE7]">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E4EAE7] hover:bg-[#F7F9F8] text-[#6B7773] font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white font-semibold shadow-xs transition"
            >
              {submitting ? "Submitting..." : "Save Report"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
