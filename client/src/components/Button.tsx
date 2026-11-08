import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  isLoading?: boolean;
  block?: boolean;
}

function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  block = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`];
  if (size === 'sm') classes.push('btn-sm');
  if (block) classes.push('btn-block');
  if (className) classes.push(className);

  return (
    <button
      className={classes.join(' ')}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// Export rõ ràng ở cuối file
export { Button };
export type { ButtonProps };