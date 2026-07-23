import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg border border-sand-300 bg-white px-3.5 text-sm text-navy-900 placeholder:text-navy-300 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 disabled:cursor-not-allowed disabled:bg-sand-100 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:focus:ring-danger-500/20";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id: string;
  children: ReactNode;
}

function FieldWrapper({ label, hint, error, required, id, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-800">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-navy-400">{hint}</p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, leading, trailing, id: idProp, required, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} id={id}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-navy-400">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn(fieldBase, "h-10", leading && "pl-10", trailing && "pr-10", className)}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-3 flex items-center text-navy-400">
            {trailing}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
});

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, hint, error, id: idProp, required, ...props }, ref) {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <FieldWrapper label={label} hint={hint} error={error} required={required} id={id}>
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn(fieldBase, "min-h-24 py-2.5 leading-relaxed", className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, label, hint, error, id: idProp, required, children, ...props }, ref) {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <FieldWrapper label={label} hint={hint} error={error} required={required} id={id}>
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn(fieldBase, "h-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236c82a8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat pr-10", className)}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    );
  },
);
