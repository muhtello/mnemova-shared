"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_INFO = exports.TIER_LIMITS = exports.RC_ENTITLEMENT_ID = void 0;
/** RevenueCat entitlement ID — must match what's configured in the RC dashboard */
exports.RC_ENTITLEMENT_ID = 'pro';
exports.TIER_LIMITS = {
    free: {
        maxDecks: 3,
        monthlyExercises: 30,
    },
    pro: {
        maxDecks: Infinity,
        monthlyExercises: Infinity,
    },
};
exports.TIER_INFO = {
    free: {
        label: 'Free',
        description: 'Basic learning access',
        maxDecks: exports.TIER_LIMITS.free.maxDecks,
        monthlyExercises: exports.TIER_LIMITS.free.monthlyExercises,
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
        maxDecks: exports.TIER_LIMITS.pro.maxDecks,
        monthlyExercises: exports.TIER_LIMITS.pro.monthlyExercises,
        features: [
            'Unlimited Decks',
            'Unlimited Exercises',
            'Advanced Learning Modes',
            'Priority Features',
            `No Ads`
        ],
    },
};
