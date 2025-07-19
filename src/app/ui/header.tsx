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
            <Button
              solid
              bold
              variant="primary"
              size="md"
              as={Link}
              href="https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda"
              target="_blank"
              rel="noopener noreferrer"
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
          </NavbarCollapse>
        </Navbar>
      </div>
    </header>
  );
}
