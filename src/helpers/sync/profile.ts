import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileData {
  isComplete: boolean
  firstName: string
  lastName: string
  fullName: string
  phone: string
  country: string
  postalCode: string
  avatarUrl: string
  birthDate: string
  dailyGoalCards: number
  preferredStudyTime: string
}

export interface ProfileUpdate {
  firstName: string
  lastName: string
  phone: string
  country: string
  postalCode?: string
  avatarUrl?: string
  birthDate?: string
  dailyGoalCards?: number
  preferredStudyTime?: string
}

// ─── Row shape ────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  country: string | null
  postal_code: string | null
  avatar_url: string | null
  birth_date: string | null
  daily_goal_cards: number | null
  preferred_study_time: string | null
}

// ─── ensureProfile ────────────────────────────────────────────────────────────
// Creates the profile row if missing, then returns the full profile.
// Profile is considered complete when first_name, last_name, phone AND country
// are all set — the fields we ask every user to fill in.

export async function ensureProfile(
  client: SupabaseClient,
  userId: string,
  email: string,
): Promise<ProfileData> {
  // Create the row if missing. A failed create must not be swallowed — otherwise
  // the read below surfaces as a misleading "empty/incomplete" profile.
  const { error: upsertError } = await client
    .from('profiles')
    .upsert({ id: userId, email }, { onConflict: 'id', ignoreDuplicates: true })
  if (upsertError) {
    throw new Error(`ensureProfile: failed to create profile row: ${upsertError.message}`)
  }

  const { data, error } = await client
    .from('profiles')
    .select('first_name, last_name, phone, country, postal_code, avatar_url, birth_date, daily_goal_cards, preferred_study_time')
    .eq('id', userId)
    .single<ProfileRow>()

  // The row exists (just upserted), so an error/missing here is a real read
  // failure — NOT a new user. Returning a default empty profile would silently
  // force re-onboarding and let the edit form overwrite real data with blanks,
  // so fail loudly instead and let the caller's error boundary handle it.
  if (error || !data) {
    throw new Error(`ensureProfile: failed to load profile: ${error?.message ?? 'no row returned'}`)
  }

  const firstName = data.first_name ?? ''
  const lastName = data.last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const phone = data.phone ?? ''
  const country = data.country ?? ''
  const postalCode = data.postal_code ?? ''

  return {
    isComplete:
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      phone.trim().length > 0 &&
      country.trim().length > 0,
    firstName, lastName, fullName,
    phone,
    country,
    postalCode,
    avatarUrl: data.avatar_url ?? '',
    birthDate: data.birth_date ?? '',
    dailyGoalCards: data.daily_goal_cards ?? 20,
    preferredStudyTime: data.preferred_study_time ?? 'flexible',
  }
}

// ─── updateProfile ────────────────────────────────────────────────────────────
// Writes editable fields to the profiles table and mirrors full_name + avatar_url
// to auth user_metadata so UI components reading user_metadata stay in sync.

// `error` is a hard failure: the profile was NOT saved. `metadataWarning` is
// non-fatal: the profile DID save (profiles is the source of truth), but the
// best-effort auth user_metadata mirror failed, so cached UI fields (nav name/
// avatar) may be stale until the next refresh. Callers should treat the two
// distinctly — never report a metadataWarning as a failed save.
export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  data: ProfileUpdate,
): Promise<{ error: string | null; metadataWarning: string | null }> {
  const fullName = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(' ')

  const { error: profileError } = await client
    .from('profiles')
    .update({
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      phone: data.phone.trim() || null,
      country: data.country.trim() || null,
      postal_code: data.postalCode?.trim() || null,
      avatar_url: data.avatarUrl?.trim() || null,
      birth_date: data.birthDate?.trim() || null,
      daily_goal_cards: data.dailyGoalCards ?? 20,
      preferred_study_time: data.preferredStudyTime ?? 'flexible',
    })
    .eq('id', userId)

  if (profileError) return { error: profileError.message, metadataWarning: null }

  // Mirror to auth metadata so user_metadata stays consistent without extra DB
  // reads. Best-effort: the profiles write above already persisted the change,
  // so a mirror failure is a stale-cache warning, not a failed save.
  const { error: metaError } = await client.auth.updateUser({
    data: {
      full_name: fullName,
      ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl.trim() || null }),
    },
  })

  return { error: null, metadataWarning: metaError?.message ?? null }
}
