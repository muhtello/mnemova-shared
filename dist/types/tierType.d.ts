export type Tier = 'free' | 'pro';
export type SubscriptionStatus = 'none' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
export interface UserTierRow {
    user_id: string;
    tier: Tier;
    subscription_status: SubscriptionStatus;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    revenuecat_app_user_id?: string | null;
    updated_at?: string | null;
}
/** RevenueCat entitlement ID — must match what's configured in the RC dashboard */
export declare const RC_ENTITLEMENT_ID = "pro";
export declare const TIER_LIMITS: {
    readonly free: {
        readonly maxDecks: 3;
        readonly monthlyExercises: 30;
    };
    readonly pro: {
        readonly maxDecks: number;
        readonly monthlyExercises: number;
    };
};
type TierInfo = {
    labelKey: string;
    descriptionKey: string;
    maxDecks: number;
    monthlyExercises: number;
    featureKeys: string[];
};
export declare const TIER_INFO: Record<Tier, TierInfo>;
export {};
