/**
 * Script de test pour vérifier la connexion Supabase
 * Usage: node -r ts-node/register src/app/lib/test-supabase.ts
 */

import { supabase, isSupabaseConfigured } from './supabase';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured!');
    console.log('Please check your .env.local file:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  console.log('✅ Supabase is configured\n');

  // Test 1: Check if products table exists
  console.log('📊 Testing products table...');
  try {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error accessing products table:', error.message);
      console.log('\n💡 Make sure:');
      console.log('1. The "products" table exists in your Supabase database');
      console.log('2. RLS (Row Level Security) is disabled or properly configured');
      process.exit(1);
    }

    console.log(`✅ Products table accessible (${count || 0} products)\n`);
  } catch (error: any) {
    console.error('❌ Failed to connect:', error.message);
    process.exit(1);
  }

  // Test 2: Try to fetch a few products
  console.log('📦 Fetching sample products...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, SKU, "Product Name", slug')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching products:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No products found in Supabase');
      console.log('   This is normal if you haven\'t added products yet.');
    } else {
      console.log(`✅ Found ${data.length} product(s):`);
      data.forEach((product: any) => {
        console.log(`   - ${product['Product Name'] || product.SKU} (SKU: ${product.SKU}, slug: ${product.slug})`);
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch products:', error.message);
    process.exit(1);
  }

  console.log('\n✅ All tests passed! Supabase is ready to use.');
}

// Run if called directly
if (require.main === module) {
  testSupabaseConnection().catch(console.error);
}

export { testSupabaseConnection };

