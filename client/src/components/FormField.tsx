// client/src/components/FormField.tsx
import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, required, error, hint, htmlFor, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
}