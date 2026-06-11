"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTier = getUserTier;
/**
 * Fetch the tier row for a user. Accepts any Supabase client instance
 * (web server client or mobile client) — platform-agnostic.
 */
async function getUserTier(supabase, userId) {
    var _a, _b;
    const { data } = await supabase
        .from('user_tiers')
        .select('tier, subscription_status, stripe_customer_id, revenuecat_app_user_id')
        .eq('user_id', userId)
        .maybeSingle();
    return {
        tier: ((_a = data === null || data === void 0 ? void 0 : data.tier) !== null && _a !== void 0 ? _a : 'free'),
        subscription_status: ((_b = data === null || data === void 0 ? void 0 : data.subscription_status) !== null && _b !== void 0 ? _b : null),
        stripe_customer_id: data === null || data === void 0 ? void 0 : data.stripe_customer_id,
        revenuecat_app_user_id: data === null || data === void 0 ? void 0 : data.revenuecat_app_user_id,
    };
}
