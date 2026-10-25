import { useId } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

function Input({ label, error, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-primary"
      >
        {label}
      </label>

      <input
        id={inputId}
        className={`
          w-full rounded-lg border bg-white
          px-3 py-2.5 text-sm
          outline-none transition-colors
          focus:border-primary focus:ring-2 focus:ring-primary/20
          ${error ? "border-danger" : "border-border"}
          ${className}
        `}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />

      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
