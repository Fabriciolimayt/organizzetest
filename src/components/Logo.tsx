export type LogoProps = {
  size?: "sm" | "md" | "lg";
  white?: boolean;
  markOnly?: boolean;
};

const SIZES = {
  sm: { text: "text-body-small", box: 16, gap: "gap-2" },
  md: { text: "text-compact-title", box: 24, gap: "gap-2" },
  lg: { text: "text-panel-title", box: 28, gap: "gap-3" },
};

const Logo = ({ size = "md", white = false, markOnly = false }: LogoProps) => {
  const sizing = SIZES[size];
  const color = white ? "text-sidebar-foreground" : "text-foreground";
  const markColor = white ? "text-marker" : "text-primary";

  return (
    <span className={`inline-flex select-none items-center ${sizing.gap} ${color}`} aria-label="Organizze" role="img">
      <span className="relative flex items-center justify-center">
        <svg
          width={sizing.box}
          height={sizing.box}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={`shrink-0 ${markColor}`}
        >
          <path d="M3 4h6v4H3V4Zm12 0h6v4h-6V4ZM5 10h5v4H5v-4Zm9 0h5v4h-5v-4Zm-5 6h6v4H9v-4Z" />
        </svg>
      </span>
      {!markOnly && (
        <span data-size={size} className={`brand-wordmark ${sizing.text} font-semibold ${color}`}>
          Organizze
        </span>
      )}
    </span>
  );
};

export default Logo;
