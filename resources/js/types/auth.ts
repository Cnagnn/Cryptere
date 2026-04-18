export type User = {
    id: number;
    name: string;
    username: string | null;
    email: string;
    avatar?: string;
    points: number;
    is_admin: boolean;
    role: 'admin' | 'member';
    status: 'active' | 'inactive';
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
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
