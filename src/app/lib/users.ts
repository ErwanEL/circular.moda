import Airtable from 'airtable';
import type { User } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN,
}).base(process.env.AIRTABLE_BASE_ID!);

/**
 * Fetches user data from Airtable by user ID(s)
 * @param userIds - Array of user record IDs from Airtable
 * @returns Array of user objects
 */
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  if (!userIds || userIds.length === 0) {
    console.log('[getUsersByIds] No user IDs provided');
    return [];
  }

  try {
    // Assuming you have a "Users" table in Airtable
    // Adjust the table name to match your Airtable setup
    const usersTableName = process.env.AIRTABLE_USERS_TABLE_NAME || 'Users';
    console.log('[getUsersByIds] Fetching users from table:', usersTableName);
    console.log('[getUsersByIds] User IDs to fetch:', userIds);

    // Fetch users by their record IDs
    // Only fetch Name and Products fields for confidentiality
    const records = await Promise.all(
      userIds.map(async (id) => {
        try {
          console.log('[getUsersByIds] Fetching user record:', id);
          const record = await base(usersTableName).find(id);

          // Only extract Name and Products fields for confidentiality
          const user = {
            id: record.id,
            Name: record.fields.Name,
            Products: record.fields.Products,
          } as User;
          console.log('[getUsersByIds] Found user (filtered fields):', user);
          return user;
        } catch (error) {
          console.warn(`[getUsersByIds] User ${id} not found:`, error);
          return null;
        }
      })
    );

    const validUsers = records.filter((user): user is User => user !== null);
    console.log('[getUsersByIds] Returning users:', validUsers);
    return validUsers;
  } catch (error) {
    console.error('[getUsersByIds] Error fetching users from Airtable:', error);
    return [];
  }
}

/**
 * Fetches a single user by ID
 * @param userId - User record ID from Airtable
 * @returns User object or null
 */
export async function getUserById(userId: string): Promise<User | null> {
  const users = await getUsersByIds([userId]);
  return users.length > 0 ? users[0] : null;
}

/**
 * Fetches user data from Supabase by user ID(s) with product count
 * OPTIMIZED: Uses batch queries instead of N+1 queries
 * @param userIds - Array of user IDs from Supabase (as strings or numbers)
 * @returns Array of user objects with productCount
 */
export async function getUsersByIdsFromSupabase(userIds: (string | number)[]): Promise<User[]> {
  if (!userIds || userIds.length === 0) {
    console.log('[getUsersByIdsFromSupabase] No user IDs provided');
    return [];
  }

  if (!isSupabaseConfigured()) {
    console.log('[getUsersByIdsFromSupabase] Supabase not configured');
    return [];
  }

  try {
    // Convert all IDs to numbers (Supabase uses BIGINT)
    const numericIds = userIds.map(id => {
      if (typeof id === 'string') {
        // Try to parse as number first (Supabase IDs are numeric)
        const parsed = parseInt(id, 10);
        if (!isNaN(parsed)) return parsed;
        // If it's an Airtable ID format (starts with 'rec'), return null to skip
        if (id.startsWith('rec')) return null;
        return parsed;
      }
      return id;
    }).filter((id): id is number => id !== null);

    if (numericIds.length === 0) {
      console.log('[getUsersByIdsFromSupabase] No valid numeric IDs found');
      return [];
    }

    console.log('[getUsersByIdsFromSupabase] Fetching users from Supabase:', numericIds);

    // OPTIMIZATION: Fetch all users in a single query
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', numericIds);

    if (usersError) {
      console.error('[getUsersByIdsFromSupabase] Error fetching users:', usersError);
      return [];
    }

    if (!usersData || usersData.length === 0) {
      console.log('[getUsersByIdsFromSupabase] No users found');
      return [];
    }

    // OPTIMIZATION: Fetch all product counts in a single aggregated query
    // Use a subquery approach: get product counts grouped by owner
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('owner')
      .in('owner', numericIds);

    if (productsError) {
      console.warn('[getUsersByIdsFromSupabase] Error fetching product counts:', productsError);
      // Continue with 0 counts if error
    }

    // Count products per user
    const productCounts = new Map<number, number>();
    if (productsData) {
      productsData.forEach((product: { owner: number }) => {
        const ownerId = product.owner;
        productCounts.set(ownerId, (productCounts.get(ownerId) || 0) + 1);
      });
    }

    // Map users with their product counts
    const users: User[] = usersData.map((userData: { id: number; name: string }) => ({
      id: String(userData.id),
      name: userData.name,
      productCount: productCounts.get(userData.id) || 0,
    }));

    console.log(`[getUsersByIdsFromSupabase] Found ${users.length} users with product counts`);
    return users;
  } catch (error) {
    console.error('[getUsersByIdsFromSupabase] Error fetching users from Supabase:', error);
    return [];
  }
}

/**
 * Fetches a single user by ID from Supabase with product count
 * @param userId - User ID from Supabase (as string or number)
 * @returns User object or null
 */
export async function getUserByIdFromSupabase(userId: string | number): Promise<User | null> {
  const users = await getUsersByIdsFromSupabase([userId]);
  return users.length > 0 ? users[0] : null;
}

/**
 * Fetches user data from Supabase using database function (MOST EFFICIENT)
 * This uses a PostgreSQL function that does JOIN + COUNT in a single query
 * Requires: get_users_with_product_counts() function to be created in Supabase
 * @param userIds - Array of user IDs from Supabase (as strings or numbers)
 * @returns Array of user objects with productCount
 */
export async function getUsersByIdsFromSupabaseRPC(userIds: (string | number)[]): Promise<User[]> {
  if (!userIds || userIds.length === 0) {
    console.log('[getUsersByIdsFromSupabaseRPC] No user IDs provided');
    return [];
  }

  if (!isSupabaseConfigured()) {
    console.log('[getUsersByIdsFromSupabaseRPC] Supabase not configured');
    return [];
  }

  try {
    // Convert all IDs to numbers (Supabase uses BIGINT)
    const numericIds = userIds.map(id => {
      if (typeof id === 'string') {
        const parsed = parseInt(id, 10);
        if (!isNaN(parsed)) return parsed;
        if (id.startsWith('rec')) return null;
        return parsed;
      }
      return id;
    }).filter((id): id is number => id !== null);

    if (numericIds.length === 0) {
      console.log('[getUsersByIdsFromSupabaseRPC] No valid numeric IDs found');
      return [];
    }

    console.log('[getUsersByIdsFromSupabaseRPC] Using RPC to fetch users:', numericIds);

    // Call the database function - single query with JOIN + COUNT
    const { data, error } = await supabase.rpc('get_users_with_product_counts', {
      user_ids: numericIds,
    });

    if (error) {
      console.warn('[getUsersByIdsFromSupabaseRPC] RPC call failed, falling back to batch queries:', error);
      // Fallback to batch query approach
      return getUsersByIdsFromSupabase(userIds);
    }

    if (!data || data.length === 0) {
      console.log('[getUsersByIdsFromSupabaseRPC] No users found');
      return [];
    }

    // Map to User format
    const users: User[] = data.map((row: { id: number; name: string; product_count: number }) => ({
      id: String(row.id),
      name: row.name,
      productCount: row.product_count || 0,
    }));

    console.log(`[getUsersByIdsFromSupabaseRPC] Found ${users.length} users via RPC`);
    return users;
  } catch (error) {
    console.error('[getUsersByIdsFromSupabaseRPC] Error:', error);
    // Fallback to batch query approach
    return getUsersByIdsFromSupabase(userIds);
  }
}
