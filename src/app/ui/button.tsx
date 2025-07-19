import { Button as FlowbiteButton } from 'flowbite-react';
import clsx from 'clsx';

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
  return (
    <FlowbiteButton
      pill
      size={size}
      className={clsx(
        'inline-flex items-center font-medium',
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
      )}
      as={as}
      href={href}
      {...props}
    >
      {children}
    </FlowbiteButton>
  );
}
