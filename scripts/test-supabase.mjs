#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion Supabase
 * Usage: node scripts/test-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase is not configured!');
  console.log('Please check your .env.local file:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

console.log('✅ Supabase credentials found');
console.log(`   URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.log('\nError details:', error);
    process.exit(1);
  }

  console.log(`✅ Products table accessible (${count || 0} products)\n`);
} catch (error) {
  console.error('❌ Failed to connect:', error.message);
  process.exit(1);
}

// Test 2: Check table structure first
console.log('🔍 Checking table structure...');
try {
  const { data: structureData, error: structureError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (structureError) {
    console.error('❌ Error checking structure:', structureError.message);
  } else if (structureData && structureData.length > 0) {
    console.log('✅ Table structure sample:');
    console.log('   Columns:', Object.keys(structureData[0]).join(', '));
  }
} catch (error) {
  console.log('⚠️  Could not check structure:', error.message);
}

// Test 3: Try to fetch a few products
console.log('\n📦 Fetching sample products...');
try {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Error fetching products:', error.message);
    console.log('Error details:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No products found in Supabase');
    console.log('   This is normal if you haven\'t added products yet.');
  } else {
    console.log(`✅ Found ${data.length} product(s):`);
    data.forEach((product, index) => {
      const name = product['Product Name'] || product.product_name || product.name || 'Unnamed';
      const sku = product.SKU || product.sku || product.id || 'N/A';
      const slug = product.slug || `product-${product.id}`;
      console.log(`   ${index + 1}. ${name}`);
      console.log(`      ID: ${product.id}, SKU: ${sku}, slug: ${slug}`);
      if (product.price) console.log(`      Price: ${product.price}`);
      if (product.category) console.log(`      Category: ${product.category}`);
    });
  }
} catch (error) {
  console.error('❌ Failed to fetch products:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! Supabase is ready to use.');
console.log('\n💡 Next steps:');
console.log('   1. Make sure your products table has the correct structure');
console.log('   2. Add some products to Supabase to test the integration');
console.log('   3. Restart your dev server: npm run dev');

