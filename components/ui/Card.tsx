import { ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "mobile" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={clsx(
        "card",
        {
          "card-mobile": variant === "mobile",
          "shadow-xl hover:shadow-2xl": variant === "elevated",
          "p-0": padding === "none",
          "p-3 sm:p-4": padding === "sm",
          "p-4 sm:p-6": padding === "md",
          "p-6 sm:p-8": padding === "lg",
        },
        className
      )}
    >
      {children}
    </div>
  );
}
