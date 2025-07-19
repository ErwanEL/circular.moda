import Link from 'next/link';
// import { FaFacebookF, FaInstagram } from 'react-icons/fa';
// import { FaXTwitter, FaWhatsapp } from 'react-icons/fa6';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/products', label: 'Catalogo de articulos' },
  {
    href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
    label: 'Contact',
  },
];

// const socialLinks = [
//   { href: 'https://facebook.com', icon: <FaFacebookF />, label: 'Facebook' },
//   { href: 'https://x.com', icon: <FaXTwitter />, label: 'X (Twitter)' },
//   { href: 'https://instagram.com', icon: <FaInstagram />, label: 'Instagram' },
//   {
//     href: 'https://wa.me/?text=¡Mirá%20esto%20en%20circular.moda!',
//     icon: <FaWhatsapp />,
//     label: 'WhatsApp',
//   },
// ];

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
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 sm:gap-6">
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
            {/* <div>
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
                      className="hover:text-primary-700 text-xl text-gray-500 dark:hover:text-white"
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div> */}
          </div>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8 dark:border-gray-700" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © {new Date().getFullYear()} circular.moda
          </span>
        </div>
      </div>
    </footer>
  );
}
