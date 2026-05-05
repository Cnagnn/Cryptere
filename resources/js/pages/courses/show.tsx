import { Head, router, usePage } from '@inertiajs/react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { saveAnswer as saveAssessmentAnswer, start as startAssessment, submit as submitAssessment } from '@/routes/assessments';
import { enroll as enrollCourse, index as coursesIndex, show as showCourse } from '@/routes/courses';
import { complete as completeLesson, quiz as submitQuizRoute } from '@/routes/courses/lessons';
import type { Auth } from '@/types/auth';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ClipboardCheck,
    Download,
    FileText,
    Loader2,
    Lock,
    MessageSquare,
    PlayCircle,
    RotateCcw,
    Sparkles,
    Target,
    Trophy,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

type PlayerSource = { kind: 'youtube' | 'vimeo'; embedId: string } | { kind: 'file'; src: string } | { kind: 'unsupported' };
type VideoProcessingStatus = 'pending' | 'processing' | 'ready' | 'converted' | 'failed' | null;
type TaskType = 'video' | 'read' | 'reading' | 'quiz';

type QuizSubmission = {
    answers?: unknown;
    score: number;
    total: number;
    results: Array<{ correct: boolean; explanation: string | null }>;
    xpEarned?: number;
    pointsEarned?: number;
    attemptNumber?: number;
    xpMultiplier?: number;
    bestScore?: number;
    bestTotal?: number;
    canRetry?: boolean;
};

type LessonQuizQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    explanation: string;
};

type LessonTask = {
    id: number;
    type: Exclude<TaskType, 'reading'>;
    title: string;
    description: string;
    minutes: number;
    videoUrl: string | null;
    videoProcessingStatus: string | null;
    pdfUrl: string | null;
    pdfName: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    isCompleted: boolean;
    quizQuestions: LessonQuizQuestion[];
    submission: QuizSubmission | null;
};

type LessonData = {
    id: number;
    title: string;
    summary: string;
    tasks: LessonTask[];
};

type ServerTaskQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    explanation: string | null;
};

type ServerTask = {
    taskId: number | null;
    type: TaskType;
    title: string;
    minutes: number;
    videoUrl: string | null;
    videoProcessingStatus: string | null;
    documentName: string | null;
    conversionStatus: string | null;
    pdfUrl: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    isCompleted?: boolean;
    questions: ServerTaskQuestion[];
    questionCount: number;
    submission: QuizSubmission | null;
};

type ServerLesson = {
    id: number;
    slug: string;
    title: string;
    position: number;
    content: string;
    tasks: ServerTask[];
    isCompleted: boolean;
    isUnlocked: boolean;
};

type ServerCourse = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    estimatedMinutes: number;
    enrollmentCount: number;
};

type AssessmentQuestion = {
    id: number;
    bloomLevel?: string | null;
    questionType: 'multiple_choice' | 'essay' | string;
    questionText: string;
    options?: string[] | null;
    points: number;
    gradingType?: string | null;
    minWords?: number | null;
    maxWords?: number | null;
    sortOrder?: number | null;
};

type AssessmentFullData = {
    id: number;
    slug: string;
    title: string;
    description?: string | null;
    bloomLevel?: string | null;
    bloomLabel?: string | null;
    gradingType?: string | null;
    passingScore: number;
    maxAttempts?: number | null;
    timeLimitMinutes?: number | null;
    questionsCount?: number | null;
    totalPoints?: number | null;
    bestScore?: number | null;
    passed: boolean;
    attemptCount?: number | null;
    canAttempt?: boolean;
    isLocked?: boolean;
    questions: AssessmentQuestion[];
    activeSubmission?: {
        id: number;
        attemptNumber: number;
        startedAt: string;
        answers?: Record<number, { selected_option?: number; answer_text?: string }>;
    } | null;
    pastSubmissions?: Array<{
        id: number;
        attemptNumber: number;
        status: string;
        totalScore: number | null;
        passed: boolean | null;
        submittedAt: string | null;
        gradedAt: string | null;
    }>;
    latestResults?: {
        submission: {
            id: number;
            attemptNumber: number;
            status: string;
            totalScore: number | null;
            pointsEarned: number | null;
            pointsPossible: number | null;
            passed: boolean;
            submittedAt: string | null;
            gradedAt: string | null;
            overallFeedback?: string | null;
            graderName?: string | null;
        };
        answers: Array<{
            id: number;
            questionId: number;
            questionText: string;
            questionType: string;
            bloomLevel?: string | null;
            answerText?: string | null;
            selectedOption?: number | null;
            isCorrect?: boolean | null;
            pointsAwarded?: number | null;
            maxPoints?: number | null;
            feedback?: string | null;
            explanation?: string | null;
            correctAnswer?: string | null;
        }>;
    } | null;
};

type EnrollmentData = { progressPercentage: number | string; completedAt: string | null } | null;
type Props = { course: ServerCourse; lessons: ServerLesson[]; enrollment: EnrollmentData; assessments: AssessmentFullData[] };
type ActiveContent = { mode: 'task'; lesson: LessonData; task: LessonTask } | { mode: 'assessment'; assessment: AssessmentFullData } | null;

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function resolvePlayerSource(url: string): PlayerSource {
    try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.toLowerCase();

        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            const embedId = parsedUrl.searchParams.get('v') ?? parsedUrl.pathname.split('/').filter(Boolean).pop();

            return embedId ? { kind: 'youtube', embedId } : { kind: 'unsupported' };
        }

        if (host.includes('vimeo.com')) {
            const embedId = parsedUrl.pathname.split('/').filter(Boolean).pop();

            return embedId ? { kind: 'vimeo', embedId } : { kind: 'unsupported' };
        }

        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            return { kind: 'file', src: url };
        }
    } catch {
        return { kind: 'unsupported' };
    }

    return { kind: 'unsupported' };
}

function defaultTaskDescription(type: TaskType): string {
    if (type === 'video') {
        return 'Tonton video hingga selesai untuk menyelesaikan tugas ini.';
    }

    if (type === 'read' || type === 'reading') {
        return 'Baca materi dan catat poin-poin penting.';
    }

    return 'Selesaikan kuis untuk menguji pemahaman Anda sebelum melanjutkan.';
}

