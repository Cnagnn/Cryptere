import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent } from '@/components/ui/card';
import { register } from '@/routes';

export default function Terms() {
    return (
        <>
            <Head title="Ketentuan Layanan">
                <meta
                    name="description"
                    content="Ketentuan layanan Cryptere — aturan dasar penggunaan platform pembelajaran cybersecurity: tanggung jawab akun, penggunaan etis, dan perubahan layanan."
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
                                Ketentuan Layanan
                            </h1>
                            <p className="text-muted-foreground">
                                Ketentuan ini menjelaskan aturan dasar
                                penggunaan platform pembelajaran Cryptere.
                            </p>
                        </div>
                    </header>

                    <Card>
                        <CardContent className="space-y-6 p-6 leading-7 text-muted-foreground">
                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    1. Penggunaan Akun
                                </h2>
                                <p>
                                    Anda bertanggung jawab menjaga keamanan
                                    akun, kata sandi, dan aktivitas yang terjadi
                                    melalui akun Anda.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    2. Aktivitas Pembelajaran
                                </h2>
                                <p>
                                    Cryptere disediakan untuk pembelajaran
                                    kriptografi secara etis. Dilarang
                                    menggunakan materi, lab, atau fitur platform
                                    untuk aktivitas yang melanggar hukum.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    3. Perubahan Layanan
                                </h2>
                                <p>
                                    Kami dapat memperbarui fitur, materi, atau
                                    ketentuan layanan dari waktu ke waktu untuk
                                    meningkatkan pengalaman belajar.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
