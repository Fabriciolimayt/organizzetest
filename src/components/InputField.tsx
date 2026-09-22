import { useId, type InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputField = ({ label, id, ...props }: InputFieldProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-mono text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        className="focus-ring interactive-control min-h-12 w-full rounded-md border border-input bg-card px-3.5 text-foreground placeholder:text-muted-foreground/60"
      />
    </div>
  );
};

export default InputField;
