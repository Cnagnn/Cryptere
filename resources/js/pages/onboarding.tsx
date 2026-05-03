import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Key,
    Lock,
    Rocket,
    Shield,
    Sparkles,
    Target,
    Trophy,
    Zap,
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
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { complete, skip } from '@/routes/onboarding';

type Props = {
    userName: string;
    userEmail: string;
    hasAvatar: boolean;
};

const INTERESTS = [
    { id: 'symmetric', label: 'Enkripsi Simetris', icon: Key },
    { id: 'asymmetric', label: 'Enkripsi Asimetris', icon: Lock },
    { id: 'hashing', label: 'Fungsi Hash', icon: Shield },
    { id: 'protocols', label: 'Protokol Keamanan', icon: Zap },
    { id: 'applied', label: 'Kriptografi Terapan', icon: Target },
] as const;

const EXPERIENCE_LEVELS = [
    {
        value: 'beginner',
        label: 'Pemula',
        description: 'Saya baru mengenal kriptografi',
        icon: Sparkles,
    },
    {
        value: 'intermediate',
        label: 'Menengah',
        description: 'Saya mengetahui dasar-dasarnya dan ingin lebih mendalam',
        icon: BookOpen,
    },
    {
        value: 'advanced',
        label: 'Lanjutan',
        description: 'Saya memiliki fondasi yang kuat dan ingin menguasainya',
        icon: GraduationCap,
    },
] as const;

// ── Step 1: Welcome ──
function WelcomeStep({ userName }: { userName: string }) {
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="size-10 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    Selamat datang di Crypter, {userName}! 🎉
                </h2>
                <p className="text-muted-foreground">
                    Anda akan memulai perjalanan yang menarik ke dunia
                    kriptografi. Mari personalisasi pengalaman Anda hanya dalam
                    beberapa langkah.
                </p>
            </div>
            <div className="grid w-full max-w-sm grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
                    <BookOpen className="size-5 text-blue-500" />
                    <span className="text-xs font-medium">
                        Kursus Interaktif
                    </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
                    <Trophy className="size-5 text-amber-500" />
                    <span className="text-xs font-medium">Raih Pencapaian</span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
                    <Target className="size-5 text-emerald-500" />
                    <span className="text-xs font-medium">Lab Interaktif</span>
                </div>
            </div>
        </div>
    );
}

// ── Step 2: Experience Level ──
function ExperienceStep({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                    Apa tingkat pengalaman Anda?
                </h2>
                <p className="mt-1 text-muted-foreground">
                    Ini membantu kami merekomendasikan titik awal yang tepat
                    untuk Anda.
                </p>
            </div>
            <RadioGroup
                value={value}
                onValueChange={onChange}
                className="flex flex-col gap-3"
            >
                {EXPERIENCE_LEVELS.map((level) => {
                    const Icon = level.icon;

                    return (
                        <Label
                            key={level.value}
                            htmlFor={level.value}
                            className={cn(
                                'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent',
                                value === level.value &&
                                    'border-primary bg-primary/5',
                            )}
                        >
                            <RadioGroupItem
                                value={level.value}
                                id={level.value}
                            />
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Icon className="size-5" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-medium">
                                    {level.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {level.description}
                                </span>
                            </div>
                        </Label>
                    );
                })}
            </RadioGroup>
        </div>
    );
}

// ── Step 3: Interests ──
function InterestsStep({
    selected,
    onToggle,
}: {
    selected: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                    Apa yang paling menarik bagi Anda?
                </h2>
                <p className="mt-1 text-muted-foreground">
                    Pilih topik yang ingin Anda jelajahi. Anda selalu dapat
                    mengubah ini nanti.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {INTERESTS.map((interest) => {
                    const Icon = interest.icon;
                    const isSelected = selected.includes(interest.id);

                    return (
                        <button
                            key={interest.id}
                            type="button"
                            onClick={() => onToggle(interest.id)}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent',
                                isSelected && 'border-primary bg-primary/5',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted',
                                )}
                            >
                                <Icon className="size-5" />
                            </div>
                            <span className="font-medium">
                                {interest.label}
                            </span>
                            {isSelected && (
                                <Badge variant="secondary" className="ml-auto">
                                    Dipilih
                                </Badge>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const TOTAL_STEPS = 3;

export default function Onboarding({ userName }: Props) {
    const [step, setStep] = useState(0);
    const [experienceLevel, setExperienceLevel] = useState('beginner');
    const [interests, setInterests] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    function toggleInterest(id: string) {
        setInterests((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    }

    function handleComplete() {
        setSubmitting(true);
        router.post(
            complete.url(),
            {
                experience_level: experienceLevel,
                interests,
            },
            {
                onFinish: () => setSubmitting(false),
            },
        );
    }

    function handleSkip() {
        setSubmitting(true);
        router.post(
            skip.url(),
            {},
            {
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <>
            <Head title="Selamat Datang di Crypter" />

            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardDescription>
                                Langkah {step + 1} dari {TOTAL_STEPS}
                            </CardDescription>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSkip}
                                disabled={submitting}
                            >
                                Lewati
                            </Button>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        {step === 0 && <WelcomeStep userName={userName} />}
                        {step === 1 && (
                            <ExperienceStep
                                value={experienceLevel}
                                onChange={setExperienceLevel}
                            />
                        )}
                        {step === 2 && (
                            <InterestsStep
                                selected={interests}
                                onToggle={toggleInterest}
                            />
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep((s) => s - 1)}
                                disabled={step === 0}
                            >
                                <ChevronLeft className="size-4" data-icon />
                                Kembali
                            </Button>

                            {step < TOTAL_STEPS - 1 ? (
                                <Button onClick={() => setStep((s) => s + 1)}>
                                    Selanjutnya
                                    <ChevronRight
                                        className="size-4"
                                        data-icon
                                    />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleComplete}
                                    disabled={submitting}
                                >
                                    <Rocket className="size-4" data-icon />
                                    Mulai
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
