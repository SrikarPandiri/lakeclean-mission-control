export function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours === 1) return "1 hr ago";
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch (e) {
    return dateString;
  }
}

export function formatDistance(km) {
  if (km == null) return "0.0 km";
  return `${Number(km).toFixed(2)} km`;
}

export function formatDuration(minutes) {
  if (minutes == null) return "0 min";
  const mins = Math.round(minutes);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export function formatWeight(kg) {
  if (kg == null) return "0.0 kg";
  return `${Number(kg).toFixed(1)} kg`;
}
