type LogoProps = {
  size?: "sm" | "md" | "lg";
  white?: boolean; // kept for API compatibility, ignored
};

const SIZES = {
  sm: { text: "text-sm", tracking: "tracking-[0.35em]", px: "px-3 py-2", gap: "gap-0.5", box: 56, slide: "12px" },
  md: { text: "text-lg", tracking: "tracking-[0.4em]", px: "px-4 py-3", gap: "gap-1", box: 78, slide: "18px" },
  lg: { text: "text-3xl", tracking: "tracking-[0.45em]", px: "px-7 py-5", gap: "gap-2", box: 132, slide: "28px" },
};

const Logo = ({ size = "md" }: LogoProps) => {
  const s = SIZES[size];
  const perimeter = s.box * 4;

  const baseLine = `relative font-mono font-semibold ${s.text} ${s.tracking} bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] bg-clip-text text-transparent opacity-60 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-x-0`;

  return (
    <div
      className={`group relative inline-flex flex-col items-center justify-center bg-[#0a1520] rounded-lg ${s.px} ${s.gap} overflow-hidden transition-[filter] duration-500 [filter:drop-shadow(0_0_6px_rgba(34,211,238,0.25))] hover:[filter:drop-shadow(0_0_14px_rgba(34,211,238,0.6))]`}
      aria-label="organizze"
    >
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        width={s.box}
        height={s.box}
        viewBox={`0 0 ${s.box} ${s.box}`}
        fill="none"
      >
        <rect
          x="1"
          y="1"
          width={s.box - 2}
          height={s.box - 2}
          stroke="url(#logoStroke)"
          strokeWidth="1.5"
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter * 0.35}
          className="transition-[stroke-dashoffset] duration-700 ease-out group-hover:[stroke-dashoffset:0]"
        />
        <defs>
          <linearGradient id="logoStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      <span className={baseLine} style={{ transform: `translateX(-${s.slide})` }}>
        ORGA
      </span>
      <span className={baseLine} style={{ transform: `translateX(${s.slide})` }}>
        NIZZE
      </span>
    </div>
  );
};

export default Logo;
