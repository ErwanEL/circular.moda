'use client';

import { useEffect, useState } from 'react';
// TODO: Uncomment when Supabase client is available on this branch
// import { createClient } from '../lib/supabase/client';
import { Card, Alert, Spinner } from 'flowbite-react';
import Button from '../ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Product {
  id: number;
  name: string;
  public_id: string;
  images: string[];
  price: number | null;
  category: string | null;
  size: string | null;
  created_at: string;
}

export default function MePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();

  useEffect(() => {
    // TODO: Uncomment when Supabase client is available on this branch
    // Handle auth callback code exchange
    // const handleAuthCallback = async () => {
    //   const supabase = createClient();
    //   const { data, error } = await supabase.auth.getSession();
    //   if (error) {
    //     console.error('Auth error:', error);
    //   }
    // };
    // handleAuthCallback();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // TODO: Uncomment when Supabase client is available on this branch
      // const supabase = createClient();
      // const {
      //   data: { user },
      // } = await supabase.auth.getUser();
      //
      // if (!user?.email) {
      //   router.push('/login');
      //   return;
      // }
      //
      // setEmail(user.email);

      // Mock data for layout preview - remove when Supabase is available
      setEmail('user@example.com');

      // Try to fetch from API (will work if API doesn't require Supabase)
      try {
        const response = await fetch('/api/me');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Error loading profile');
        }

        const data = await response.json();
        setUserProfile(data.user);
        setProducts(data.products || []);
        setName(data.user?.name || '');
        setPhone(data.user?.phone || '');
      } catch (apiError) {
        // Fallback to mock data if API is not available
        console.warn('API not available, using mock data:', apiError);
        setUserProfile({
          id: 1,
          name: 'Usuario de Prueba',
          phone: '+5491125115030',
          email: 'user@example.com',
        });
        setProducts([
          {
            id: 1,
            name: 'Prenda de Ejemplo',
            public_id: 'abc123',
            images: [],
            price: 5000,
            category: 'Ropa',
            size: 'M',
            created_at: new Date().toISOString(),
          },
        ]);
        setName('Usuario de Prueba');
        setPhone('+5491125115030');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error');
      }

      setUserProfile(data.user);
      setMessage({ type: 'success', text: 'Perfil actualizado' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getProductSlug = (product: Product) => {
    const nameSlug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${nameSlug}-${product.public_id}`;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consultar precio';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          ¡Bienvenido{userProfile?.name ? `, ${userProfile.name}` : ''}!
        </h1>

        {message && (
          <Alert
            color={message.type === 'success' ? 'success' : 'failure'}
            className="mb-6"
            onDismiss={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {userProfile && !userProfile.phone && (
          <Alert color="warning" className="mb-6">
            <div>
              <h3 className="font-semibold">¡WhatsApp requerido!</h3>
              <p className="mt-1 text-sm">
                Agrega tu número de WhatsApp para que podamos contactarte.
              </p>
            </div>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <h2 className="mb-4 text-xl font-semibold">Mi Perfil</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email || ''}
                    disabled
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2"
                    placeholder="+5491125115030"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Necesitamos tu WhatsApp para contactarte
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  solid
                  className="w-full"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </form>
            </Card>

            <Card>
              <h3 className="mb-4 text-lg font-semibold">
                Publicar nueva prenda
              </h3>
              <Button
                href="/me/product/add"
                variant="primary"
                solid
                className="w-full"
              >
                Agregar prenda
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Mis Prendas</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {products.length} prenda{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {products.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-gray-500">
                    Aún no has publicado ninguna prenda
                  </p>
                  <Button href="/me/product/add" variant="primary" solid>
                    Publicar mi primera prenda
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((product) => {
                    const slug = getProductSlug(product);
                    const firstImage =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : null;

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${slug}`}
                        className="group block"
                      >
                        <Card className="h-full transition-shadow hover:shadow-lg">
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-200">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-400">
                                Sin imagen
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
                              {product.name}
                            </h3>
                            {product.category && (
                              <p className="mb-2 text-sm text-gray-600">
                                {product.category}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <p className="text-xl font-bold">
                                {formatPrice(product.price)}
                              </p>
                              {product.size && (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                                  Talle: {product.size}
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
