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
        labelKey: 'common:billing.free.label',
        descriptionKey: 'common:billing.free.description',
        maxDecks: exports.TIER_LIMITS.free.maxDecks,
        monthlyExercises: exports.TIER_LIMITS.free.monthlyExercises,
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
        maxDecks: exports.TIER_LIMITS.pro.maxDecks,
        monthlyExercises: exports.TIER_LIMITS.pro.monthlyExercises,
        featureKeys: [
            'common:billing.feature.unlimitedDecks',
            'common:billing.feature.unlimitedExercises',
            'common:billing.feature.advancedModes',
            'common:billing.feature.priorityFeatures',
            'common:billing.feature.noAds',
        ],
    },
};
