import { Head, Link } from '@inertiajs/react';
import { Award, ExternalLink, GraduationCap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { show as certificateShow } from '@/routes/certificates';

type CertificateItem = {
    id: number;
    certificate_number: string;
    issued_at: string;
    course: {
        title: string;
        slug: string;
        category: string | null;
        estimated_minutes: number;
    };
    verification_url: string;
};

type Props = {
    certificates: CertificateItem[];
};

export default function CertificatesIndex({ certificates }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dasbor', href: '/dashboard' },
                { title: 'Sertifikat', href: '/certificates' },
            ]}
        >
            <Head title="Sertifikat Saya" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="size-6 text-primary" />
                        <TypographyH1>Sertifikat Saya</TypographyH1>
                    </div>
                    <TypographyMuted>
                        Sertifikat yang diperoleh dari kursus yang diselesaikan.
                    </TypographyMuted>
                </section>

                {certificates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <Award className="size-12 text-muted-foreground/40" />
                            <div>
                                <p className="font-medium">
                                    Belum ada sertifikat
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Selesaikan kursus untuk mendapatkan sertifikat pertama Anda!
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/courses" prefetch>
                                    Jelajahi Kursus
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {certificates.length} Sertifikat
                            </CardTitle>
                            <CardDescription>
                                Klik sertifikat untuk melihat detail dan membagikannya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kursus</TableHead>
                                        <TableHead>Sertifikat #</TableHead>
                                        <TableHead>Diterbitkan</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {certificates.map((cert) => (
                                        <TableRow key={cert.id}>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium">
                                                        {cert.course.title}
                                                    </span>
                                                    {cert.course.category && (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit"
                                                        >
                                                            {
                                                                cert.course
                                                                    .category
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {cert.certificate_number}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    cert.issued_at,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={certificateShow.url(
                                                            {
                                                                certificate:
                                                                    cert.id,
                                                            },
                                                        )}
                                                        prefetch
                                                    >
                                                        <ExternalLink
                                                            className="size-3"
                                                            data-icon
                                                        />
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