function normalizeTaskTitle(title: string): string {
    return title.replace(/^(video|quiz|read|reading)\s*:\s*/i, '').trim();
}

function normalizeTaskType(type: TaskType): Exclude<TaskType, 'reading'> {
    return type === 'reading' ? 'read' : type;
}

function mapLessons(serverLessons: ServerLesson[]): LessonData[] {
    return serverLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.content?.trim() || 'Belum ada ringkasan materi.',
        tasks: lesson.tasks.map((task, index) => {
            const type = normalizeTaskType(task.type);

            return {
                id: task.taskId ?? lesson.id * 1000 + index + 1,
                type,
                title: normalizeTaskTitle(task.title),
                description: defaultTaskDescription(type),
                minutes: task.minutes,
                videoUrl: task.videoUrl,
                videoProcessingStatus: task.videoProcessingStatus ?? null,
                pdfUrl: task.pdfUrl,
                pdfName: task.documentName,
                isPublished: task.isPublished,
                publishedAt: task.publishedAt,
                isCompleted: task.isCompleted ?? false,
                quizQuestions: task.questions.map((question) => ({
                    id: question.id,
                    question: question.question,
                    options: question.options,
                    explanation: question.explanation ?? 'Penjelasan tersedia setelah kuis dikirim.',
                })),
                submission: task.submission ?? null,
            };
        }),
    }));
}

function taskIcon(type: LessonTask['type']): LucideIcon {
    if (type === 'video') {
        return PlayCircle;
    }

    if (type === 'quiz') {
        return ClipboardCheck;
    }

    return BookOpen;
}

function taskLabel(type: LessonTask['type']): string {
    if (type === 'video') {
        return 'Video';
    }

    if (type === 'quiz') {
        return 'Quiz';
    }

    return 'Reading';
}

function formatMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatClock(seconds: number): string {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;

    return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

async function markTaskComplete(courseSlug: string, lessonId: number, taskId: number): Promise<void> {
    const response = await fetch(completeLesson.url({ course: courseSlug, lesson: lessonId }), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({ task_id: taskId }),
        credentials: 'same-origin',
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Failed to save progress');
    }

    toast.success(data.message || 'Progress tersimpan.');
}

function submittedQuizAnswers(submission: QuizSubmission | null, questions: LessonQuizQuestion[]): number[] {
    const empty = questions.map(() => -1);

    if (!submission?.answers) {
        return empty;
    }

    if (Array.isArray(submission.answers)) {
        const answers = [...empty];

        submission.answers.forEach((answer) => {
            if (!answer || typeof answer !== 'object') {
                return;
            }

            const payload = answer as { question_id?: number; questionId?: number; answer?: number };
            const questionId = payload.question_id ?? payload.questionId;
            const questionIndex = questions.findIndex((question) => question.id === questionId);

            if (questionIndex !== -1 && typeof payload.answer === 'number') {
                answers[questionIndex] = payload.answer;
            }
        });

        return answers;
    }

    return empty;
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-4" />
                {label}
            </div>
            <p className="mt-1 text-lg leading-tight font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
    );
}

