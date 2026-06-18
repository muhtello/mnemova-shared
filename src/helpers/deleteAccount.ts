import type { SupabaseClient } from '@supabase/supabase-js'

// REQUIRED — run the SQL below once in your Supabase SQL editor:
//
// CREATE OR REPLACE FUNCTION public.delete_user_account()
// RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
// DECLARE uid uuid := auth.uid(); BEGIN
//   IF uid IS NULL THEN RETURN json_build_object('error', 'Not authenticated'); END IF;
//   DELETE FROM card_records   WHERE user_id  = uid;
//   DELETE FROM study_settings WHERE deck_id  IN (SELECT id FROM decks WHERE owner_id = uid);
//   DELETE FROM exercises      WHERE deck_id  IN (SELECT id FROM decks WHERE owner_id = uid);
//   DELETE FROM decks          WHERE owner_id = uid;
//   DELETE FROM user_tiers     WHERE user_id  = uid;
//   DELETE FROM profiles       WHERE id       = uid;
//   DELETE FROM auth.users     WHERE id       = uid;
//   RETURN json_build_object('error', null::text);
// END; $$;

export async function deleteAccount(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error: string | null }> {
  // Remove avatar files — best-effort, don't fail if storage cleanup hiccups.
  // List the user's folder and delete whatever is actually there rather than
  // guessing a filename: mobile writes a fixed `avatar.jpg`, but web names files
  // `<timestamp>.<ext>` (png/webp/…) and leaves older uploads behind, so a
  // hardcoded path would orphan every web avatar on account deletion.
  const { data: avatarFiles } = await supabase.storage.from('avatars').list(userId)
  if (avatarFiles && avatarFiles.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove(avatarFiles.map((file) => `${userId}/${file.name}`))
  }

  const { data, error } = await supabase.rpc('delete_user_account')
  if (error) return { error: error.message }

  return { error: (data as { error: string | null } | null)?.error ?? null }
}
