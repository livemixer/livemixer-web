import * as React from 'react';
import { cn } from '../../utils/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-[var(--lm-border)] bg-[var(--lm-surface-2)] px-3 py-2 text-sm text-[var(--lm-fg)] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--lm-muted-2)] focus-visible:outline-none focus-visible:border-[var(--lm-accent)] focus-visible:ring-2 focus-visible:ring-[var(--lm-accent-weak)] hover:border-[var(--lm-border-strong)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
