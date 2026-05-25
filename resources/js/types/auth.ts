export type UserLevel = {
    level: number;
    current_xp: number;
    next_level_xp: number | null;
    progress: number;
    bonus_percent: number;
};

export type RoleName = 'Super Admin' | 'Admin' | 'User';

export type User = {
    id: number;
    name: string;
    username: string | null;
    email: string;
    avatar?: string;
    points: number;
    xp: number;
    current_streak: number;
    longest_streak: number;
    is_admin: boolean;
    role: RoleName;
    status: 'active' | 'inactive';
    bio?: string | null;
    pronoun?: string | null;
    location?: string | null;
    profile_visibility?: 'public' | 'private';
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    level?: UserLevel;
    badge_count?: number;
    created_at: string;
    updated_at: string;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
