import { supabase } from '../lib/supabase';

export async function isUserWhitelistedForLegacyBeta(userSub: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id')
      .eq('auth0_user_id', userSub)
      .single();

    if (error) {
      // If error is 'no rows returned', user is not whitelisted
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