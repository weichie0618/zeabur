import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

/**
 * Textarea 組件
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="訊息"
 *   placeholder="請輸入您的訊息"
 *   rows={5}
 * />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      rows = 4,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex flex-col", fullWidth && "w-full")}>
        {label && (
          <label className="mb-2 text-sm font-semibold text-sunny-dark">
            {label}
            {props.required && <span className="text-error-color ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-300 resize-vertical",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "placeholder-sunny-light-gray font-sans",
            error
              ? "border-error-color focus:border-error-color focus:ring-error-color"
              : "border-sunny-border hover:border-sunny-orange focus:border-sunny-orange focus:ring-sunny-orange",
            className
          )}
          {...props}
        />

        {error && <p className="mt-1 text-sm text-error-color">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-sunny-light-gray">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export default Textarea;

