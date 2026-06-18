"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureProfile = ensureProfile;
exports.updateProfile = updateProfile;
// ─── ensureProfile ────────────────────────────────────────────────────────────
// Creates the profile row if missing, then returns the full profile.
// Profile is considered complete when both first_name and last_name are set.
async function ensureProfile(client, userId, email) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const empty = {
        isComplete: false, firstName: '', lastName: '', fullName: '',
        phone: '', avatarUrl: '', birthDate: '', dailyGoalCards: 20, preferredStudyTime: 'flexible',
    };
    await client
        .from('profiles')
        .upsert({ id: userId, email }, { onConflict: 'id', ignoreDuplicates: true });
    const { data, error } = await client
        .from('profiles')
        .select('first_name, last_name, full_name, phone, avatar_url, birth_date, daily_goal_cards, preferred_study_time')
        .eq('id', userId)
        .single();
    if (error || !data)
        return empty;
    const firstName = (_a = data.first_name) !== null && _a !== void 0 ? _a : '';
    const lastName = (_b = data.last_name) !== null && _b !== void 0 ? _b : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || ((_c = data.full_name) !== null && _c !== void 0 ? _c : '');
    return {
        isComplete: firstName.trim().length > 0 && lastName.trim().length > 0,
        firstName, lastName, fullName,
        phone: (_d = data.phone) !== null && _d !== void 0 ? _d : '',
        avatarUrl: (_e = data.avatar_url) !== null && _e !== void 0 ? _e : '',
        birthDate: (_f = data.birth_date) !== null && _f !== void 0 ? _f : '',
        dailyGoalCards: (_g = data.daily_goal_cards) !== null && _g !== void 0 ? _g : 20,
        preferredStudyTime: (_h = data.preferred_study_time) !== null && _h !== void 0 ? _h : 'flexible',
    };
}
// ─── updateProfile ────────────────────────────────────────────────────────────
// Writes editable fields to the profiles table and mirrors full_name + avatar_url
// to auth user_metadata so UI components reading user_metadata stay in sync.
async function updateProfile(client, userId, data) {
    var _a, _b, _c, _d, _e;
    const fullName = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(' ');
    const { error: profileError } = await client
        .from('profiles')
        .update({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        full_name: fullName,
        phone: data.phone.trim() || null,
        avatar_url: ((_a = data.avatarUrl) === null || _a === void 0 ? void 0 : _a.trim()) || null,
        birth_date: ((_b = data.birthDate) === null || _b === void 0 ? void 0 : _b.trim()) || null,
        daily_goal_cards: (_c = data.dailyGoalCards) !== null && _c !== void 0 ? _c : 20,
        preferred_study_time: (_d = data.preferredStudyTime) !== null && _d !== void 0 ? _d : 'flexible',
    })
        .eq('id', userId);
    if (profileError)
        return { error: profileError.message };
    // Mirror to auth metadata so user_metadata stays consistent without extra DB reads
    const { error: metaError } = await client.auth.updateUser({
        data: {
            full_name: fullName,
            ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl.trim() || null }),
        },
    });
    return { error: (_e = metaError === null || metaError === void 0 ? void 0 : metaError.message) !== null && _e !== void 0 ? _e : null };
}
