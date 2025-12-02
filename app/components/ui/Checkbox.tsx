import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

/**
 * Checkbox 複選框組件
 *
 * @example
 * ```tsx
 * <Checkbox
 *   label="同意條款"
 *   description="我同意使用條款和隱私政策"
 * />
 * ```
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-1">
            <input
              ref={ref}
              type="checkbox"
              className="absolute opacity-0 cursor-pointer w-5 h-5"
              {...props}
            />
            <div
              className={cn(
                "w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center",
                error
                  ? "border-error-color bg-error-color/10"
                  : "border-sunny-border hover:border-sunny-orange",
                props.checked && "bg-sunny-orange border-sunny-orange"
              )}
            >
              {props.checked && (
                <Check size={16} className="text-white" strokeWidth={3} />
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

Checkbox.displayName = "Checkbox";

/**
 * CheckboxGroup 複選框組 - 用於多個相關的複選框
 */
interface CheckboxGroupItem {
  id: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  label?: string;
  items: CheckboxGroupItem[];
  value?: string[];
  onChange?: (values: string[]) => void;
  error?: string;
  fullWidth?: boolean;
}

const CheckboxGroup = ({
  label,
  items,
  value = [],
  onChange,
  error,
  fullWidth = false,
}: CheckboxGroupProps) => {
  const handleChange = (id: string, checked: boolean) => {
    const newValue = checked
      ? [...value, id]
      : value.filter((v) => v !== id);
    onChange?.(newValue);
  };

  return (
    <div className={cn("flex flex-col", fullWidth && "w-full")}>
      {label && (
        <label className="mb-3 text-sm font-semibold text-sunny-dark">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Checkbox
            key={item.id}
            label={item.label}
            description={item.description}
            checked={value.includes(item.id)}
            onChange={(e) => handleChange(item.id, e.currentTarget.checked)}
            error={error}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-error-color">{error}</p>}
    </div>
  );
};

export { Checkbox, CheckboxGroup };
export type { CheckboxProps, CheckboxGroupProps, CheckboxGroupItem };
export default Checkbox;

