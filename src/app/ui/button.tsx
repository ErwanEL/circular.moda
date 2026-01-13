'use client';

import { Button as FlowbiteButton } from 'flowbite-react';
import clsx from 'clsx';
import Link from 'next/link';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  href?: string;
  target?: string;
  bold?: boolean;
  solid?: boolean;
} & React.ComponentPropsWithoutRef<'button'>;

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  as,
  href,
  bold = false,
  solid = false,
  ...props
}: ButtonProps) {
  // Check if as is a function component (like Link) - Next.js 16 doesn't allow this
  const isComponent = typeof as === 'function';
  
  // Determine if href is internal (starts with /) or external
  const isInternalLink = href && href.startsWith('/');
  
  const buttonClasses = clsx(
    'inline-flex items-center justify-center font-medium rounded-full dark:text-gray-900',
    {
      'px-2 py-1 text-xs': size === 'xs',
      'px-3 py-2 text-sm': size === 'sm',
      'text-md px-4 py-2': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
      'px-8 py-4 text-xl': size === 'xl',
      'font-bold': bold,
      'bg-primary-800 text-white': solid,
    },
    !solid && variant === 'primary'
      ? 'from-primary via-primary to-secondary hover:via-secondary focus:ring-primary-300 dark:focus:ring-primary-800 bg-red-500 bg-gradient-to-r text-white transition duration-300 ease-in-out focus:ring-4 focus:outline-none'
      : !solid && variant === 'secondary'
        ? 'bg-light focus:ring-primary-300 dark:focus:ring-primary-800 border border-gray-300 text-gray-600 transition-all duration-300 ease-in-out hover:border-gray-200 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none'
        : '',
    className // Allow additional custom classes
  );

  // If as is a function component (like Link), use Link directly for internal links
  // or render the component for external links
  if (isComponent && as) {
    const Component = as;
    // For Link component, use it directly
    if (Component === Link && href) {
      return (
        <Link href={href} className={buttonClasses} {...(props as any)}>
          {children}
        </Link>
      );
    }
    // For other components, render them
    return (
      <Component href={href} className={buttonClasses} {...(props as any)}>
        {children}
      </Component>
    );
  }

  // If href is provided and it's internal, use Link automatically
  if (href && isInternalLink && !as) {
    return (
      <Link href={href} className={buttonClasses} {...(props as any)}>
        {children}
      </Link>
    );
  }

  // Otherwise, use FlowbiteButton (which handles string 'as' props and external hrefs)
  return (
    <FlowbiteButton
      pill
      size={size}
      className={buttonClasses}
      as={as}
      href={href}
      {...props}
    >
      {children}
    </FlowbiteButton>
  );
}
