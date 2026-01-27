import { ImageResponse } from '@vercel/og';
import { getProductBySlug } from '../../lib/products';

// Use Node.js runtime (not edge) because getProductBySlug uses fs
export const runtime = 'nodejs';

// Cache for 24 hours
export const revalidate = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  try {
    const product = await getProductBySlug(slug);

    if (!product) {
      return new Response('Product not found', { status: 404 });
    }

    const productName = product['Product Name'] || 'Producto';
    const price = product.Price
      ? `$${product.Price.toLocaleString('es-AR')}`
      : '';
    const size = product.Size || product.size || '';

    // Get product image URL
    let imageUrl = '';
    if (product.Images && product.Images.length > 0) {
      const first = product.Images[0];
      imageUrl = typeof first === 'string' ? first : first.url;
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Product image - left side */}
          {imageUrl && (
            <div
              style={{
                display: 'flex',
                width: '50%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <img
                src={imageUrl}
                alt={productName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Product info - right side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '40px 50px',
              width: imageUrl ? '50%' : '100%',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 600,
                marginBottom: 30,
                color: '#1f2937',
              }}
            >
              circul
              <span style={{ color: '#7c3aed' }}>ar</span>
              .moda
            </div>

            {/* Product name */}
            <div
              style={{
                display: 'flex',
                fontSize: 42,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 20,
                lineHeight: 1.2,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {productName.length > 50
                ? productName.substring(0, 50) + '...'
                : productName}
            </div>

            {/* Size if available */}
            {size && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  color: '#6b7280',
                  marginBottom: 16,
                }}
              >
                Talle: {size}
              </div>
            )}

            {/* Price */}
            {price && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 48,
                  fontWeight: 800,
                  color: '#7c3aed',
                  marginTop: 10,
                }}
              >
                {price}
              </div>
            )}

            {/* Tagline */}
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                color: '#9ca3af',
                marginTop: 'auto',
                paddingTop: 30,
              }}
            >
              Moda circular y sostenible
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
