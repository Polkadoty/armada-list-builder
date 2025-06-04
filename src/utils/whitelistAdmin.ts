import { supabase } from '../lib/supabase';

/**
 * Admin utility functions for managing the Legacy Beta whitelist
 * Note: These functions require service role permissions to work properly
 */

// DEBUG: Simple function to check database connection and current user
export async function debugWhitelistSystem(currentUserSub?: string): Promise<void> {
  console.log('DEBUG: Testing Supabase connection...');
  
  try {
    // Test basic connection - fix count syntax
    const { data: testData, error: testError } = await supabase
      .from('legacy_beta_whitelist')
      .select('*', { count: 'exact', head: true });

    console.log('DEBUG: Connection test - data:', testData, 'error:', testError);

    // List all whitelisted users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id');

    console.log('DEBUG: All whitelisted users:', allUsers, 'error:', allUsersError);

    // Check current user if provided
    if (currentUserSub) {
      console.log('DEBUG: Checking current user:', currentUserSub);
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('legacy_beta_whitelist')
        .select('auth0_user_id')
        .eq('auth0_user_id', currentUserSub);

      console.log('DEBUG: Current user query result:', currentUserData, 'error:', currentUserError);
    }
  } catch (error) {
    console.error('DEBUG: Unexpected error in debug function:', error);
  }
}

export async function addUserToWhitelist(auth0UserId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('legacy_beta_whitelist')
      .insert([{ auth0_user_id: auth0UserId }]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('User is already whitelisted');
        return true;
      }
      console.error('Error adding user to whitelist:', error);
      return false;
    }

    console.log('User added to whitelist successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error adding user to whitelist:', error);
    return false;
  }
}

export async function removeUserFromWhitelist(auth0UserId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('legacy_beta_whitelist')
      .delete()
      .eq('auth0_user_id', auth0UserId);

    if (error) {
      console.error('Error removing user from whitelist:', error);
      return false;
    }

    console.log('User removed from whitelist successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error removing user from whitelist:', error);
    return false;
  }
}

export async function getAllWhitelistedUsers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id');

    if (error) {
      console.error('Error fetching whitelisted users:', error);
      return [];
    }

    return data.map(row => row.auth0_user_id);
  } catch (error) {
    console.error('Unexpected error fetching whitelisted users:', error);
    return [];
  }
}

export async function isUserInWhitelist(auth0UserId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id')
      .eq('auth0_user_id', auth0UserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking whitelist:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Unexpected error checking whitelist:', error);
    return false;
  }
} 