function VideoTask({ courseSlug, lessonId, task, onComplete }: { courseSlug: string; lessonId: number; task: LessonTask; onComplete: () => void }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Plyr | null>(null);
    const completionSentRef = useRef(false);
    const source = useMemo(() => resolvePlayerSource(task.videoUrl ?? ''), [task.videoUrl]);
    const status = task.videoProcessingStatus as VideoProcessingStatus;
    const isWaiting = status === 'pending' || status === 'processing';

    useEffect(() => {
        const container = containerRef.current;

        if (!container || source.kind === 'unsupported' || isWaiting || status === 'failed') {
            return;
        }

        container.innerHTML = '';
        let player: Plyr | null = null;

        try {
            if (source.kind === 'youtube' || source.kind === 'vimeo') {
                const target = document.createElement('div');
                target.setAttribute('data-plyr-provider', source.kind);
                target.setAttribute('data-plyr-embed-id', source.embedId);
                container.appendChild(target);
                player = new Plyr(target);
            }

            if (source.kind === 'file') {
                const video = document.createElement('video');
                video.controls = true;
                video.playsInline = true;
                const sourceElement = document.createElement('source');
                sourceElement.src = source.src;
                sourceElement.type = 'video/mp4';
                video.appendChild(sourceElement);
                container.appendChild(video);
                player = new Plyr(video);
            }

            if (player) {
                playerRef.current = player;
                player.on('ended', async () => {
                    if (completionSentRef.current) {
                        return;
                    }

                    completionSentRef.current = true;

                    try {
                        await markTaskComplete(courseSlug, lessonId, task.id);
                        onComplete();
                    } catch (error) {
                        completionSentRef.current = false;
                        toast.error(error instanceof Error ? error.message : 'Gagal menyimpan progress.');
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initialize video player:', error);
        }

        return () => {
            playerRef.current?.destroy();
            playerRef.current = null;
            container.innerHTML = '';
        };
    }, [courseSlug, isWaiting, lessonId, onComplete, source, status, task.id]);

    if (isWaiting) {
        return (
            <Card className="overflow-hidden">
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>{task.title}</CardTitle>
                            <CardDescription>{task.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{status === 'pending' ? 'Queued' : 'Processing'}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white">
                        <Loader2 className="size-10 animate-spin text-white/70" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Video sedang diproses.</p>
                            <p className="text-xs text-white/60">Refresh halaman setelah proses selesai.</p>
                        </div>
                        <Progress value={status === 'pending' ? 15 : 55} className="max-w-xs" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (status === 'failed') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>Video gagal diproses. Coba refresh atau hubungi admin.</AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RotateCcw className="mr-2 size-4" />
                        Retry
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (!task.videoUrl || source.kind === 'unsupported') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>URL video tidak valid atau belum tersedia.</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-0 bg-black shadow-xl shadow-black/10">
            <CardContent className="p-0">
                <div ref={containerRef} className="aspect-video w-full bg-black" />
            </CardContent>
        </Card>
    );
}

function PdfPanel({ task }: { task: LessonTask }) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.pdfName ?? 'Course document'}</p>
                        <p className="text-xs text-muted-foreground">PDF document</p>
                    </div>
                </div>
                {task.pdfUrl ? (
                    <Button asChild variant="outline">
                        <a href={task.pdfUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 size-4" />
                            Download
                        </a>
                    </Button>
                ) : null}
            </div>
            {task.pdfUrl ? <iframe src={task.pdfUrl} className="h-155 w-full rounded-2xl border" title={task.pdfName ?? task.title} /> : null}
        </div>
    );
}

function ReadingTask({
    courseSlug,
    lesson,
    task,
    sourceContent,
    onComplete,
}: {
    courseSlug: string;
    lesson: LessonData;
    task: LessonTask;
    sourceContent?: string;
    onComplete: () => void;
}) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [readingProgress, setReadingProgress] = useState(0);
    const [completed, setCompleted] = useState(task.isCompleted);
    const hasHtml = Boolean(sourceContent);
    const hasPdf = Boolean(task.pdfUrl);

    const finishReading = useCallback(async () => {
        if (completed) {
            return;
        }

        setCompleted(true);

        try {
            await markTaskComplete(courseSlug, lesson.id, task.id);
            onComplete();
        } catch (error) {
            setCompleted(false);
            toast.error(error instanceof Error ? error.message : 'Gagal menyimpan progress.');
        }
    }, [completed, courseSlug, lesson.id, onComplete, task.id]);

    useEffect(() => {
        const element = scrollRef.current;

        if (!element || !hasHtml) {
            return;
        }

        const handleScroll = () => {
            const maxScroll = element.scrollHeight - element.clientHeight;
            const progress = maxScroll > 0 ? (element.scrollTop / maxScroll) * 100 : 100;
            setReadingProgress(Math.min(100, Math.round(progress)));

            if (progress >= 90) {
                finishReading();
            }
        };

        element.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => element.removeEventListener('scroll', handleScroll);
    }, [finishReading, hasHtml]);

    if (!hasHtml && !hasPdf) {
        return (
            <Card>
                <CardContent className="py-14">
                    <Empty>
                        <EmptyHeader>
                            <FileText className="mx-auto size-10 text-muted-foreground" />
                            <EmptyTitle>Materi belum tersedia</EmptyTitle>
                            <EmptyDescription>Konten bacaan untuk tugas ini belum diunggah.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                    </div>
                    <Badge variant={completed ? 'default' : 'outline'}>{completed ? 'Completed' : 'Reading'}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
                {hasHtml ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Reading progress</span>
                            <span className="font-medium tabular-nums text-foreground">{readingProgress}%</span>
                        </div>
                        <Progress value={readingProgress} className="h-2" />
                    </div>
                ) : null}

                {hasHtml && hasPdf ? (
                    <Tabs defaultValue="content">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="content">Materi</TabsTrigger>
                            <TabsTrigger value="pdf">PDF</TabsTrigger>
                        </TabsList>
                        <TabsContent value="content" className="mt-4">
                            <div ref={scrollRef} className="h-145 overflow-y-auto rounded-2xl border bg-background p-5">
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sourceContent ?? '' }} />
                            </div>
                        </TabsContent>
                        <TabsContent value="pdf" className="mt-4">
                            <PdfPanel task={task} />
                        </TabsContent>
                    </Tabs>
                ) : hasHtml ? (
                    <div ref={scrollRef} className="h-155 overflow-y-auto rounded-2xl border bg-background p-5">
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sourceContent ?? '' }} />
                    </div>
                ) : (
                    <PdfPanel task={task} />
                )}
            </CardContent>
            {!completed ? (
                <CardFooter className="border-t bg-muted/20">
                    <Button onClick={finishReading} className="ml-auto">
                        Mark as complete
                    </Button>
                </CardFooter>
            ) : null}
        </Card>
    );
}

