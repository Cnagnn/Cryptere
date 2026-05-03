import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Home,
    Lock,
    ServerCrash,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type ErrorPageProps = {
    status: number;
    message?: string;
};

type ErrorConfig = {
    title: string;
    description: string;
    icon: LucideIcon;
};

const errorConfigs: Record<number, ErrorConfig> = {
    403: {
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
        icon: Lock,
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description: 'Halaman yang Anda cari tidak dapat ditemukan.',
        icon: AlertTriangle,
    },
    500: {
        title: 'Kesalahan Server',
        description:
            'Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti.',
        icon: ServerCrash,
    },
    503: {
        title: 'Dalam Pemeliharaan',
        description:
            'Kami sedang melakukan pemeliharaan. Silakan periksa kembali nanti.',
        icon: Wrench,
    },
};

const defaultConfig: ErrorConfig = {
    title: 'Kesalahan',
    description: 'Terjadi kesalahan yang tidak terduga.',
    icon: AlertTriangle,
};

export default function ErrorPage({ status, message }: ErrorPageProps) {
    const config = errorConfigs[status] ?? defaultConfig;
    const Icon = config.icon;

    return (
        <>
            <Head title={`${status} — ${config.title}`} />

            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader className="pb-4">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                            <Icon className="size-8 text-muted-foreground" />
                        </div>
                        <p className="text-5xl font-bold tracking-tight text-foreground">
                            {status}
                        </p>
                        <CardTitle className="text-xl">
                            {config.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {message ?? config.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="size-4" />
                            Kembali
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/">
                                <Home className="size-4" />
                                Beranda
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
