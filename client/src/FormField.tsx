import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <div className="field-error-text">{error}</div>}
      {hint && !error && <div className="field-hint">{hint}</div>}
    </div>
  );
}