export type LogoProps = {
  size?: "sm" | "md" | "lg";
  white?: boolean;
  markOnly?: boolean;
};

const Logo = ({ size = "md", white = false, markOnly = false }: LogoProps) => (
  <span
    className={`organizze-brand organizze-brand--${size} ${white ? "text-sidebar-foreground" : "text-foreground"}`}
    aria-label="Organizze"
    role="img"
  >
    <span className="organizze-brand__mark" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
    {!markOnly && <span className="brand-wordmark">Organizze</span>}
  </span>
);

export default Logo;
