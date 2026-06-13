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

// label/description/feature text is now i18n. *Key fields hold common-namespace
// keys — resolve with t() at the call site (e.g. t(info.labelKey),
// info.featureKeys.map(t)). Numeric limits stay here as data.
type TierInfo = {
    labelKey: string;
    descriptionKey: string;
    maxDecks: number;
    monthlyExercises: number;
    featureKeys: string[];
};

export const TIER_INFO: Record<Tier, TierInfo> = {
    free: {
        labelKey: 'common:billing.free.label',
        descriptionKey: 'common:billing.free.description',
        maxDecks: TIER_LIMITS.free.maxDecks,
        monthlyExercises: TIER_LIMITS.free.monthlyExercises,
        featureKeys: [
            'common:billing.feature.qrSync',
            'common:billing.feature.mobilePractice',
            'common:billing.feature.decks3',
            'common:billing.feature.exercises30Month',
        ],
    },
    pro: {
        labelKey: 'common:billing.pro.label',
        descriptionKey: 'common:billing.pro.description',
        maxDecks: TIER_LIMITS.pro.maxDecks,
        monthlyExercises: TIER_LIMITS.pro.monthlyExercises,
        featureKeys: [
            'common:billing.feature.unlimitedDecks',
            'common:billing.feature.unlimitedExercises',
            'common:billing.feature.advancedModes',
            'common:billing.feature.priorityFeatures',
            'common:billing.feature.noAds',
        ],
    },
};



