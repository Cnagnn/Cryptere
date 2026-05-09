import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Calendar, CheckCircle, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Props = {
    valid: boolean;
    certificate: {
        certificate_number: string;
        issued_at: string;
        course_title: string;
        user_name: string;
    } | null;
};

export default function CertificateVerify({ valid, certificate }: Props) {
    return (
        <>
            <Head title="Verifikasi Sertifikat" />

            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
                            <Shield className="size-7 text-primary" />
                        </div>
                        <CardTitle>Verifikasi Sertifikat</CardTitle>
                        <CardDescription>
                            Platform Pembelajaran Cryptere
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {valid && certificate ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    <CheckCircle className="size-5 shrink-0" />
                                    <span className="text-sm font-medium">
                                        Sertifikat ini valid dan terverifikasi.
                                    </span>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Penerima
                                        </p>
                                        <p className="font-medium">
                                            {certificate.user_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Kursus
                                        </p>
                                        <p className="font-medium">
                                            {certificate.course_title}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Nomor Sertifikat
                                        </p>
                                        <p className="font-mono font-medium">
                                            {certificate.certificate_number}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Tanggal Terbit
                                        </p>
                                        <p className="flex items-center gap-1 font-medium">
                                            <Calendar className="size-3" />
                                            {new Date(
                                                certificate.issued_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-4 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                                    <AlertTriangle className="size-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Sertifikat Tidak Ditemukan
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Tautan verifikasi ini tidak valid atau
                                        sertifikat tidak ada.
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href="/">Ke Beranda</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
