import Link from 'next/link';
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from 'flowbite-react';
import Button from './button'; // Import your custom Button component

export default function Header() {
  return (
    <Navbar fluid rounded>
      <NavbarBrand href="/">
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          circular.moda
        </span>
      </NavbarBrand>
      <div className="flex md:order-2">
        <Button size="sm" as={Link} href="#">
          Vender
        </Button>
        <NavbarToggle />
      </div>
      <NavbarCollapse>
        <NavbarLink href="#" active>
          Home
        </NavbarLink>
        <NavbarLink href="/como-funciona">Cómo funciona</NavbarLink>
        <NavbarLink href="products">Catalogo de articulos</NavbarLink>
        <NavbarLink href="#">Contact</NavbarLink>
      </NavbarCollapse>
    </Navbar>
  );
}
