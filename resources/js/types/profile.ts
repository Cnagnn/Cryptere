export type ProfileBadge = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    earned_at: string;
};

export type ProfileVisibility = 'public' | 'private';

export type ProfileUser = {
    id?: number;
    name: string;
    username: string | null;
    email?: string | null;
    avatar?: string | null;
    has_custom_avatar?: boolean;
    pixabot_avatar_id?: string | null;
    bio?: string | null;
    pronoun?: string | null;
    location?: string | null;
    profile_visibility?: ProfileVisibility;
    xp?: number;
    points?: number;
    current_streak?: number;
    longest_streak?: number;
    created_at?: string;
};

export type AvatarOption = {
    baseUrl: string;
    ids: string[];
};

export type SocialAccount = {
    id: number;
    provider: string;
    provider_email: string | null;
    provider_name: string | null;
    created_at: string;
};
