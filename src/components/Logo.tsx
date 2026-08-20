type LogoProps = {
  size?: "sm" | "md" | "lg";
  white?: boolean;
};

const SIZES = {
  sm: { text: "text-sm", box: 20, gap: "gap-2" },
  md: { text: "text-base", box: 24, gap: "gap-2.5" },
  lg: { text: "text-xl", box: 28, gap: "gap-3" },
};

const Logo = ({ size = "md", white = false }: LogoProps) => {
  const sizing = SIZES[size];
  const color = white ? "text-white" : "text-foreground";
  const markColor = white ? "text-white" : "text-primary";

  return (
    <span className={`inline-flex items-center ${sizing.gap} ${color}`} aria-label="Organizze">
      <svg
        width={sizing.box}
        height={sizing.box}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={`shrink-0 ${markColor}`}
      >
        <rect x="3" y="2.5" width="18" height="19" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7.5 7.5H16.5M7.5 12H16.5M7.5 16.5H13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M6 2.5V21.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className={`${sizing.text} font-semibold leading-none`}>Organizze</span>
    </span>
  );
};

export default Logo;
