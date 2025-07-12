const content = {
  logo: {
    src: 'https://flowbite.com/docs/images/logo.svg',
    alt: 'FlowBite Logo',
    text: 'Flowbite',
    href: 'https://flowbite.com',
  },
  sections: [
    {
      title: 'Resources',
      links: [
        { text: 'Flowbite', href: 'https://flowbite.com' },
        { text: 'Tailwind CSS', href: 'https://tailwindcss.com/' },
      ],
    },
    {
      title: 'Follow us',
      links: [
        { text: 'Github', href: 'https://github.com/themesberg/flowbite' },
        { text: 'Discord', href: 'https://discord.gg/4eeurUVvTy' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', href: '#' },
        { text: 'Terms & Conditions', href: '#' },
      ],
    },
  ],
  copyright: {
    text: '© 2022 Flowbite™. All Rights Reserved.',
    href: 'https://flowbite.com',
  },
  socialLinks: [
    { icon: 'facebook', href: '#' },
    { icon: 'twitter', href: '#' },
    { icon: 'github', href: '#' },
    { icon: 'instagram', href: '#' },
  ],
};

export default function footer() {
  return (
    <footer className="p-4 sm:p-6">
      <div className="mx-auto max-w-screen-xl">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <a href={content.logo.href} className="flex items-center">
              <img
                src={content.logo.src}
                className="mr-3 h-8"
                alt={content.logo.alt}
              />
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                {content.logo.text}
              </span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            {content.sections.map((section, index) => (
              <div key={index}>
                <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                  {section.title}
                </h2>
                <ul className="text-gray-600 dark:text-gray-400">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex} className="mb-4">
                      <a href={link.href} className="hover:underline">
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            <a href={content.copyright.href} className="hover:underline">
              {content.copyright.text}
            </a>
          </span>
          <div className="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
            {content.socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {/* Replace with actual SVG paths for social icons */}
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
