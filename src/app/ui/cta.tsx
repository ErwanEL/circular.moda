const content = {
  images: {
    light:
      'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/cta/cta-dashboard-mockup.svg',
    dark: 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/cta/cta-dashboard-mockup-dark.svg',
    alt: 'dashboard image',
  },
  heading: 'Esto no es otro marketplace',
  description:
    'Flowbite helps you connect with friends and communities of people who share your interests. Connecting with your friends and family as well as discovering new ones is easy with features like Groups.',
  button: {
    text: 'Get started',
    href: '#',
  },
  list: [
    { text: 'Publicamos por vos → ahorro de tiempo' },
    { text: 'URLs optimizadas → alcance real en Google' },
    { text: 'Sin tarifas durante la fase beta' },
    { text: 'Soporte humano por chat → confianza inmediata' },
  ],
};

export default function Cta() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="gap-8 items-center py-8 px-4 mx-auto max-w-screen-xl xl:gap-16 md:grid md:grid-cols-2 sm:py-16 lg:px-6">
        <img
          className="w-full dark:hidden"
          src={content.images.light}
          alt={content.images.alt}
        />
        <img
          className="w-full hidden dark:block"
          src={content.images.dark}
          alt={content.images.alt}
        />
        <div className="mt-4 md:mt-0">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            {content.heading}
          </h2>
          <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">
            {content.description}
          </p>
          <ul className="mb-6 space-y-4 text-gray-500 dark:text-gray-400">
            {content.list.map((item, index) => (
              <li key={index} className="flex items-center">
                <div className="flex justify-center items-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 mr-2">
                  <svg
                    className="w-5 h-5 text-primary-600 dark:text-primary-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
              </li>
            ))}
          </ul>
          <a
            href={content.button.href}
            className="inline-flex items-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900"
          >
            {content.button.text}
            <svg
              className="ml-2 -mr-1 w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
