import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tier, SubscriptionStatus, UserTierRow } from '../types/tierType';

export interface UserTierResult {
  tier: Tier;
  subscription_status: SubscriptionStatus | null;
  stripe_customer_id?: string | null;
  revenuecat_app_user_id?: string | null;
}

/**
 * Fetch the tier row for a user. Accepts any Supabase client instance
 * (web server client or mobile client) — platform-agnostic.
 */
export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserTierResult> {
  const { data } = await supabase
    .from('user_tiers')
    .select('tier, subscription_status, stripe_customer_id, revenuecat_app_user_id')
    .eq('user_id', userId)
    .maybeSingle<UserTierRow>();

  return {
    tier: (data?.tier ?? 'free') as Tier,
    subscription_status: (data?.subscription_status ?? null) as SubscriptionStatus | null,
    stripe_customer_id: data?.stripe_customer_id,
    revenuecat_app_user_id: data?.revenuecat_app_user_id,
  };
}
