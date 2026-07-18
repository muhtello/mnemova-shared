"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureProfile = ensureProfile;
exports.updateProfile = updateProfile;
// ─── ensureProfile ────────────────────────────────────────────────────────────
// Creates the profile row if missing, then returns the full profile.
// Profile is considered complete when first_name, last_name, phone AND country
// are all set — the fields we ask every user to fill in.
async function ensureProfile(client, userId, email) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // Create the row if missing. A failed create must not be swallowed — otherwise
    // the read below surfaces as a misleading "empty/incomplete" profile.
    const { error: upsertError } = await client
        .from('profiles')
        .upsert({ id: userId, email }, { onConflict: 'id', ignoreDuplicates: true });
    if (upsertError) {
        throw new Error(`ensureProfile: failed to create profile row: ${upsertError.message}`);
    }
    const { data, error } = await client
        .from('profiles')
        .select('first_name, last_name, phone, country, postal_code, avatar_url, birth_date, daily_goal_cards, preferred_study_time')
        .eq('id', userId)
        .single();
    // The row exists (just upserted), so an error/missing here is a real read
    // failure — NOT a new user. Returning a default empty profile would silently
    // force re-onboarding and let the edit form overwrite real data with blanks,
    // so fail loudly instead and let the caller's error boundary handle it.
    if (error || !data) {
        throw new Error(`ensureProfile: failed to load profile: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : 'no row returned'}`);
    }
    const firstName = (_b = data.first_name) !== null && _b !== void 0 ? _b : '';
    const lastName = (_c = data.last_name) !== null && _c !== void 0 ? _c : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const phone = (_d = data.phone) !== null && _d !== void 0 ? _d : '';
    const country = (_e = data.country) !== null && _e !== void 0 ? _e : '';
    const postalCode = (_f = data.postal_code) !== null && _f !== void 0 ? _f : '';
    return {
        isComplete: firstName.trim().length > 0 &&
            lastName.trim().length > 0 &&
            phone.trim().length > 0 &&
            country.trim().length > 0,
        firstName, lastName, fullName,
        phone,
        country,
        postalCode,
        avatarUrl: (_g = data.avatar_url) !== null && _g !== void 0 ? _g : '',
        birthDate: (_h = data.birth_date) !== null && _h !== void 0 ? _h : '',
        dailyGoalCards: (_j = data.daily_goal_cards) !== null && _j !== void 0 ? _j : 20,
        preferredStudyTime: (_k = data.preferred_study_time) !== null && _k !== void 0 ? _k : 'flexible',
    };
}
// ─── updateProfile ────────────────────────────────────────────────────────────
// Writes editable fields to the profiles table and mirrors full_name + avatar_url
// to auth user_metadata so UI components reading user_metadata stay in sync.
// `error` is a hard failure: the profile was NOT saved. `metadataWarning` is
// non-fatal: the profile DID save (profiles is the source of truth), but the
// best-effort auth user_metadata mirror failed, so cached UI fields (nav name/
// avatar) may be stale until the next refresh. Callers should treat the two
// distinctly — never report a metadataWarning as a failed save.
async function updateProfile(client, userId, data) {
    var _a, _b, _c, _d, _e, _f;
    const fullName = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(' ');
    const { error: profileError } = await client
        .from('profiles')
        .update({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        phone: data.phone.trim() || null,
        country: data.country.trim() || null,
        postal_code: ((_a = data.postalCode) === null || _a === void 0 ? void 0 : _a.trim()) || null,
        avatar_url: ((_b = data.avatarUrl) === null || _b === void 0 ? void 0 : _b.trim()) || null,
        birth_date: ((_c = data.birthDate) === null || _c === void 0 ? void 0 : _c.trim()) || null,
        daily_goal_cards: (_d = data.dailyGoalCards) !== null && _d !== void 0 ? _d : 20,
        preferred_study_time: (_e = data.preferredStudyTime) !== null && _e !== void 0 ? _e : 'flexible',
    })
        .eq('id', userId);
    if (profileError)
        return { error: profileError.message, metadataWarning: null };
    // Mirror to auth metadata so user_metadata stays consistent without extra DB
    // reads. Best-effort: the profiles write above already persisted the change,
    // so a mirror failure is a stale-cache warning, not a failed save.
    const { error: metaError } = await client.auth.updateUser({
        data: {
            full_name: fullName,
            ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl.trim() || null }),
        },
    });
    return { error: null, metadataWarning: (_f = metaError === null || metaError === void 0 ? void 0 : metaError.message) !== null && _f !== void 0 ? _f : null };
}
