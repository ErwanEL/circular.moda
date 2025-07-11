import { Button as FlowbiteButton } from 'flowbite-react';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Add size prop
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType; // Allow custom element types
  href?: string;
} & React.ComponentPropsWithoutRef<'button'>; // Allow all button props

export default function Button({
  variant = 'primary',
  size = 'md', // Default size
  children,
  className = '',
  as,
  href,
  ...props // Spread remaining props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center font-medium focus:outline-none focus:ring-4';
  const variantClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-primary via-primary to-secondary text-white hover:bg-gradient-to-bl focus:ring-primary-300 dark:focus:ring-primary-800'
      : 'bg-light border border-gray-100 text-gray-600 hover:bg-gradient-to-bl focus:ring-primary-300 dark:focus:ring-primary-800';

  return (
    <FlowbiteButton
      pill
      size={size}
      className={`${baseClasses} ${variantClasses} ${className}`}
      as={as}
      href={href}
      {...props}
    >
      {children}
    </FlowbiteButton>
  );
}
