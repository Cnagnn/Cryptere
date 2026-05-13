import { router, useHttp } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import {
    confirm,
    disable,
    enable,
    qrCode,
    recoveryCodes,
    regenerateRecoveryCodes,
    secretKey,
} from '@/routes/two-factor';

export type UseTwoFactorAuthReturn = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    hasSetupData: boolean;
    errors: string[];
    clearErrors: () => void;
    clearSetupData: () => void;
    clearTwoFactorAuthData: () => void;
    enableTwoFactor: () => Promise<void>;
    confirmTwoFactor: (code: string) => Promise<void>;
    disableTwoFactor: () => Promise<void>;
    regenerateRecoveryCodes: () => Promise<void>;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
};

export const OTP_MAX_LENGTH = 6;

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
    const { submit } = useHttp();

    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const hasSetupData = qrCodeSvg !== null && manualSetupKey !== null;

    const clearErrors = useCallback((): void => {
        setErrors([]);
    }, []);

    const clearSetupData = useCallback((): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        setErrors([]);
    }, []);

    const clearTwoFactorAuthData = useCallback((): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        setErrors([]);
        setRecoveryCodesList([]);
    }, []);

    const fetchQrCode = useCallback(async (): Promise<void> => {
        try {
            const { svg } = (await submit(qrCode())) as {
                svg: string;
                url: string;
            };

            setQrCodeSvg(svg);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch QR code']);
            setQrCodeSvg(null);
        }
    }, [submit]);

    const fetchSetupKey = useCallback(async (): Promise<void> => {
        try {
            const { secretKey: key } = (await submit(secretKey())) as {
                secretKey: string;
            };

            setManualSetupKey(key);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch a setup key']);
            setManualSetupKey(null);
        }
    }, [submit]);

    const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
        try {
            setErrors([]);
            const codes = (await submit(recoveryCodes())) as string[];
            setRecoveryCodesList(codes);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch recovery codes']);
            setRecoveryCodesList([]);
        }
    }, [submit]);

    const enableTwoFactor = useCallback(async (): Promise<void> => {
        setErrors([]);

        await new Promise<void>((resolve, reject) => {
            router.post(enable.url(), undefined, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => {
                    setErrors(['Failed to enable two-factor authentication']);
                    reject(new Error('Failed to enable two-factor authentication'));
                },
            });
        });
    }, []);

    const confirmTwoFactor = useCallback(async (code: string): Promise<void> => {
        setErrors([]);

        await new Promise<void>((resolve, reject) => {
            router.post(
                confirm.url(),
                { code },
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => {
                        setErrors(['The verification code was not accepted']);
                        reject(new Error('The verification code was not accepted'));
                    },
                },
            );
        });
    }, []);

    const disableTwoFactor = useCallback(async (): Promise<void> => {
        setErrors([]);

        await new Promise<void>((resolve, reject) => {
            router.delete(disable.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    clearTwoFactorAuthData();
                    resolve();
                },
                onError: () => {
                    setErrors(['Failed to disable two-factor authentication']);
                    reject(
                        new Error('Failed to disable two-factor authentication'),
                    );
                },
            });
        });
    }, [clearTwoFactorAuthData]);

    const regenerateCodes = useCallback(async (): Promise<void> => {
        try {
            setErrors([]);
            await submit(regenerateRecoveryCodes());
            await fetchRecoveryCodes();
        } catch {
            setErrors((prev) => [
                ...prev,
                'Failed to regenerate recovery codes',
            ]);
        }
    }, [fetchRecoveryCodes, submit]);

    const fetchSetupData = useCallback(async (): Promise<void> => {
        try {
            setErrors([]);
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            setQrCodeSvg(null);
            setManualSetupKey(null);
        }
    }, [fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors,
        clearErrors,
        clearSetupData,
        clearTwoFactorAuthData,
        enableTwoFactor,
        confirmTwoFactor,
        disableTwoFactor,
        regenerateRecoveryCodes: regenerateCodes,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
};
