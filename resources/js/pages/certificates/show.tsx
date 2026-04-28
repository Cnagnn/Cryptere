import { Head, Link } from '@inertiajs/react';
import {
    Award,
    Calendar,
    CheckCircle,
    Copy,
    ExternalLink,
    GraduationCap,
    Share2,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Props = {
    certificate: {
        id: number;
        certificate_number: string;
        verification_code: string;
        issued_at: string;
        course: {
            title: string;
            slug: string;
            category: string | null;
            estimated_minutes: number;
        };
        user: {
            name: string;
            username: string | null;
        };
        verification_url: string;
    };
};

export default function CertificateShow({ certificate }: Props) {
    const [copied, setCopied] = useState(false);

    async function copyVerificationUrl() {
        await navigator.clipboard.writeText(certificate.verification_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function shareUrl() {
        if (navigator.share) {
            await navigator.share({
                title: `Certificate: ${certificate.course.title}`,
                text: `${certificate.user.name} completed ${certificate.course.title} on Crypter!`,
                url: certificate.verification_url,
            });
        } else {
            await copyVerificationUrl();
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Certificates', href: '/certificates' },
                { title: certificate.certificate_number, href: '#' },
            ]}
        >
            <Head title={`Certificate - ${certificate.course.title}`} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Award className="size-6 text-primary" />
                        <TypographyH1>Certificate</TypographyH1>
                    </div>
                    <TypographyMuted>
                        Proof of completion for {certificate.course.title}
                    </TypographyMuted>
                </section>

                {/* Certificate Card */}
                <Card className="mx-auto w-full max-w-2xl overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <GraduationCap className="size-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Certificate of Completion
                                </p>
                                <h2 className="mt-1 text-2xl font-bold">
                                    {certificate.course.title}
                                </h2>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    This certifies that
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    {certificate.user.name}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                has successfully completed the course
                            </p>
                            {certificate.course.category && (
                                <Badge variant="secondary">
                                    {certificate.course.category}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <CardContent className="flex flex-col gap-4 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">
                                    Certificate Number
                                </p>
                                <p className="font-mono font-medium">
                                    {certificate.certificate_number}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Date Issued
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

                        <Separator />

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyVerificationUrl}
                            >
                                {copied ? (
                                    <CheckCircle
                                        className="size-4"
                                        data-icon
                                    />
                                ) : (
                                    <Copy className="size-4" data-icon />
                                )}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={shareUrl}
                            >
                                <Share2 className="size-4" data-icon />
                                Share
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={certificate.verification_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink
                                        className="size-4"
                                        data-icon
                                    />
                                    Verify
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
