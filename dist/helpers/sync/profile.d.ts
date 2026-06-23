import type { SupabaseClient } from '@supabase/supabase-js';
export interface ProfileData {
    isComplete: boolean;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    avatarUrl: string;
    birthDate: string;
    dailyGoalCards: number;
    preferredStudyTime: string;
}
export interface ProfileUpdate {
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl?: string;
    birthDate?: string;
    dailyGoalCards?: number;
    preferredStudyTime?: string;
}
export declare function ensureProfile(client: SupabaseClient, userId: string, email: string): Promise<ProfileData>;
export declare function updateProfile(client: SupabaseClient, userId: string, data: ProfileUpdate): Promise<{
    error: string | null;
    metadataWarning: string | null;
}>;
