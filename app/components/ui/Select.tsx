import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

/**
 * Select 下拉選單組件
 *
 * @example
 * ```tsx
 * <Select
 *   label="選擇類型"
 *   options={[
 *     { label: "選項 1", value: "1" },
 *     { label: "選項 2", value: "2" },
 *   ]}
 * />
 * ```
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = false,
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

        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-2.5 pr-10 rounded-lg border-2 transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "appearance-none cursor-pointer font-sans",
              error
                ? "border-error-color focus:border-error-color focus:ring-error-color"
                : "border-sunny-border hover:border-sunny-orange focus:border-sunny-orange focus:ring-sunny-orange",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 自定義下拉箭頭 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-sunny-orange">
            <ChevronDown size={20} />
          </div>
        </div>

        {error && <p className="mt-1 text-sm text-error-color">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-sunny-light-gray">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectOption };
export default Select;

