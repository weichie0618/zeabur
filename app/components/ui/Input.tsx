import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Input 組件
 *
 * @example
 * ```tsx
 * <Input
 *   label="姓名"
 *   placeholder="請輸入姓名"
 *   error={errors.name}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      fullWidth = false,
      className,
      type = "text",
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

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sunny-gray">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "placeholder-sunny-light-gray",
              icon && "pl-10",
              error
                ? "border-error-color focus:border-error-color focus:ring-error-color"
                : "border-sunny-border hover:border-sunny-orange focus:border-sunny-orange focus:ring-sunny-orange",
              className
            )}
            {...props}
          />
        </div>

        {error && <p className="mt-1 text-sm text-error-color">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-sunny-light-gray">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export default Input;

