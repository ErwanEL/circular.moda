import Button from './button'; // Import your custom Button component

type CtaProps = {
  variant?: 'default' | 'centered';
  content?: {
    heading?: string;
    description?: string;
    button?: {
      text: string;
      href: string;
    };
  };
};

export default function Cta({ variant = 'default', content }: CtaProps) {
  const isCentered = variant === 'centered';

  return (
    <section>
      <div
        className={`mx-auto grid max-w-screen-xl items-center justify-center gap-8 px-4 py-8 lg:py-16 ${
          isCentered
            ? 'text-center'
            : 'sm:py-16 md:grid md:grid-cols-2 lg:px-6 xl:gap-16'
        }`}
      >
        <div className={`${isCentered ? 'max-w-2xl' : 'mt-4 md:mt-0'}`}>
          {content?.heading && (
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {content.heading}
            </h2>
          )}
          {content?.description && (
            <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">
              {content.description}
            </p>
          )}
          {content?.button && (
            <Button variant="primary" href={content.button.href} size="xl">
              {content.button.text}
              <svg
                className="-mr-1 ml-2 h-5 w-5"
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
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
