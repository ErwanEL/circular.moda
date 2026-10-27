'use client';

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from 'react';
import clsx from 'clsx';

const NavigationContext = createContext<{
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  menuId: string;
} | null>(null);

export function useNavbarContext() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('Navigation must be inside Navbar');
  return context;
}

export function Navbar({
  children,
  className,
  ...props
}: ComponentProps<'nav'>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLElement>(null);
  return (
    <NavigationContext.Provider value={{ isOpen, setIsOpen, menuId }}>
      <nav
        {...props}
        ref={ref}
        aria-label="Navegación principal"
        className={clsx('site-nav', className)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isOpen) {
            setIsOpen(false);
            ref.current
              ?.querySelector<HTMLButtonElement>('.site-nav__toggle')
              ?.focus();
          }
        }}
      >
        <div className="site-nav__inner">{children}</div>
      </nav>
    </NavigationContext.Provider>
  );
}

export function NavbarBrand({ className, ...props }: ComponentProps<'a'>) {
  return <a {...props} className={clsx('site-nav__brand', className)} />;
}

export function NavbarCollapse({ children }: ComponentProps<'div'>) {
  const { isOpen, menuId } = useNavbarContext();
  return (
    <div id={menuId} className="site-nav__collapse" data-open={isOpen}>
      <ul className="site-nav__list">{children}</ul>
    </div>
  );
}

export function NavbarLink({
  active,
  className,
  onClick,
  ...props
}: ComponentProps<'a'> & { active?: boolean }) {
  const { setIsOpen } = useNavbarContext();
  return (
    <li>
      <a
        {...props}
        aria-current={active ? 'page' : undefined}
        className={clsx('site-nav__link', className)}
        onClick={(event) => {
          setIsOpen(false);
          onClick?.(event);
        }}
      />
    </li>
  );
}

export function NavbarToggle({ className }: { className?: string }) {
  const { isOpen, setIsOpen, menuId } = useNavbarContext();
  return (
    <button
      type="button"
      className={clsx('site-nav__toggle', className)}
      aria-controls={menuId}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      onClick={() => setIsOpen((open) => !open)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        width="24"
        height="24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
