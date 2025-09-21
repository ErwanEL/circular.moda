import { Metadata } from 'next';
import { getAllBlogArticles } from '../lib/blog';
import BlogCard from '../ui/blog-card';

export const metadata: Metadata = {
  title: 'Blog | circular.moda - Moda circular y sostenible',
  description:
    'Descubre consejos, tendencias y guías sobre moda circular, sostenibilidad y estilo de vida consciente en Buenos Aires.',
  openGraph: {
    title: 'Blog | circular.moda',
    description: 'Consejos y tendencias sobre moda circular y sostenible',
    type: 'website',
  },
};

export default async function BlogPage() {
  const allArticles = await getAllBlogArticles();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      {/* <section className="from-primary-600 to-primary-800 bg-gradient-to-br py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">
              Blog circular.moda
            </h1>
            <p className="text-primary-100 mx-auto max-w-3xl text-xl">
              Descubre consejos, tendencias y guías sobre moda circular,
              sostenibilidad y estilo de vida consciente en Buenos Aires.
            </p>
          </div>
        </div>
      </section> */}

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {allArticles.length === 0 ? (
            <div className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No se encontraron artículos
              </h3>
              <p className="mt-1 text-gray-500">
                No hay artículos disponibles en este momento.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {allArticles.length > 0 && (
                <div className="mb-12">
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">
                    Artículo destacado
                  </h2>
                  <BlogCard article={allArticles[0]} featured />
                </div>
              )}

              {/* Articles Grid */}
              {/* <div className="mb-8">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Todos los artículos
                </h2>

                <div className="grid gap-8 md:grid-cols-2">
                  {allArticles.slice(1).map((article) => (
                    <BlogCard key={article.id} article={article} />
                  ))}
                </div>
              </div> */}

              {/* Pagination placeholder */}
              {allArticles.length > 6 && (
                <div className="flex justify-center">
                  <nav className="flex space-x-2">
                    <button className="bg-primary-600 rounded-lg px-4 py-2 text-white">
                      1
                    </button>
                    <button className="rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md hover:bg-gray-50">
                      2
                    </button>
                    <button className="rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md hover:bg-gray-50">
                      3
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
