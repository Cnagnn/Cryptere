import { Head, usePage } from '@inertiajs/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { useAppUrls } from '@/hooks/use-app-urls';
import type { Auth } from '@/types/auth';

type WelcomeProps = {
    canRegister?: boolean;
};

type Hero115Props = {
    heading: string;
    description: string;
    button: {
        text: string;
        url: string;
        icon?: React.ReactNode;
    };
    byline?: string;
    image: {
        src: string;
        alt: string;
        srcDark?: string;
    };
    icon?: React.ReactNode;
};

function Hero115({
    icon = <ShieldCheck className="size-6" />,
    heading,
    description,
    button,
    byline,
    image,
}: Hero115Props) {
    return (
        <section className="overflow-hidden py-32">
            <div className="container mx-auto">
                <div className="flex flex-col gap-5">
                    <div className="relative isolate flex flex-col gap-5">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 mx-auto size-200 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border mask-[linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] p-16 [-webkit-mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-325 md:p-32"
                        >
                            <div className="size-full rounded-full border border-border p-16 md:p-32">
                                <div className="size-full rounded-full border border-border" />
                            </div>
                        </div>
                        <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
                            {icon}
                        </span>
                        <h1 className="mx-auto max-w-xl text-center text-4xl font-semibold text-pretty md:text-5xl lg:max-w-3xl lg:text-6xl">
                            {heading}
                        </h1>
                        <p className="mx-auto max-w-5xl text-center text-lg text-balance text-muted-foreground md:text-xl">
                            {description}
                        </p>
                        <div className="flex flex-col items-center gap-3 pt-3 pb-12">
                            <Button
                                size="lg"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <a href={button.url}>
                                    {button.text}
                                    {button.icon ?? (
                                        <ArrowRight data-icon="inline-end" />
                                    )}
                                </a>
                            </Button>
                            {byline && (
                                <div className="text-center text-sm text-muted-foreground">
                                    {byline}
                                </div>
                            )}
                        </div>
                    </div>
                    {image.srcDark ? (
                        <>
                            <img
                                src={image.src}
                                alt={image.alt}
                                className="mx-auto aspect-3/4 h-full max-h-131 w-full max-w-5xl rounded-lg border border-border object-cover object-top-left md:aspect-video md:object-top dark:hidden"
                            />
                            <img
                                src={image.srcDark}
                                alt={image.alt}
                                className="mx-auto hidden aspect-3/4 h-full max-h-131 w-full max-w-5xl rounded-lg border border-border object-cover object-top-left md:aspect-video md:object-top dark:block"
                            />
                        </>
                    ) : (
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="mx-auto aspect-3/4 h-full max-h-131 w-full max-w-5xl rounded-lg border border-border object-cover object-top-left md:aspect-video md:object-top"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

export default function Welcome({ canRegister = true }: WelcomeProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const urls = useAppUrls();
    const ctaHref = auth.user ? urls.dashboard : urls.login;
    const ctaLabel = auth.user ? 'Buka dasbor' : 'Mulai belajar';
    const ctaByline = auth.user
        ? 'Lanjutkan progres Anda dari dasbor.'
        : canRegister
          ? 'Daftar gratis untuk memulai modul dasar.'
          : 'Masuk untuk mulai mempelajari kriptografi.';

    return (
        <>
            <Head title="Selamat Datang">
                <meta
                    name="description"
                    content="Cryptere — platform pembelajaran cybersecurity Indonesia: kursus terstruktur, lab interaktif, dan progres yang jelas untuk naik level dengan cepat."
                />
                <meta property="og:title" content="Cryptere" />
                <meta
                    property="og:description"
                    content="Platform pembelajaran cybersecurity Indonesia. Kursus, lab, dan komunitas dalam satu tempat."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://cryptere.com/" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="theme-color" content="#0a0a0a" />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.2),transparent_40%)]" />

                <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8">
                    <header className="flex items-center justify-between gap-4">
                        <a href={auth.user ? urls.dashboard : urls.login}>
                            <div className="flex items-center select-none">
                                <AppLogo className="pointer-events-auto h-8 w-auto" />
                            </div>
                        </a>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <a href={urls.dashboard}>Dasbor</a>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <a href={urls.login}>Masuk</a>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild>
                                            <a href={urls.register}>Daftar</a>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    <main className="flex flex-1 items-center justify-center py-8 md:py-12">
                        <Hero115
                            icon={<ShieldCheck className="size-6" />}
                            heading="Pelajari kriptografi lewat praktik yang terarah"
                            description="Cryptere menggabungkan kursus terstruktur, laboratorium interaktif, dan progres yang jelas untuk membantu Anda naik level dengan cepat."
                            button={{
                                text: ctaLabel,
                                url: ctaHref,
                                icon: <ArrowRight data-icon="inline-end" />,
                            }}
                            byline={ctaByline}
                            image={{
                                src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9.png',
                                srcDark:
                                    'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9-dark.png',
                                alt: 'Tampilan hero platform pembelajaran Crypter',
                            }}
                        />
                    </main>
                </div>
            </div>
        </>
    );
}
