import { ButtonHTMLAttributes, ReactNode } from "react";

interface SocialLoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

const SocialLoginButton = ({ icon, children, ...props }: SocialLoginButtonProps) => (
  <button
    {...props}
    className="btn-glass w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full text-foreground font-medium"
  >
    {icon}
    {children}
  </button>
);

export default SocialLoginButton;
