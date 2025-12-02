import React from "react";
import { cn } from "@/lib/utils";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

/**
 * Radio 單選框組件
 *
 * @example
 * ```tsx
 * <Radio
 *   label="選項 1"
 *   name="options"
 *   value="1"
 * />
 * ```
 */
const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-1">
            <input
              ref={ref}
              type="radio"
              className="absolute opacity-0 cursor-pointer w-5 h-5"
              {...props}
            />
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                error
                  ? "border-error-color"
                  : "border-sunny-border hover:border-sunny-orange",
                props.checked && "border-sunny-orange"
              )}
            >
              {props.checked && (
                <div className="w-2.5 h-2.5 rounded-full bg-sunny-orange" />
              )}
            </div>
          </div>

          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-sunny-dark">
                {label}
                {props.required && (
                  <span className="text-error-color ml-1">*</span>
                )}
              </span>
            )}
            {description && (
              <span className="text-xs text-sunny-light-gray">{description}</span>
            )}
          </div>
        </label>

        {error && <p className="mt-2 text-sm text-error-color ml-8">{error}</p>}
      </div>
    );
  }
);

Radio.displayName = "Radio";

/**
 * RadioGroup 單選框組 - 用於多個相關的單選框
 */
interface RadioGroupItem {
  id: string;
  label: string;
  description?: string;
  value: string;
}

interface RadioGroupProps {
  label?: string;
  items: RadioGroupItem[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  name: string;
  fullWidth?: boolean;
}

const RadioGroup = ({
  label,
  items,
  value,
  onChange,
  error,
  name,
  fullWidth = false,
}: RadioGroupProps) => {
  return (
    <div className={cn("flex flex-col", fullWidth && "w-full")}>
      {label && (
        <label className="mb-3 text-sm font-semibold text-sunny-dark">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Radio
            key={item.id}
            name={name}
            value={item.value}
            label={item.label}
            description={item.description}
            checked={value === item.value}
            onChange={(e) => onChange?.(e.currentTarget.value)}
            error={error}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-error-color">{error}</p>}
    </div>
  );
};

export { Radio, RadioGroup };
export type { RadioProps, RadioGroupProps, RadioGroupItem };
export default Radio;

