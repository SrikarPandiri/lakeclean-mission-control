export default function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-[#F2F5F4] text-[#586461] border-[#E1E7E5]",
    primary: "bg-[#EAF5F2] text-[#176B5B] border-[#BDE0D8]",
    teal: "bg-[#EBF5F3] text-[#1D7465] border-[#CCE5E0]",
    success: "bg-[#EDF7F2] text-[#247A52] border-[#C6E7D6]",
    warning: "bg-[#FDF6EC] text-[#9A5809] border-[#F5D9AF]",
    danger: "bg-[#FDF0F0] text-[#B83C3C] border-[#F7C8C8]",
    muted: "bg-[#F0F3F2] text-[#6B7773] border-[#E4EAE7]",
  };

  const selected = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${selected} ${className}`}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const sev = (severity || "").toUpperCase();
  if (sev === "CRITICAL") return <Badge variant="danger">Critical</Badge>;
  if (sev === "HIGH") return <Badge variant="warning">High</Badge>;
  if (sev === "MEDIUM") return <Badge variant="teal">Medium</Badge>;
  return <Badge variant="default">Low</Badge>;
}

export function StatusBadge({ status }) {
  const st = (status || "").toUpperCase();
  if (st === "RUNNING") return <Badge variant="primary">● Running</Badge>;
  if (st === "PAUSED") return <Badge variant="warning">❚❚ Paused</Badge>;
  if (st === "COMPLETED") return <Badge variant="success">✓ Completed</Badge>;
  if (st === "ABORTED") return <Badge variant="danger">✕ Aborted</Badge>;
  if (st === "FEASIBLE") return <Badge variant="success">✓ Feasible</Badge>;
  if (st === "INFEASIBLE") return <Badge variant="danger">✕ Infeasible</Badge>;
  if (st === "OPEN") return <Badge variant="warning">Open</Badge>;
  if (st === "IN_PROGRESS") return <Badge variant="primary">In Progress</Badge>;
  if (st === "RESOLVED") return <Badge variant="success">Resolved</Badge>;
  if (st === "VERIFIED") return <Badge variant="teal">Verified</Badge>;
  if (st === "REJECTED") return <Badge variant="danger">Rejected</Badge>;
  if (st === "PLANNED") return <Badge variant="muted">Planned</Badge>;
  return <Badge variant="default">{status}</Badge>;
}
