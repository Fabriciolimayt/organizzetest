import { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputField = ({ label, ...props }: InputFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
    />
  </div>
);

export default InputField;
