import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent } from '@/components/ui/card';
import { register } from '@/routes';

export default function Privacy() {
    return (
        <>
            <Head title="Kebijakan Privasi">
                <meta
                    name="description"
                    content="Kebijakan privasi Cryptere — ringkasan cara platform mengelola data pengguna: data yang dikumpulkan, penggunaan data, dan langkah keamanan."
                />
                <meta name="robots" content="noindex,follow" />
            </Head>

            <main className="min-h-screen bg-background px-6 py-10 text-foreground">
                <div className="mx-auto max-w-3xl space-y-8">
                    <header className="space-y-6">
                        <Link
                            href={register()}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke daftar
                        </Link>

                        <div className="flex items-center gap-3">
                            <AppLogoIcon className="size-10" />
                            <span className="text-2xl font-semibold">
                                Cryptere
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Kebijakan Privasi
                            </h1>
                            <p className="text-muted-foreground">
                                Kebijakan ini menjelaskan ringkasan cara
                                Cryptere mengelola data pengguna untuk kebutuhan
                                akun dan pembelajaran.
                            </p>
                        </div>
                    </header>

                    <Card>
                        <CardContent className="space-y-6 p-6 leading-7 text-muted-foreground">
                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    1. Data yang Dikumpulkan
                                </h2>
                                <p>
                                    Kami mengumpulkan data akun seperti nama,
                                    username, email, serta data progres belajar
                                    yang diperlukan agar fitur platform berjalan
                                    dengan baik.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    2. Penggunaan Data
                                </h2>
                                <p>
                                    Data digunakan untuk autentikasi,
                                    personalisasi pengalaman belajar, pencatatan
                                    progres, keamanan akun, dan peningkatan
                                    kualitas layanan.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    3. Keamanan
                                </h2>
                                <p>
                                    Kami menerapkan langkah keamanan yang wajar
                                    untuk melindungi akun dan data pengguna.
                                    Jangan membagikan kata sandi atau akses akun
                                    kepada pihak lain.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
