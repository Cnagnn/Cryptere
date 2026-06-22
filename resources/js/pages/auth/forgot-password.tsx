// Components
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle, Mail, Monitor, Moon, Sun } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/hooks/use-appearance';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <Head title="Lupa Kata Sandi" />

            <main className="flex min-h-screen items-center justify-center bg-background py-4 lg:h-screen">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                    <div className="flex items-center justify-center select-none">
                        <AppLogo className="pointer-events-auto h-11 w-auto" />
                    </div>
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">
                                    Lupa Kata Sandi
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
                            <CardDescription>
                                Masukkan alamat email Anda dan kami akan
                                mengirimkan instruksi untuk mengatur ulang kata
                                sandi Anda.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {status && (
                                <Alert className="mb-4 text-center">
                                    <AlertDescription>
                                        {status}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Form
                                action={email.url()}
                                method="post"
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors, wasSuccessful }) => {
                                    const isSuccess = Boolean(
                                        status || wasSuccessful,
                                    );

                                    return (
                                        <>
                                            <Field
                                                data-invalid={Boolean(
                                                    errors.email,
                                                )}
                                            >
                                                <FieldLabel htmlFor="email">
                                                    Alamat Email
                                                </FieldLabel>

                                                <div className="relative">
                                                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transform text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        autoComplete="email"
                                                        autoFocus
                                                        placeholder="email@domain.com"
                                                        aria-invalid={
                                                            Boolean(
                                                                errors.email,
                                                            ) || undefined
                                                        }
                                                        className="w-full pl-9"
                                                        disabled={isSuccess}
                                                    />
                                                </div>

                                                {errors.email && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.email}
                                                    </p>
                                                )}
                                            </Field>

                                            {!isSuccess && (
                                                <Button
                                                    className="w-full"
                                                    disabled={processing}
                                                    data-test="email-password-reset-link-button"
                                                >
                                                    {processing && (
                                                        <LoaderCircle className="mr-2 -ml-1 size-4 animate-spin" />
                                                    )}
                                                    Kirim Instruksi Reset
                                                </Button>
                                            )}

                                            <div className="text-center text-sm">
                                                Sudah punya akun?{' '}
                                                <Link
                                                    href={login()}
                                                    className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                                >
                                                    Masuk
                                                </Link>
                                            </div>
                                        </>
                                    );
                                }}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

ForgotPassword.layout = (page: React.ReactNode) => page;
