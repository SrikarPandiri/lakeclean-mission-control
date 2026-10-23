function getApiBaseUrl() {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      url = isLocal ? "http://localhost:8000/api" : "https://lakeclean-api.onrender.com/api";
    } else {
      url = "https://lakeclean-api.onrender.com/api";
    }
  }

  url = url.trim().replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
}

async function fetchJson(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  // Retrieve token from localStorage in client environment
  let token = null;
  if (typeof window !== "undefined") {
    try {
      token = localStorage.getItem("lakeclean_auth_token");
    } catch (e) {
      // storage unavailable
    }
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err) {
    // Rethrow error so UI components can display inline error banners without triggering dev modal
    throw err;
  }
}

// Health & System
export async function getHealth() {
  return fetchJson("/health");
}

// Dashboard
export async function getDashboardSummary() {
  return fetchJson("/dashboard/summary");
}

export async function getDashboardActivity() {
  return fetchJson("/dashboard/activity");
}

// Lakes & Zones
export async function getLakes() {
  return fetchJson("/lakes");
}

export async function getLake(lakeId) {
  return fetchJson(`/lakes/${lakeId}`);
}

export async function getLakeZones(lakeId) {
  return fetchJson(`/lakes/${lakeId}/zones`);
}

export async function getAllZones(waterBodyId) {
  const q = waterBodyId ? `?water_body_id=${waterBodyId}` : "";
  return fetchJson(`/zones${q}`);
}

// Waste Reports
export async function getReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append("category", filters.category);
  if (filters.severity) params.append("severity", filters.severity);
  if (filters.report_status) params.append("report_status", filters.report_status);
  if (filters.search) params.append("search", filters.search);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson(`/reports${q}`);
}

export async function getReport(reportId) {
  return fetchJson(`/reports/${reportId}`);
}

export async function createReport(data) {
  return fetchJson("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReport(reportId, data) {
  return fetchJson(`/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function verifyReport(reportId, verification_status) {
  return fetchJson(`/reports/${reportId}/verification`, {
    method: "PATCH",
    body: JSON.stringify({ verification_status }),
  });
}

// Mission Planning & Simulation
export async function planMission(payload) {
  return fetchJson("/missions/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createMission(payload) {
  return fetchJson("/missions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMissions(status) {
  const q = status ? `?status=${status}` : "";
  return fetchJson(`/missions${q}`);
}

export async function getMission(missionId) {
  return fetchJson(`/missions/${missionId}`);
}

export async function startMission(missionId) {
  return fetchJson(`/missions/${missionId}/start`, { method: "POST" });
}

export async function pauseMission(missionId) {
  return fetchJson(`/missions/${missionId}/pause`, { method: "POST" });
}

export async function resumeMission(missionId) {
  return fetchJson(`/missions/${missionId}/resume`, { method: "POST" });
}

export async function abortMission(missionId) {
  return fetchJson(`/missions/${missionId}/abort`, { method: "POST" });
}

export async function tickMission(missionId) {
  return fetchJson(`/missions/${missionId}/tick`, { method: "POST" });
}

export async function getMissionEvents(missionId) {
  return fetchJson(`/missions/${missionId}/events`);
}

export async function getMissionTelemetry(missionId) {
  return fetchJson(`/missions/${missionId}/telemetry`);
}

// Analytics
export async function getAnalyticsOverview() {
  return fetchJson("/analytics/overview");
}

// Authentication & Session
export async function loginApi(email, password, remember_me = false) {
  return fetchJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, remember_me }),
  });
}

export async function registerApi(email, password, display_name) {
  return fetchJson("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name }),
  });
}

export async function guestLoginApi() {
  return fetchJson("/auth/guest", {
    method: "POST",
  });
}

export async function getMeApi() {
  return fetchJson("/auth/me");
}

export async function forgotPasswordApi(email) {
  return fetchJson("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(token, new_password) {
  return fetchJson("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
}

// Admin Management
export async function getAdminUsersApi() {
  return fetchJson("/admin/users");
}

export async function updateUserRoleApi(userId, role) {
  return fetchJson(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function toggleUserStatusApi(userId, active) {
  return fetchJson(`/admin/users/${userId}/status?active=${active}`, {
    method: "PATCH",
  });
}

