import { supabase } from '../lib/supabase';

export async function isUserWhitelistedForLegacyAlpha(userSub: string): Promise<boolean> {
  try {
    // Fetch all whitelisted users to avoid URL encoding issues with pipe characters
    const { data: allUsers, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id');

    if (error) {
      console.error('Error fetching whitelisted users:', error);
      return false;
    }

    // Check if the user is in the whitelist
    return allUsers?.some(user => user.auth0_user_id === userSub) || false;
  } catch (error) {
    console.error('Unexpected error checking whitelist:', error);
    return false;
  }
}

export async function isUserWhitelistedForArcBeta(userSub: string): Promise<boolean> {
  try {
    // Fetch all whitelisted users to avoid URL encoding issues with pipe characters
    const { data: allUsers, error } = await supabase
      .from('legacy_beta_whitelist')
      .select('auth0_user_id');

    if (error) {
      console.error('Error fetching whitelisted users:', error);
      return false;
    }

    // Check if the user is in the whitelist
    return allUsers?.some(user => user.auth0_user_id === userSub) || false;
  } catch (error) {
    console.error('Unexpected error checking whitelist:', error);
    return false;
  }
} 