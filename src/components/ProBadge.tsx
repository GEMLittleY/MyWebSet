export default function ProBadge({
  size = "sm",
  className = "",
}: {
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizeCls =
    size === "xs"
      ? "text-[10px] px-1.5 py-px"
      : size === "md"
        ? "text-sm px-2.5 py-1"
        : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wide bg-gradient-to-br from-[#f0b232] to-[#d4982a] text-[#0f1419] ${sizeCls} ${className}`}
      aria-label="Pro feature"
    >
      <span aria-hidden>✦</span>
      Pro
    </span>
  );
}
