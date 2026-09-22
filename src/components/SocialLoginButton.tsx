import { ButtonHTMLAttributes, ReactNode } from "react";

interface SocialLoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

const SocialLoginButton = ({ icon, children, ...props }: SocialLoginButtonProps) => (
  <button
    {...props}
    className="focus-ring interactive-control flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-foreground/45 hover:bg-muted"
  >
    {icon}
    {children}
  </button>
);

export default SocialLoginButton;
