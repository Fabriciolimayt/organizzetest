import { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputField = ({ label, ...props }: InputFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      {...props}
      className="glass-input w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
    />
  </div>
);

export default InputField;
