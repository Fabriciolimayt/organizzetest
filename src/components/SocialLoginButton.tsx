import { ButtonHTMLAttributes, ReactNode } from "react";

interface SocialLoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

const SocialLoginButton = ({ icon, children, ...props }: SocialLoginButtonProps) => (
  <button
    {...props}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-secondary transition-colors"
  >
    {icon}
    {children}
  </button>
);

export default SocialLoginButton;
