import { supabase } from '../lib/supabase';

export async function isUserWhitelistedForLegacyBeta(userSub: string): Promise<boolean> {
  try {
    console.log('DEBUG: Checking whitelist for userSub:', userSub);
    
    // First, try to get all users and check locally to avoid URL encoding issues
    const { data: allUsers, error: allUsersError } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id');

    console.log('DEBUG: All users query - data:', allUsers, 'error:', allUsersError);

    if (allUsersError) {
      console.error('Error fetching all whitelisted users:', allUsersError);
      return false;
    }

    // Check if our user is in the list
    const isWhitelisted = allUsers?.some(user => user.auth0_user_id === userSub) || false;
    console.log('DEBUG: User found in whitelist:', isWhitelisted);

    // Also try the original single query approach as backup
    const { data, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id')
      .eq('auth0_user_id', userSub)
      .single();

    console.log('DEBUG: Single query result - data:', data, 'error:', error);

    if (error) {
      // If error is 'no rows returned', user is not whitelisted
      if (error.code === 'PGRST116') {
        console.log('DEBUG: No rows returned (PGRST116), user not whitelisted');
        // But use the all-users result as the authoritative answer
        return isWhitelisted;
      }
      console.error('Error checking whitelist:', error);
      // Fall back to the all-users result
      return isWhitelisted;
    }

    const singleQueryResult = data !== null;
    console.log('DEBUG: Single query success, result:', singleQueryResult);
    console.log('DEBUG: All users result:', isWhitelisted);
    console.log('DEBUG: Final result (using all-users method):', isWhitelisted);
    
    return isWhitelisted;
  } catch (error) {
    console.error('Unexpected error checking whitelist:', error);
    return false;
  }
} 