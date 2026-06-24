type LogoProps = {
  size?: "sm" | "md" | "lg";
  white?: boolean;
};

const SIZES = {
  sm: { text: "text-sm", box: 18, gap: "gap-2", trackingIdle: "tracking-[0.35em]", trackingHover: "group-hover:tracking-[0.25em]" },
  md: { text: "text-base", box: 22, gap: "gap-2.5", trackingIdle: "tracking-[0.4em]", trackingHover: "group-hover:tracking-[0.28em]" },
  lg: { text: "text-xl", box: 28, gap: "gap-3", trackingIdle: "tracking-[0.45em]", trackingHover: "group-hover:tracking-[0.3em]" },
};

const Logo = ({ size = "md", white = false }: LogoProps) => {
  const s = SIZES[size];
  const perimeter = s.box * 4;
  const textColor = white ? "text-white" : "text-foreground";
  const strokeColor = white ? "text-white" : "text-primary";
  const weight = white ? "font-bold" : "font-semibold";


  return (
    <div
      className={`group inline-flex items-center ${s.gap} bg-transparent`}
      aria-label="organizze"
    >
      <svg
        width={s.box}
        height={s.box}
        viewBox={`0 0 ${s.box} ${s.box}`}
        fill="none"
        className={`${strokeColor} shrink-0`}
      >
        <rect
          x="1"
          y="1"
          width={s.box - 2}
          height={s.box - 2}
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter * 0.3}
          rx="2"
          className="transition-[stroke-dashoffset] duration-500 ease-out group-hover:[stroke-dashoffset:0]"
        />
      </svg>
      <span
        className={`font-semibold ${s.text} ${s.trackingIdle} ${s.trackingHover} ${textColor} transition-[letter-spacing] duration-500 ease-out`}
      >
        ORGANIZZE
      </span>
    </div>
  );
};

export default Logo;