function QuizTask({ courseSlug, lesson, task, onComplete }: { courseSlug: string; lesson: LessonData; task: LessonTask; onComplete: () => void }) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const questions = task.quizQuestions;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResults, setShowResults] = useState(Boolean(task.submission));
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<number[]>(() => {
        if (typeof window === 'undefined') {
            return submittedQuizAnswers(task.submission, questions);
        }

        const saved = window.localStorage.getItem(`quiz-${task.id}-answers`);

        if (saved) {
            try {
                const parsed = JSON.parse(saved) as number[];

                if (Array.isArray(parsed) && parsed.length === questions.length) {
                    return parsed;
                }
            } catch {
                window.localStorage.removeItem(`quiz-${task.id}-answers`);
            }
        }

        return submittedQuizAnswers(task.submission, questions);
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (showResults) {
            window.localStorage.removeItem(`quiz-${task.id}-answers`);

            return;
        }

        window.localStorage.setItem(`quiz-${task.id}-answers`, JSON.stringify(answers));
    }, [answers, showResults, task.id]);

    if (questions.length === 0) {
        return (
            <Card>
                <CardContent className="py-10">
                    <Alert>
                        <AlertCircle className="size-4" />
                        <AlertDescription>Kuis belum memiliki pertanyaan.</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const currentQuestion = questions[currentIndex];
    const answeredCount = answers.filter((answer) => answer !== -1).length;
    const allAnswered = answeredCount === questions.length;
    const progress = (answeredCount / questions.length) * 100;

    const submitQuiz = () => {
        if (!allAnswered || submitting) {
            toast.error('Jawab semua pertanyaan sebelum mengirim.');

            return;
        }

        setSubmitting(true);
        router.post(
            submitQuizRoute.url({ course: courseSlug, lesson: lesson.id }),
            {
                task_id: task.id,
                answers: questions.map((question, index) => ({ question_id: question.id, answer: answers[index] })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowResults(true);
                    toast.success('Quiz submitted successfully!');
                    onComplete();
                },
                onError: (formErrors) => {
                    toast.error(formErrors.message || formErrors.answers || 'Quiz submission failed. Please try again.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    if (showResults && task.submission) {
        const scorePercentage = Math.round((task.submission.score / task.submission.total) * 100);
        const passed = scorePercentage >= 70;

        return (
            <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle>{task.title}</CardTitle>
                            <CardDescription>{task.description}</CardDescription>
                        </div>
                        <Badge variant={passed ? 'default' : 'destructive'}>{scorePercentage}% Score</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                    <div className="grid gap-4 rounded-2xl border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex items-start gap-3">
                            {passed ? <CheckCircle2 className="mt-1 size-6 text-emerald-600" /> : <XCircle className="mt-1 size-6 text-destructive" />}
                            <div>
                                <h3 className="text-lg font-semibold">{passed ? 'Great job!' : 'Keep trying!'}</h3>
                                <p className="text-sm text-muted-foreground">
                                    You scored {task.submission.score} of {task.submission.total}.
                                </p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="flex items-center gap-2 text-xl font-semibold sm:justify-end">
                                <Trophy className="size-5 text-amber-500" />+{task.submission.xpEarned ?? 0} XP
                            </div>
                            <p className="text-xs text-muted-foreground">Points: {task.submission.pointsEarned ?? task.submission.score}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Review answers</h4>
                        {questions.map((question, index) => {
                            const result = task.submission?.results[index];
                            const selectedAnswer = answers[index];

                            return (
                                <div
                                    key={question.id}
                                    className={cn(
                                        'rounded-2xl border p-4',
                                        result?.correct
                                            ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'
                                            : 'border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20',
                                    )}
                                >
                                    <div className="flex gap-3">
                                        {result?.correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />}
                                        <div className="space-y-2 text-sm">
                                            <p className="font-medium">
                                                {index + 1}. {question.question}
                                            </p>
                                            <p>
                                                <span className="font-medium">Your answer: </span>
                                                {selectedAnswer >= 0 ? question.options[selectedAnswer] : 'Jawaban tersimpan di server.'}
                                            </p>
                                            {result?.explanation ? <p className="text-muted-foreground">{result.explanation}</p> : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                {task.submission.canRetry ? (
                    <CardFooter className="border-t bg-muted/20">
                        <Button
                            onClick={() => {
                                setShowResults(false);
                                setAnswers(questions.map(() => -1));
                                setCurrentIndex(0);
                            }}
                            className="w-full"
                        >
                            Try again
                        </Button>
                    </CardFooter>
                ) : null}
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="gap-4 border-b bg-muted/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                    </div>
                    <Badge variant="outline">
                        Question {currentIndex + 1} of {questions.length}
                    </Badge>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Answered {answeredCount}/{questions.length}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
                <div className="rounded-2xl border bg-background p-5">
                    <h3 className="text-lg font-semibold">
                        {currentIndex + 1}. {currentQuestion.question}
                    </h3>
                    <RadioGroup
                        value={answers[currentIndex] !== -1 ? String(answers[currentIndex]) : undefined}
                        onValueChange={(value) => {
                            const nextAnswers = [...answers];
                            nextAnswers[currentIndex] = Number(value);
                            setAnswers(nextAnswers);
                        }}
                        className="mt-5 space-y-3"
                    >
                        {currentQuestion.options.map((option, index) => (
                            <div key={option} className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/50', answers[currentIndex] === index && 'border-primary bg-primary/5')}>
                                <RadioGroupItem value={String(index)} id={`quiz-${task.id}-${index}`} />
                                <Label htmlFor={`quiz-${task.id}-${index}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {errors.answers ? (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.answers}</AlertDescription>
                    </Alert>
                ) : null}
            </CardContent>
            <CardFooter className="border-t bg-muted/20">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}>
                        <ChevronLeft className="mr-2 size-4" />
                        Previous
                    </Button>
                    {currentIndex < questions.length - 1 ? (
                        <Button onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={answers[currentIndex] === -1}>
                            Next
                            <ChevronRight className="ml-2 size-4" />
                        </Button>
                    ) : (
                        <Button onClick={submitQuiz} disabled={!allAnswered || submitting}>
                            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Submit quiz
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

function AssessmentPanel({ assessment, onClose }: { assessment: AssessmentFullData; onClose: () => void }) {
    const initialView = assessment.activeSubmission ? 'attempt' : assessment.latestResults ? 'results' : 'overview';
    const [view, setView] = useState<'overview' | 'attempt' | 'results'>(initialView);

    if (view === 'attempt' && assessment.activeSubmission) {
        return <AssessmentAttempt assessment={assessment} />;
    }

    if (view === 'results' && assessment.latestResults) {
        return <AssessmentResults assessment={assessment} onBack={() => setView('overview')} />;
    }

    return <AssessmentOverview assessment={assessment} onClose={onClose} onViewResults={() => setView('results')} />;
}

function AssessmentOverview({ assessment, onClose, onViewResults }: { assessment: AssessmentFullData; onClose: () => void; onViewResults: () => void }) {
    const [starting, setStarting] = useState(false);
    const totalPoints = assessment.totalPoints ?? assessment.questions.reduce((sum, question) => sum + question.points, 0);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>{assessment.title}</CardTitle>
                        <CardDescription>{assessment.description ?? 'Assessment pemahaman kursus.'}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <ChevronLeft className="mr-2 size-4" />
                        Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard icon={Target} label="Passing" value={`${assessment.passingScore}%`} />
                    <MetricCard icon={BookOpen} label="Points" value={String(totalPoints)} />
                    <MetricCard icon={ClipboardCheck} label="Questions" value={String(assessment.questions.length)} />
                    <MetricCard icon={Clock} label="Limit" value={assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes}m` : 'None'} />
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Question map</h3>
                        <Badge variant="secondary">{assessment.bloomLabel ?? 'Assessment'}</Badge>
                    </div>
                    <div className="grid gap-2">
                        {assessment.questions.map((question, index) => (
                            <div key={question.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                                    <span className="truncate text-sm">{question.questionType === 'multiple_choice' ? 'Multiple choice' : 'Essay'}</span>
                                </div>
                                <Badge variant="outline">{question.points} pts</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 border-t bg-muted/20">
                <Button
                    disabled={starting || assessment.canAttempt === false}
                    className="w-full"
                    size="lg"
                    onClick={() => {
                        setStarting(true);
                        router.post(startAssessment.url({ assessment: assessment.slug }), {}, { preserveScroll: true, onFinish: () => setStarting(false) });
                    }}
                >
                    {starting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BookOpen className="mr-2 size-4" />}
                    {assessment.canAttempt === false ? 'Attempt limit reached' : 'Start assessment'}
                </Button>
                {assessment.latestResults ? (
                    <Button variant="outline" onClick={onViewResults} className="w-full">
                        View previous results
                    </Button>
                ) : null}
            </CardFooter>
        </Card>
    );
}

function AssessmentAttempt({ assessment }: { assessment: AssessmentFullData }) {
    const submission = assessment.activeSubmission;
    const [answers, setAnswers] = useState<Record<number, { selected_option?: number; answer_text?: string }>>(submission?.answers ?? {});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(() => {
        if (!submission?.startedAt) {
            return 0;
        }

        return Math.max(0, Math.floor((Date.now() - new Date(submission.startedAt).getTime()) / 1000));
    });
    const currentQuestion = assessment.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = assessment.questions.length > 0 ? (answeredCount / assessment.questions.length) * 100 : 0;
    const timeLimitSeconds = assessment.timeLimitMinutes ? assessment.timeLimitMinutes * 60 : null;
    const timeRemaining = timeLimitSeconds !== null ? timeLimitSeconds - elapsedSeconds : null;

    const handleSubmit = useCallback(() => {
        if (submitting) {
            return;
        }

        setSubmitting(true);
        router.post(submitAssessment.url({ assessment: assessment.slug }), {}, { preserveScroll: true, onFinish: () => setSubmitting(false) });
    }, [assessment.slug, submitting]);

    const saveAnswer = useCallback(
        (questionId: number, value: { selected_option?: number; answer_text?: string }) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                fetch(saveAssessmentAnswer.url({ assessment: assessment.slug }), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify({ question_id: questionId, ...value }),
                }).catch(() => {
                    toast.error('Auto-save failed.');
                });
            }, 800);
        },
        [assessment.slug],
    );

    useEffect(() => {
        const interval = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (timeRemaining !== null && timeRemaining <= 0) {
            handleSubmit();
        }
    }, [handleSubmit, timeRemaining]);

    if (!submission) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>Submission tidak ditemukan.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Assessment progress</span>
                                <span className="font-medium text-foreground">
                                    {answeredCount}/{assessment.questions.length}
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        {timeRemaining !== null ? (
                            <Badge variant={timeRemaining < 60 ? 'destructive' : 'outline'}>
                                <Clock className="mr-1.5 size-3.5" />
                                {formatClock(timeRemaining)}
                            </Badge>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
                {assessment.questions.map((question, index) => (
                    <Button key={question.id} type="button" variant={index === currentIndex ? 'default' : answers[question.id] ? 'secondary' : 'outline'} size="icon" onClick={() => setCurrentIndex(index)}>
                        {index + 1}
                    </Button>
                ))}
            </div>

            {currentQuestion ? (
                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle>Question {currentIndex + 1}</CardTitle>
                                <CardDescription className="mt-2">{currentQuestion.questionText}</CardDescription>
                            </div>
                            <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <AssessmentAnswerInput
                            question={currentQuestion}
                            value={answers[currentQuestion.id]}
                            onChange={(value) => {
                                setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
                                saveAnswer(currentQuestion.id, value);
                            }}
                        />
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20">
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>
                                <ChevronLeft className="mr-2 size-4" />
                                Previous
                            </Button>
                            {currentIndex < assessment.questions.length - 1 ? (
                                <Button onClick={() => setCurrentIndex((index) => index + 1)}>
                                    Next
                                    <ChevronRight className="ml-2 size-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trophy className="mr-2 size-4" />}
                                    Submit assessment
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            ) : null}
        </div>
    );
}

function AssessmentAnswerInput({ question, value, onChange }: { question: AssessmentQuestion; value?: { selected_option?: number; answer_text?: string }; onChange: (value: { selected_option?: number; answer_text?: string }) => void }) {
    if (question.questionType === 'multiple_choice' && question.options) {
        return (
            <RadioGroup value={value?.selected_option !== undefined ? String(value.selected_option) : undefined} onValueChange={(selected) => onChange({ selected_option: Number(selected) })} className="space-y-3">
                {question.options.map((option, index) => (
                    <div key={option} className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/50', value?.selected_option === index && 'border-primary bg-primary/5')}>
                        <RadioGroupItem value={String(index)} id={`assessment-${question.id}-${index}`} />
                        <Label htmlFor={`assessment-${question.id}-${index}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                            {option}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        );
    }

    return (
        <div className="space-y-3">
            <Label htmlFor={`assessment-${question.id}`}>Your response</Label>
            <Textarea id={`assessment-${question.id}`} rows={10} value={value?.answer_text ?? ''} onChange={(event) => onChange({ answer_text: event.target.value })} placeholder="Write your response here..." className="resize-y" />
            <p className="text-xs text-muted-foreground">Word count: {value?.answer_text?.trim() ? value.answer_text.trim().split(/\s+/).length : 0}</p>
        </div>
    );
}

function AssessmentResults({ assessment, onBack }: { assessment: AssessmentFullData; onBack: () => void }) {
    const results = assessment.latestResults;

    if (!results) {
        return null;
    }

    const pointsEarned = results.submission.pointsEarned ?? results.submission.totalScore ?? 0;
    const pointsPossible = results.submission.pointsPossible ?? assessment.totalPoints ?? 0;
    const percentage = pointsPossible > 0 ? Math.round((pointsEarned / pointsPossible) * 100) : 0;

    return (
        <div className="space-y-4">
            <Card className={cn('overflow-hidden', results.submission.passed ? 'border-emerald-300' : 'border-amber-300')}>
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>{results.submission.passed ? 'Assessment passed' : 'Assessment result'}</CardTitle>
                            <CardDescription>{assessment.title}</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ChevronLeft className="mr-2 size-4" />
                            Back
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col items-center gap-3 text-center">
                        {results.submission.passed ? <Trophy className="size-14 text-amber-500" /> : <AlertCircle className="size-14 text-amber-500" />}
                        <div>
                            <p className="text-5xl font-bold tabular-nums">{percentage}%</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {pointsEarned} / {pointsPossible} points
                            </p>
                        </div>
                    </div>
                    <Progress value={percentage} className="h-3" />
                    {results.submission.overallFeedback ? (
                        <Alert>
                            <MessageSquare className="size-4" />
                            <AlertDescription>{results.submission.overallFeedback}</AlertDescription>
                        </Alert>
                    ) : null}
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Answer details</h3>
                {assessment.questions.map((question, index) => {
                    const answer = results.answers.find((result) => result.questionId === question.id);

                    if (!answer) {
                        return null;
                    }

                    return (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                                        <CardDescription className="mt-1">{question.questionText}</CardDescription>
                                    </div>
                                    <Badge variant="secondary">
                                        {answer.pointsAwarded ?? 0}/{question.points} pts
                                    </Badge>
                                </div>
                            </CardHeader>
                            {answer.feedback ? (
                                <CardContent>
                                    <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-4">
                                        <div className="flex gap-2">
                                            <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                                            <p className="text-sm leading-relaxed">{answer.feedback}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            ) : null}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default function CourseShow({ course: serverCourse, lessons: serverLessons, enrollment, assessments = [] }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.is_admin || auth.user.role === 'admin';
    const lessons = useMemo(() => mapLessons(serverLessons), [serverLessons]);
    const [isEnrolled, setIsEnrolled] = useState(enrollment !== null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const hashSelection = useMemo(() => {
        if (typeof window === 'undefined') {
            return { lessonId: null, taskId: null };
        }

        const params = new URLSearchParams(window.location.hash.slice(1));
        const lessonId = params.get('lesson');
        const taskId = params.get('task');

        return { lessonId: lessonId ? Number(lessonId) : null, taskId: taskId ? Number(taskId) : null };
    }, []);
    const firstLessonId = lessons[0]?.id ?? null;
    const initialLessonId = lessons.some((lesson) => lesson.id === hashSelection.lessonId) ? hashSelection.lessonId : firstLessonId;
    const initialTaskId = (() => {
        const lesson = lessons.find((item) => item.id === initialLessonId);

        if (lesson?.tasks.some((task) => task.id === hashSelection.taskId)) {
            return hashSelection.taskId;
        }

        return lesson?.tasks[0]?.id ?? null;
    })();
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(initialLessonId);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(initialTaskId);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
    const [activeMode, setActiveMode] = useState<'task' | 'assessment'>('task');
    const [openOutlineItem, setOpenOutlineItem] = useState<string | undefined>(initialLessonId ? String(initialLessonId) : undefined);
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>(serverLessons.filter((lesson) => lesson.isCompleted).map((lesson) => lesson.id));

    const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
    const selectedTask = selectedLesson?.tasks.find((task) => task.id === selectedTaskId) ?? null;
    const selectedAssessment = assessments.find((assessment) => assessment.id === selectedAssessmentId) ?? null;
    const completedCount = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
    const progressPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
    const totalTasks = lessons.reduce((sum, lesson) => sum + lesson.tasks.length, 0);
    const allLessonsCompleted = lessons.length > 0 && completedCount === lessons.length;
    const assessmentsPassed = assessments.filter((assessment) => assessment.passed).length;
    const courseCompleted = allLessonsCompleted && assessments.every((assessment) => assessment.passed);

    const unlockedLessonIds = useMemo(() => {
        const map = new Map<number, boolean>();

        lessons.forEach((lesson, index) => {
            if (isAdmin || index === 0) {
                map.set(lesson.id, true);

                return;
            }

            const previousLesson = lessons[index - 1];
            map.set(lesson.id, isEnrolled && previousLesson ? completedLessonIds.includes(previousLesson.id) : false);
        });

        return map;
    }, [completedLessonIds, isAdmin, isEnrolled, lessons]);

    const activeContent: ActiveContent = useMemo(() => {
        if (activeMode === 'assessment' && selectedAssessment) {
            return { mode: 'assessment', assessment: selectedAssessment };
        }

        if (selectedLesson && selectedTask) {
            return { mode: 'task', lesson: selectedLesson, task: selectedTask };
        }

        return null;
    }, [activeMode, selectedAssessment, selectedLesson, selectedTask]);

    const navigation = useMemo(() => {
        if (!selectedLesson || !selectedTask) {
            return { previous: null as LessonTask | null, next: null as LessonTask | null };
        }

        const lessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
        const taskIndex = selectedLesson.tasks.findIndex((task) => task.id === selectedTask.id);
        const previous = taskIndex > 0 ? selectedLesson.tasks[taskIndex - 1] : (lessons[lessonIndex - 1]?.tasks.at(-1) ?? null);
        const next = taskIndex < selectedLesson.tasks.length - 1 ? selectedLesson.tasks[taskIndex + 1] : (lessons[lessonIndex + 1]?.tasks[0] ?? null);

        return { previous, next };
    }, [lessons, selectedLesson, selectedTask]);

    const assessmentNavigation = useMemo(() => {
        if (!selectedAssessment) {
            return { previous: null as AssessmentFullData | null, next: null as AssessmentFullData | null };
        }

        const index = assessments.findIndex((assessment) => assessment.id === selectedAssessment.id);

        return { previous: index > 0 ? assessments[index - 1] : null, next: index < assessments.length - 1 ? assessments[index + 1] : null };
    }, [assessments, selectedAssessment]);

    useEffect(() => {
        if (typeof window === 'undefined' || activeMode !== 'task') {
            return;
        }

        const params = new URLSearchParams();

        if (selectedLessonId !== null) {
            params.set('lesson', String(selectedLessonId));
        }

        if (selectedTaskId !== null) {
            params.set('task', String(selectedTaskId));
        }

        window.history.replaceState(null, '', `#${params.toString()}`);
    }, [activeMode, selectedLessonId, selectedTaskId]);

    useEffect(() => {
        if (!notice) {
            return;
        }

        const timer = window.setTimeout(() => setNotice(null), 2800);

        return () => window.clearTimeout(timer);
    }, [notice]);

    const selectTask = (lesson: LessonData, task: LessonTask) => {
        setActiveMode('task');
        setSelectedAssessmentId(null);
        setSelectedLessonId(lesson.id);
        setSelectedTaskId(task.id);
        setOpenOutlineItem(String(lesson.id));
    };

    const selectAssessment = (assessment: AssessmentFullData) => {
        setActiveMode('assessment');
        setSelectedAssessmentId(assessment.id);
        setOpenOutlineItem('assessments');
    };

    const moveToTask = (targetTask: LessonTask | null) => {
        if (!targetTask) {
            return;
        }

        const targetLesson = lessons.find((lesson) => lesson.tasks.some((task) => task.id === targetTask.id));

        if (targetLesson) {
            selectTask(targetLesson, targetTask);
        }
    };

    const refreshProgress = () => {
        router.reload({
            only: ['lessons', 'enrollment'],
            onSuccess: () => {
                if (selectedLesson && !completedLessonIds.includes(selectedLesson.id)) {
                    setCompletedLessonIds((current) => [...current, selectedLesson.id]);
                }
            },
        });
    };

    const ActiveIcon = activeContent?.mode === 'assessment' ? Trophy : activeContent?.task ? taskIcon(activeContent.task.type) : FileText;
    const activeTitle = activeContent?.mode === 'assessment' ? activeContent.assessment.title : (activeContent?.task.title ?? 'Pilih materi');
    const activeSubtitle = activeContent?.mode === 'assessment' ? 'Assessment kursus' : activeContent ? `${activeContent.lesson.title} • ${taskLabel(activeContent.task.type)}` : 'Pilih materi dari outline.';

    return (
        <>
            <Head title={`${serverCourse.title} - Course Detail`} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                {notice ? (
                    <Alert className="border-primary/20 bg-primary/5">
                        <Sparkles className="size-4" />
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                ) : null}

                <div className="animate-fade-in-up flex flex-wrap items-start justify-between gap-3">
                    <div className="flex max-w-4xl flex-col gap-1">
                        <TypographyH1>{serverCourse.title}</TypographyH1>
                        <TypographyMuted>{serverCourse.summary}</TypographyMuted>
                    </div>
                </div>

                <section className="animate-fade-in-up grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start" style={{ animationDelay: '100ms' }}>
                    <Card className="min-w-0 overflow-hidden lg:sticky lg:top-20 lg:h-fit">
                        <CardHeader>
                            <CardTitle className="text-base">Kontrol Belajar</CardTitle>
                            <CardDescription>
                                {completedCount}/{lessons.length} materi selesai • {totalTasks} tugas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 overflow-hidden">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Progres Anda</span>
                                    <span className="font-medium tabular-nums text-foreground">{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                            </div>

                            {!isEnrolled ? (
                                <Button
                                    disabled={isEnrolling}
                                    onClick={() => {
                                        setIsEnrolling(true);
                                        router.post(enrollCourse.url({ course: serverCourse.slug }), {}, {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setIsEnrolled(true);
                                                setNotice('Anda sekarang terdaftar di kursus ini!');
                                            },
                                            onFinish: () => setIsEnrolling(false),
                                        });
                                    }}
                                    className="w-full"
                                >
                                    {isEnrolling ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BookOpen className="mr-2 size-4" />}
                                    {isEnrolling ? 'Mendaftar...' : 'Daftar sekarang'}
                                </Button>
                            ) : null}

                            <Separator />

                            <div className="space-y-3">
                                <ScrollArea className="h-[min(70vh,34rem)] lg:h-[calc(100vh-24rem)]">
                                <Accordion
                                    type="single"
                                    collapsible
                                    value={openOutlineItem}
                                    onValueChange={(value) => {
                                        setOpenOutlineItem(value || undefined);

                                        if (!value || value === 'assessments') {
                                            return;
                                        }

                                        const lesson = lessons.find((item) => item.id === Number(value));

                                        if (lesson?.tasks[0]) {
                                            selectTask(lesson, lesson.tasks[0]);
                                        }
                                    }}
                                    className="w-full pr-3"
                                >
                                    {lessons.map((lesson, index) => {
                                        const locked = !(unlockedLessonIds.get(lesson.id) ?? false);
                                        const completed = completedLessonIds.includes(lesson.id);
                                        const completedTasks = lesson.tasks.filter((task) => task.isCompleted).length;

                                        return (
                                            <AccordionItem key={lesson.id} value={String(lesson.id)} className={cn(locked && 'opacity-60')}>
                                                <AccordionTrigger disabled={locked} className="py-4 text-left hover:no-underline [&>svg]:ml-2">
                                                    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                                                        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold', completed ? 'border-emerald-500 bg-emerald-500 text-white' : locked ? 'bg-muted text-muted-foreground' : 'bg-background text-primary')}>
                                                            {locked ? <Lock className="size-4" /> : completed ? <CheckCircle2 className="size-4" /> : index + 1}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="line-clamp-2 text-sm leading-snug font-medium">{lesson.title}</span>
                                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                                {completedTasks}/{lesson.tasks.length} tasks
                                                            </span>
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-1 pl-10 sm:pl-11">
                                                        {lesson.tasks.map((task) => {
                                                            const Icon = taskIcon(task.type);
                                                            const active = activeMode === 'task' && selectedLessonId === lesson.id && selectedTaskId === task.id;

                                                            return (
                                                                <button key={task.id} type="button" onClick={() => selectTask(lesson, task)} className={cn('group flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm transition-colors', active ? 'bg-primary text-primary-foreground' : 'hover:bg-background')}>
                                                                    <span className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border', task.isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-primary-foreground/70' : 'border-muted-foreground/30')}>
                                                                        {task.isCompleted ? <CheckCircle2 className="size-3" /> : null}
                                                                    </span>
                                                                    <Icon className={cn('mt-0.5 size-4 shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
                                                                    <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-snug">{task.title}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}

                                    {assessments.length > 0 ? (
                                        <AccordionItem value="assessments">
                                            <AccordionTrigger className="py-4 text-left hover:no-underline [&>svg]:ml-2">
                                                <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-amber-600">
                                                        <Trophy className="size-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="line-clamp-2 text-sm leading-snug font-medium">Assessments</span>
                                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                                            {assessmentsPassed}/{assessments.length} passed
                                                        </span>
                                                    </span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-1 pl-10 sm:pl-11">
                                                    {assessments.map((assessment) => {
                                                        const active = activeMode === 'assessment' && selectedAssessmentId === assessment.id;

                                                        return (
                                                            <button key={assessment.id} type="button" onClick={() => selectAssessment(assessment)} className={cn('flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm transition-colors', active ? 'bg-primary text-primary-foreground' : 'hover:bg-background')}>
                                                                <span className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border', assessment.passed ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-primary-foreground/70' : 'border-muted-foreground/30')}>
                                                                    {assessment.passed ? <CheckCircle2 className="size-3" /> : null}
                                                                </span>
                                                                <ClipboardCheck className={cn('mt-0.5 size-4 shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
                                                                <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-snug">{assessment.title}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ) : null}
                                </Accordion>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>

                    <main className="min-w-0 space-y-4">
                        <Card className="relative flex h-full flex-col overflow-hidden pt-0">
                            <div className="relative border-b bg-muted/40 p-5 sm:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex min-w-0 gap-3">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-background text-primary">
                                            <ActiveIcon className="size-5" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline">
                                                    {activeContent?.mode === 'assessment' ? 'Assessment' : activeContent?.task ? taskLabel(activeContent.task.type) : 'Content'}
                                                </Badge>
                                                {activeContent?.mode === 'task' ? (
                                                    <Badge variant="secondary">
                                                        Lesson {lessons.findIndex((lesson) => lesson.id === activeContent.lesson.id) + 1}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <CardTitle className="line-clamp-2 text-xl leading-tight tracking-tight sm:text-2xl">{activeTitle}</CardTitle>
                                            <CardDescription className="line-clamp-2 text-sm leading-relaxed">{activeSubtitle}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-medium tabular-nums text-foreground">{completedCount}/{lessons.length}</span> materi selesai
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-3 sm:p-5">
                                {activeContent?.mode === 'task' && activeContent.task.type === 'video' ? <VideoTask courseSlug={serverCourse.slug} lessonId={activeContent.lesson.id} task={activeContent.task} onComplete={refreshProgress} /> : null}
                                {activeContent?.mode === 'task' && activeContent.task.type === 'read' ? <ReadingTask courseSlug={serverCourse.slug} lesson={activeContent.lesson} task={activeContent.task} sourceContent={serverLessons.find((lesson) => lesson.id === activeContent.lesson.id)?.content} onComplete={refreshProgress} /> : null}
                                {activeContent?.mode === 'task' && activeContent.task.type === 'quiz' ? <QuizTask courseSlug={serverCourse.slug} lesson={activeContent.lesson} task={activeContent.task} onComplete={refreshProgress} /> : null}
                                {activeContent?.mode === 'assessment' ? <AssessmentPanel assessment={activeContent.assessment} onClose={() => { setActiveMode('task'); setSelectedAssessmentId(null); setOpenOutlineItem(selectedLessonId ? String(selectedLessonId) : undefined); }} /> : null}

                                {!activeContent ? (
                                    <Empty className="py-16">
                                        <EmptyHeader>
                                            <EmptyTitle>Tidak ada konten dipilih</EmptyTitle>
                                            <EmptyDescription>Pilih materi atau assessment dari course outline.</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : null}
                            </CardContent>
                            {activeContent ? (
                                <CardFooter className="border-t bg-muted/20">
                                    {activeContent.mode === 'assessment' ? (
                                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <Button variant="outline" disabled={!assessmentNavigation.previous} onClick={() => { if (assessmentNavigation.previous) { selectAssessment(assessmentNavigation.previous); } }}>
                                                <ChevronLeft className="mr-2 size-4" />
                                                Sebelumnya
                                            </Button>
                                            <span className="text-xs text-muted-foreground">{assessments.findIndex((assessment) => assessment.id === selectedAssessmentId) + 1}/{assessments.length}</span>
                                            <Button variant="outline" disabled={!assessmentNavigation.next} onClick={() => { if (assessmentNavigation.next) { selectAssessment(assessmentNavigation.next); } }}>
                                                Berikutnya
                                                <ChevronRight className="ml-2 size-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <Button variant="outline" disabled={!navigation.previous} onClick={() => moveToTask(navigation.previous)}>
                                                <ChevronLeft className="mr-2 size-4" />
                                                Sebelumnya
                                            </Button>
                                            <span className="text-xs text-muted-foreground">{selectedLesson && selectedTask ? `${selectedLesson.tasks.findIndex((task) => task.id === selectedTask.id) + 1}/${selectedLesson.tasks.length}` : null}</span>
                                            <Button variant="outline" disabled={!navigation.next} onClick={() => moveToTask(navigation.next)}>
                                                Berikutnya
                                                <ChevronRight className="ml-2 size-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            ) : null}
                        </Card>
                    </main>
                </section>
            </div>
        </>
    );
}

function CourseShowLayout({ children }: { children: ReactNode }) {
    const { course } = usePage<{ course?: ServerCourse }>().props;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Kursus', href: coursesIndex() },
                ...(course ? [{ title: course.title, href: showCourse({ course: course.slug }) }] : []),
            ]}
        >
            {children}
        </AppLayout>
    );
}

CourseShow.layout = (page: ReactNode) => <CourseShowLayout>{page}</CourseShowLayout>;
