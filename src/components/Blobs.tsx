interface BlobsProps {
  variant?: "default" | "subtle" | "hero";
  className?: string;
}

/**
 * Animated coloured blobs used as ambient background layer.
 * Sits behind content (pointer-events: none). Uses design tokens.
 */
const Blobs = ({ variant = "default", className = "" }: BlobsProps) => {
  const intensity = variant === "subtle" ? "opacity-40" : variant === "hero" ? "opacity-80" : "opacity-60";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${intensity} ${className}`}
    >
      <div
        className="absolute -top-24 -left-24 w-[38rem] h-[38rem] rounded-full animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.55), transparent 60%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(var(--gold) / 0.35), transparent 60%)",
          filter: "blur(100px)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] rounded-full animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(var(--teal) / 0.4), transparent 60%)",
          filter: "blur(110px)",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
};

export default Blobs;
