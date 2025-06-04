import { supabase } from '../lib/supabase';

export async function isUserWhitelistedForLegacyBeta(userSub: string): Promise<boolean> {
  try {
    console.log('DEBUG: Checking whitelist for userSub:', userSub);
    const { data, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id')
      .eq('auth0_user_id', userSub)
      .single();

    console.log('DEBUG: Supabase query result - data:', data, 'error:', error);

    if (error) {
      // If error is 'no rows returned', user is not whitelisted
      if (error.code === 'PGRST116') {
        console.log('DEBUG: No rows returned (PGRST116), user not whitelisted');
        return false;
      }
      console.error('Error checking whitelist:', error);
      return false;
    }

    const result = data !== null;
    console.log('DEBUG: Final whitelist result:', result);
    return result;
  } catch (error) {
    console.error('Unexpected error checking whitelist:', error);
    return false;
  }
} 