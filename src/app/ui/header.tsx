'use client';

import { useEffect, useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  useNavbarContext,
} from 'flowbite-react';
import Link from 'next/link';
import { getButtonClasses } from './button-classes';
import { usePathname } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { signupUrl } from '../lib/helpers';

type MobileNavigationProps = {
  isLoggedIn: boolean;
  pathname: string;
};

function MobileNavigation({ isLoggedIn, pathname }: MobileNavigationProps) {
  const { setIsOpen } = useNavbarContext();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <NavbarCollapse>
      {!isLoggedIn && (
        <li className="mb-4 w-full list-none border-b border-gray-200 pb-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href={signupUrl('/me/product/add')}
              className={getButtonClasses({
                solid: true,
                bold: true,
                variant: 'primary',
                size: 'md',
                className:
                  'w-full justify-center text-white dark:text-gray-900',
              })}
              onClick={closeMobileMenu}
            >
              Vender ahora
            </Link>
            <Link
              href="/login"
              className={getButtonClasses({
                variant: 'secondary',
                size: 'md',
                className: 'min-h-[44px] w-full justify-center gap-2',
              })}
              aria-label="Regístrate o inicia sesión"
              onClick={closeMobileMenu}
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 13a6 6 0 1112 0H6z"
                />
              </svg>
              <span>Regístrate | Inicia sesión</span>
            </Link>
          </div>
        </li>
      )}
      <NavbarLink href="/" active={pathname === '/'}>
        Home
      </NavbarLink>
      <NavbarLink href="/como-funciona" active={pathname === '/como-funciona'}>
        Cómo funciona
      </NavbarLink>
      <NavbarLink href="/products" active={pathname.startsWith('/products')}>
        Catalogo de articulos
      </NavbarLink>
      <NavbarLink href="/blog" active={pathname.startsWith('/blog')}>
        Blog
      </NavbarLink>
      <NavbarLink
        href="https://wa.me/5491125115030?text=Hola%20Circular.moda%20tengo%20una%20pregunta:"
        active={
          pathname ===
          'https://wa.me/5491125115030?text=Hola%20Circular.moda%20tengo%20una%20pregunta:'
        }
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        Contact
      </NavbarLink>
      {isLoggedIn && (
        <li className="mt-4 w-full list-none border-t border-gray-200 pt-4 md:hidden">
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Whatsapp"
              className={getButtonClasses({
                variant: 'secondary',
                size: 'md',
                className: 'w-full justify-center sm:w-auto',
              })}
              onClick={closeMobileMenu}
            >
              <svg
                className="h-4 w-4 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13.601 2.326A7.854 7.854 0 0 0 8.012 0C3.624 0 .035 3.584.032 7.972a7.93 7.93 0 0 0 1.077 4.006L0 16l4.132-1.084a7.95 7.95 0 0 0 3.88 1.005h.003c4.387 0 7.976-3.585 7.98-7.973a7.898 7.898 0 0 0-2.394-5.622m-5.59 12.28h-.003a6.63 6.63 0 0 1-3.372-.92l-.242-.144-2.45.644.654-2.39-.158-.245a6.62 6.62 0 0 1-1.015-3.543c.002-3.665 3.01-6.674 6.689-6.674a6.64 6.64 0 0 1 4.724 1.947 6.6 6.6 0 0 1 1.958 4.71c-.004 3.666-3.013 6.675-6.685 6.675m3.651-4.988c-.2-.1-1.182-.583-1.366-.648-.184-.067-.317-.1-.451.1-.133.2-.518.648-.634.782-.117.133-.234.15-.434.05-.2-.1-.844-.31-1.608-.99-.595-.532-.996-1.188-1.112-1.388-.117-.2-.013-.307.087-.407.09-.09.2-.234.3-.35.1-.117.133-.2.2-.334.067-.133.033-.25-.017-.35-.05-.1-.451-1.084-.617-1.484-.162-.39-.326-.337-.451-.343a1.9 1.9 0 0 0-.384-.007c-.134 0-.35.05-.534.25-.184.2-.701.684-.701 1.668 0 .984.718 1.934.818 2.068.1.133 1.41 2.151 3.417 3.016.478.206.85.329 1.14.421.479.152.915.13 1.26.079.385-.058 1.183-.484 1.35-.951.167-.468.167-.868.117-.951-.05-.084-.184-.134-.384-.234" />
              </svg>
            </a>
            <Link
              href="/me/product/add"
              className={getButtonClasses({
                solid: true,
                bold: true,
                variant: 'primary',
                size: 'md',
                className: 'w-full justify-center sm:w-auto',
              })}
              onClick={closeMobileMenu}
            >
              Publicar prenda
            </Link>
            <Link
              href="/me"
              className={getButtonClasses({
                variant: 'secondary',
                size: 'md',
                className: 'w-full justify-center sm:w-auto',
              })}
              onClick={closeMobileMenu}
            >
              <svg
                className="mr-1.5 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 13a6 6 0 1112 0H6z"
                />
              </svg>
              Mi perfil
            </Link>
          </div>
        </li>
      )}
    </NavbarCollapse>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (isMounted) {
        setIsLoggedIn(!!user);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsLoggedIn(!!session?.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-50 px-4 pt-0 md:px-6"
      style={{ background: 'var(--background)' }}
    >
      <div className="mx-auto max-w-screen-xl">
        <Navbar fluid rounded className="!bg-[var(--background)]">
          <NavbarBrand href="/">
            <span className="lg:text-1xl self-center text-xl font-semibold whitespace-nowrap sm:text-2xl dark:text-white">
              circul<span className="text-primary-800">ar</span>.moda
            </span>
          </NavbarBrand>
          <div className="flex items-center md:order-2">
            <div className="hidden md:flex md:items-center">
              {isLoggedIn ? (
                <>
                  <a
                    href="https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={getButtonClasses({
                      variant: 'secondary',
                      size: 'md',
                      className: 'mr-2',
                    })}
                    aria-label="Whatsapp"
                  >
                    <svg
                      className="h-4 w-4 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 8.012 0C3.624 0 .035 3.584.032 7.972a7.93 7.93 0 0 0 1.077 4.006L0 16l4.132-1.084a7.95 7.95 0 0 0 3.88 1.005h.003c4.387 0 7.976-3.585 7.98-7.973a7.898 7.898 0 0 0-2.394-5.622m-5.59 12.28h-.003a6.63 6.63 0 0 1-3.372-.92l-.242-.144-2.45.644.654-2.39-.158-.245a6.62 6.62 0 0 1-1.015-3.543c.002-3.665 3.01-6.674 6.689-6.674a6.64 6.64 0 0 1 4.724 1.947 6.6 6.6 0 0 1 1.958 4.71c-.004 3.666-3.013 6.675-6.685 6.675m3.651-4.988c-.2-.1-1.182-.583-1.366-.648-.184-.067-.317-.1-.451.1-.133.2-.518.648-.634.782-.117.133-.234.15-.434.05-.2-.1-.844-.31-1.608-.99-.595-.532-.996-1.188-1.112-1.388-.117-.2-.013-.307.087-.407.09-.09.2-.234.3-.35.1-.117.133-.2.2-.334.067-.133.033-.25-.017-.35-.05-.1-.451-1.084-.617-1.484-.162-.39-.326-.337-.451-.343a1.9 1.9 0 0 0-.384-.007c-.134 0-.35.05-.534.25-.184.2-.701.684-.701 1.668 0 .984.718 1.934.818 2.068.1.133 1.41 2.151 3.417 3.016.478.206.85.329 1.14.421.479.152.915.13 1.26.079.385-.058 1.183-.484 1.35-.951.167-.468.167-.868.117-.951-.05-.084-.184-.134-.384-.234" />
                    </svg>
                  </a>
                  <Link
                    href="/me/product/add"
                    className={getButtonClasses({
                      solid: true,
                      bold: true,
                      variant: 'primary',
                      size: 'md',
                    })}
                  >
                    Publicar prenda
                  </Link>
                  <Link
                    href="/me"
                    className={getButtonClasses({
                      variant: 'secondary',
                      size: 'md',
                      className: 'ml-2',
                    })}
                  >
                    <svg
                      className="mr-1.5 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 13a6 6 0 1112 0H6z"
                      />
                    </svg>
                    Mi perfil
                  </Link>
                </>
              ) : (
                <Link
                  href={signupUrl('/me/product/add')}
                  className={getButtonClasses({
                    solid: true,
                    bold: true,
                    variant: 'primary',
                    size: 'md',
                    className: 'text-white dark:text-gray-900',
                  })}
                >
                  Vender ahora
                </Link>
              )}
              {!isLoggedIn && (
                <Link
                  href="/login"
                  className={getButtonClasses({
                    variant: 'secondary',
                    size: 'md',
                    className: 'ml-2 min-h-[40px] gap-2 px-4',
                  })}
                  aria-label="Regístrate o inicia sesión"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 13a6 6 0 1112 0H6z"
                    />
                  </svg>
                  <span>Regístrate | Inicia sesión</span>
                </Link>
              )}
            </div>
            <NavbarToggle className="md:hidden" />
          </div>
          <MobileNavigation isLoggedIn={isLoggedIn} pathname={pathname} />
        </Navbar>
      </div>
    </header>
  );
}
