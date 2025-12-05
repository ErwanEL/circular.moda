import Airtable from 'airtable';
import type { User } from './types';

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
