import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tier, SubscriptionStatus } from '../types/tierType';
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
export declare function getUserTier(supabase: SupabaseClient, userId: string): Promise<UserTierResult>;
