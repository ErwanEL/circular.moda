import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/products', label: 'Catalogo de articulos' },
  { href: '#', label: 'Contact' },
];

const socialLinks = [
  { href: 'https://facebook.com', icon: <FaFacebookF />, label: 'Facebook' },
  { href: 'https://twitter.com', icon: <FaTwitter />, label: 'Twitter' },
  { href: 'https://instagram.com', icon: <FaInstagram />, label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="p-4 sm:p-6">
      <div className="mx-auto max-w-screen-xl">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                circular.moda
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Navegación
              </h2>
              <ul className="text-gray-600 dark:text-gray-400">
                {navLinks.map((link) => (
                  <li key={link.href} className="mb-4">
                    <Link href={link.href} className="hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Social
              </h2>
              <ul className="flex space-x-6">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="text-gray-500 hover:text-primary-700 dark:hover:text-white text-xl"
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © {new Date().getFullYear()} circular.moda. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
