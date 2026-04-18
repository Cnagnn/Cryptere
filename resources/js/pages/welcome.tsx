import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    FlaskConical,
    ShieldCheck,
    Swords,
    Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { dashboard, login, register } from '@/routes';
import type { Auth } from '@/types/auth';

type WelcomeProps = {
    canRegister?: boolean;
};

type ModuleItem = {
    title: string;
    description: string;
    icon: LucideIcon;
};

type MilestoneItem = {
    label: string;
    value: string;
};

const modules: ModuleItem[] = [
    {
        title: 'Structured courses',
        description: 'Learn concepts step-by-step with guided lesson progress.',
        icon: BookOpenCheck,
    },
    {
        title: 'Standalone challenges',
        description: 'Sharpen intuition with practical cryptography prompts.',
        icon: Swords,
    },
    {
        title: 'Global leaderboard',
        description:
            'Track points and compare your growth with other learners.',
        icon: Trophy,
    },
    {
        title: 'Interactive labs',
        description:
            'Practice Caesar, Vigenere, hashing, and signature concepts.',
        icon: FlaskConical,
    },
];

const milestones: MilestoneItem[] = [
    { label: 'Main modules', value: '6' },
    { label: 'Hands-on focus', value: '100%' },
    { label: 'Client labs', value: 'Realtime' },
];

export default function Welcome({ canRegister = true }: WelcomeProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const ctaHref = auth.user ? dashboard() : login();
    const ctaLabel = auth.user ? 'Open dashboard' : 'Start learning';

    return (
        <>
            <Head title="Welcome" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.2),transparent_40%)]" />

                <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8">
                    <header className="flex items-center justify-between gap-4">
                        <Link href={auth.user ? dashboard() : login()} prefetch>
                            <AppLogo />
                        </Link>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()} prefetch>
                                        Dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href={login()} prefetch>
                                            Log in
                                        </Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild>
                                            <Link href={register()} prefetch>
                                                Register
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    <main className="mt-10 grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <section className="flex flex-col gap-6">
                            <Badge variant="secondary" className="w-fit">
                                Cryptography learning platform
                            </Badge>

                            <div className="flex flex-col gap-3">
                                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                                    Learn cryptography through structured
                                    courses, challenges, and interactive labs.
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Crypter brings together structured learning,
                                    hands-on practice, and real-world security
                                    concept simulations in one focused
                                    outcome-driven flow.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button size="lg" asChild>
                                    <Link href={ctaHref} prefetch>
                                        {ctaLabel}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>

                                {!auth.user && canRegister && (
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href={register()} prefetch>
                                            Create account
                                        </Link>
                                    </Button>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {milestones.map((item) => (
                                    <Card key={item.label}>
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                {item.label}
                                            </CardDescription>
                                            <CardTitle className="text-2xl">
                                                {item.value}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-4">
                            <Card className="border-primary/30">
                                <CardHeader>
                                    <div className="inline-flex w-fit items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-sm/5 font-medium text-primary">
                                        <ShieldCheck className="size-3.5" />
                                        Learning tracks
                                    </div>
                                    <CardTitle>
                                        Learning tracks for your main sprint
                                    </CardTitle>
                                    <CardDescription>
                                        Each module is designed to build
                                        conceptual understanding and practical
                                        readiness.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    {modules.map((module) => (
                                        <div
                                            key={module.title}
                                            className="rounded-lg border bg-background/70 p-3"
                                        >
                                            <div className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                                                <module.icon className="size-4" />
                                                {module.title}
                                            </div>
                                            <p className="text-sm/6 text-muted-foreground">
                                                {module.description}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>How it flows</CardTitle>
                                    <CardDescription>
                                        Start with foundations, advance to
                                        challenges, then validate your knowledge
                                        in labs.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                                    <p>1. Enroll in a relevant course.</p>
                                    <Separator />
                                    <p>2. Complete lessons to collect XP.</p>
                                    <Separator />
                                    <p>
                                        3. Earn points through standalone
                                        challenges.
                                    </p>
                                    <Separator />
                                    <p>
                                        4. Train your intuition in interactive
                                        client-side labs.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>
                    </main>

                    <footer className="mt-8 flex flex-col gap-3">
                        <Separator />
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                            <span>
                                Built with Laravel, Inertia, React, and
                                shadcn/ui.
                            </span>
                            <div className="flex items-center gap-3">
                                <a
                                    href="https://laravel.com/docs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-colors hover:text-foreground"
                                >
                                    Laravel docs
                                </a>
                                <a
                                    href="https://inertiajs.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-colors hover:text-foreground"
                                >
                                    Inertia docs
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
