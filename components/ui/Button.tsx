import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "btn",
        {
          "btn-primary": variant === "primary",
          "btn-secondary": variant === "secondary",
          "btn-danger": variant === "danger",
          "btn-success": variant === "success",
          "btn-warning": variant === "warning",
          // Responsive sizing
          "px-2 py-1.5 text-xs": size === "sm",
          "px-3 py-2 text-sm": size === "md",
          "px-4 py-2.5 text-base": size === "lg",
          "px-6 py-3 text-lg": size === "xl",
          // Full width option
          "w-full": fullWidth,
          // Loading and disabled states
          "opacity-50 cursor-not-allowed": disabled || loading,
          // Mobile optimizations
          "touch-target": true,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span className="text-sm sm:text-base">Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
