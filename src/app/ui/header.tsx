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
            <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
              circular.moda
            </span>
          </NavbarBrand>
          <div className="flex md:order-2">
            <Button size="md" as={Link} href="#">
              Vender
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
            <NavbarLink href="#" active={pathname === '#'}>
              Contact
            </NavbarLink>
          </NavbarCollapse>
        </Navbar>
      </div>
    </header>
  );
}
