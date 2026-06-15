import { Form, Head, Link } from '@inertiajs/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { store as send } from '@/actions/Laravel/Fortify/Http/Controllers/EmailVerificationNotificationController';
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

            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4 lg:h-screen">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                    <div className="flex items-center justify-center select-none">
                        <svg
                            viewBox="0 0 203 51"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            aria-label="Cryptere"
                            onContextMenu={(event) => event.preventDefault()}
                            onDragStart={(event) => event.preventDefault()}
                            className="pointer-events-auto h-11 w-auto"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M5.53117 1.60618C4.66159 0.905113 3.50574 0.804068 2.54612 1.34525C1.5865 1.88643 0.987916 2.97682 1.00019 4.16132C1.09112 12.9259 1.25306 28.5232 1.32189 35.1561C1.34264 37.16 2.0724 39.0764 3.35689 40.5001C5.41092 42.7769 8.58118 46.2909 10.5866 48.5138C11.7865 49.8439 13.4157 50.6004 15.1206 50.6191C22.0847 50.696 40.9086 50.9037 49.6201 50.9999C50.2228 51.0066 50.7583 50.5786 50.9379 49.9469C51.1174 49.3151 50.8987 48.6287 50.3995 48.2577C46.666 45.4829 41.1268 41.3661 38.4841 39.402C37.5005 38.6711 36.3402 38.2804 35.1526 38.2804H20.4005C18.7488 38.2804 17.1662 37.552 16.0081 36.2588C14.85 34.9656 14.2133 33.2158 14.241 31.4023C14.2415 31.3751 14.2419 31.348 14.2423 31.3207C14.2995 27.5856 17.0733 24.5905 20.4753 24.5905C23.3468 24.5905 26.7124 24.5905 29.373 24.5905C30.0344 24.5905 30.6208 24.1239 30.8267 23.4338C31.0326 22.7438 30.8114 21.9865 30.2783 21.5568C24.1739 16.6355 12.1324 6.92805 5.53117 1.60618Z"
                                className="fill-[#2816FF] dark:fill-[#A6A6A6]"
                            />
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.53117 0.606182C3.66159 -0.094887 2.50574 -0.195932 1.54612 0.34525C0.586495 0.886432 -0.0120842 1.97682 0.000185082 3.16132C0.0911224 11.9259 0.253058 27.5232 0.321892 34.1561C0.342642 36.16 1.0724 38.0764 2.35689 39.5001C4.41092 41.7769 7.58118 45.2909 9.58659 47.5138C10.7865 48.8439 12.4157 49.6004 14.1206 49.6191C21.0847 49.696 39.9086 49.9037 48.6201 49.9999C49.2228 50.0066 49.7583 49.5786 49.9379 48.9469C50.1174 48.3151 49.8987 47.6287 49.3995 47.2577C45.666 44.4829 40.1268 40.3661 37.4841 38.402C36.5005 37.6711 35.3402 37.2804 34.1526 37.2804H19.4005C17.7488 37.2804 16.1662 36.552 15.0081 35.2588C13.85 33.9656 13.2133 32.2158 13.241 30.4023C13.2415 30.3751 13.2419 30.348 13.2423 30.3207C13.2995 26.5856 16.0733 23.5905 19.4753 23.5905C22.3468 23.5905 25.7124 23.5905 28.373 23.5905C29.0344 23.5905 29.6208 23.1239 29.8267 22.4338C30.0326 21.7438 29.8114 20.9865 29.2783 20.5568C23.1739 15.6355 11.1324 5.92805 4.53117 0.606182Z"
                                className="fill-[#0170FF] dark:fill-white"
                            />
                        </svg>
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
            </div>
        </>
    );
}

VerifyEmail.layout = (page: React.ReactNode) => page;
