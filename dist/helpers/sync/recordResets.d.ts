import type { SupabaseClient } from '@supabase/supabase-js';
import type { RecordReset } from '../../types/studyType';
export declare function syncRecordResets(client: SupabaseClient, resets: RecordReset[], userId: string): Promise<{
    syncedDeckIds: string[];
    error: string | null;
}>;
