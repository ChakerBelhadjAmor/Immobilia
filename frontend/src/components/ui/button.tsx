import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "gold";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-800 text-sand-50 hover:bg-navy-700 active:bg-navy-900 shadow-sm",
  gold: "bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 shadow-sm font-semibold",
  secondary:
    "bg-sand-200 text-navy-800 hover:bg-sand-300 active:bg-sand-400/60",
  ghost: "text-navy-700 hover:bg-navy-800/5 active:bg-navy-800/10",
  outline:
    "border border-navy-300 text-navy-800 hover:border-navy-500 hover:bg-navy-50 active:bg-navy-100",
  danger:
    "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
