'use client';

import Link from 'next/link';
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from 'flowbite-react';
import Button from './button'; // Import your custom Button component
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
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
          <div className="flex md:order-2">
            <div className="border-default rounded-base bg-neutral-secondary-soft md:bg-neutral-primary mt-4 hidden list-none flex-col items-center gap-4 border p-4 text-sm font-medium md:mt-0 md:flex md:flex-row md:space-x-8 md:border-0 md:px-4 md:py-0 rtl:space-x-reverse">
              <div className="m-0 p-0">
                <NavbarLink href="/signup" active={pathname === '/signup'}>
                  Inscribirse
                </NavbarLink>
              </div>
              <div className="m-0 p-0">
                <NavbarLink href="/login" active={pathname === '/login'}>
                  Iniciar sesión
                </NavbarLink>
              </div>
            </div>
            <Button
              solid
              bold
              variant="primary"
              size="md"
              href="https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white dark:text-gray-900"
            >
              Vender ahora
            </Button>
            <NavbarToggle />
          </div>
          <NavbarCollapse>
            <NavbarLink href="/" active={pathname === '/'}>
              Home
            </NavbarLink>
            <NavbarLink
              href="/como-funciona"
              active={pathname === '/como-funciona'}
            >
              Cómo funciona
            </NavbarLink>
            <NavbarLink
              href="/products"
              active={pathname.startsWith('/products')}
            >
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
            <div className="mt-6 flex justify-center border-t-[1px] border-solid border-gray-200 p-0 pt-4 md:hidden">
              <NavbarLink href="/signup" active={pathname === '/signup'}>
                Inscribirse
              </NavbarLink>
              <NavbarLink href="/login" active={pathname === '/login'}>
                Iniciar sesión
              </NavbarLink>
            </div>
          </NavbarCollapse>
        </Navbar>
      </div>
    </header>
  );
}
