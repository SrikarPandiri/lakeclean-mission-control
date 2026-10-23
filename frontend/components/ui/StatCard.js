export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
  className = ""
}) {
  const iconColors = {
    default: "text-[#176B5B] bg-[#EDF7F4]",
    primary: "text-[#176B5B] bg-[#EAF5F2]",
    teal: "text-[#1D7465] bg-[#EBF5F3]",
    success: "text-[#247A52] bg-[#EDF7F2]",
    warning: "text-[#A56613] bg-[#FDF6EC]",
  };

  const iconStyle = iconColors[variant] || iconColors.default;

  return (
    <div className={`p-4 sm:p-5 rounded-xl border border-[#E4EAE7] bg-white shadow-xs transition hover:border-[#CCD6D2] ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6B7773] tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconStyle}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[#202A28] tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-[#247A52]">{trend}</span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[#6B7773] leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
