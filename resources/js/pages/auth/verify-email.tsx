import { Form, Head, Link } from '@inertiajs/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { store as send } from '@/actions/Laravel/Fortify/Http/Controllers/EmailVerificationNotificationController';
import AppLogo from '@/components/app-logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/hooks/use-appearance';
import { logout } from '@/routes';

export default function VerifyEmail({ status }: { status?: string }) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <Head title="Verifikasi">
                <meta
                    name="description"
                    content="Verifikasi alamat email Anda untuk menyelesaikan pendaftaran Cryptere."
                />
                <meta name="robots" content="noindex,follow" />
            </Head>

            <main className="flex min-h-screen items-center justify-center bg-background px-4 py-4 lg:h-screen">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                    <div className="flex items-center justify-center select-none">
                        <AppLogo className="pointer-events-auto h-11 w-auto" />
                    </div>

                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">
                                    Verifikasi Email
                                </CardTitle>
                                <Tabs
                                    value={appearance}
                                    onValueChange={(value) =>
                                        updateAppearance(
                                            value as
                                                | 'light'
                                                | 'dark'
                                                | 'system',
                                        )
                                    }
                                >
                                    <TabsList>
                                        <TabsTrigger
                                            value="light"
                                            aria-label="Light theme"
                                        >
                                            <Sun className="size-4" />
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="dark"
                                            aria-label="Dark theme"
                                        >
                                            <Moon className="size-4" />
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="system"
                                            aria-label="System theme"
                                        >
                                            <Monitor className="size-4" />
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Silakan verifikasi alamat email Anda dengan
                                mengklik tautan yang baru saja kami kirimkan
                                kepada Anda.
                            </p>

                            {status === 'verification-link-sent' && (
                                <Alert className="mb-4">
                                    <AlertDescription>
                                        Tautan verifikasi baru telah dikirim ke
                                        alamat email yang Anda berikan saat
                                        pendaftaran.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Form
                                {...send()}
                                className="flex flex-col gap-4"
                            >
                                {({ processing }) => (
                                    <>
                                        <Button
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing && <Spinner />}
                                            Kirim Ulang Email Verifikasi
                                        </Button>

                                        <Link
                                            href={logout()}
                                            className="mx-auto block text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                        >
                                            Keluar
                                        </Link>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

VerifyEmail.layout = (page: React.ReactNode) => page;
