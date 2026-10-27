'use client';

import type { ComponentProps } from 'react';
import clsx from 'clsx';

export function Card({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={clsx('ui-panel', className)}>
      <div className="ui-panel__body">{children}</div>
    </div>
  );
}

export function Alert({
  children,
  className,
  color = 'info',
  onDismiss,
  ...props
}: Omit<ComponentProps<'div'>, 'color'> & {
  color?: 'info' | 'success' | 'failure' | 'warning';
  onDismiss?: () => void;
}) {
  return (
    <div
      {...props}
      role="alert"
      className={clsx('ui-alert', `ui-alert--${color}`, className)}
    >
      <div className="ui-alert__content">
        <div>{children}</div>
        {onDismiss && (
          <button
            type="button"
            className="ui-alert__close"
            aria-label="Cerrar aviso"
            onClick={onDismiss}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Spinner({
  size = 'lg',
  className,
  ...props
}: ComponentProps<'span'> & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span {...props} role="status" aria-label="Cargando">
      <svg
        aria-hidden="true"
        className={clsx('ui-spinner', `ui-spinner--${size}`, className)}
        viewBox="0 0 100 101"
        fill="none"
      >
        <circle
          cx="50"
          cy="50.59"
          r="45.46"
          stroke="currentColor"
          strokeWidth="9.08"
        />
        <path
          d="M42.5 5.8A45.46 45.46 0 0 1 92.5 34.7"
          stroke="var(--color-primary-600)"
          strokeWidth="9.08"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
