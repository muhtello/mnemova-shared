export type Tier = 'free' | 'pro';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'inactive';

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
export const RC_ENTITLEMENT_ID = 'pro';



export const TIER_LIMITS = {
    free: {
        maxDecks: 3,
        monthlyExercises: 30,
    },
    pro: {
        maxDecks: Infinity,
        monthlyExercises: Infinity,
    },
} as const;

type TierInfo = {
    label: string;
    description: string;
    maxDecks: number;
    monthlyExercises: number;
    features: string[];
};

export const TIER_INFO: Record<Tier, TierInfo> = {
    free: {
        label: 'Free',
        description: 'Basic learning access',
        maxDecks: TIER_LIMITS.free.maxDecks,
        monthlyExercises: TIER_LIMITS.free.monthlyExercises,
        features: [
            'QR Sync',
            'Mobile Practice',
            '3 Decks',
            '30 Exercises / Month',
        ],
    },
    pro: {
        label: 'Pro',
        description: 'Unlimited learning experience',
        maxDecks: TIER_LIMITS.pro.maxDecks,
        monthlyExercises: TIER_LIMITS.pro.monthlyExercises,
        features: [
            'Unlimited Decks',
            'Unlimited Exercises',
            'Advanced Learning Modes',
            'Priority Features',
            `No Ads`
        ],
    },
};



