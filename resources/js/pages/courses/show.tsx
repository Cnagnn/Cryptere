import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ClipboardCheck,
    FileText,
    Loader2,
    Lock,
    Menu,
    MessageSquare,
    Sparkles,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';

import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    saveAnswer as saveAssessmentAnswer,
    start as startAssessment,
    submit as submitAssessment,
} from '@/routes/assessments';
import { index as coursesIndex, show as showCourse } from '@/routes/courses';
import {
    complete as completeLesson,
    heartbeat as heartbeatRoute,
    quiz as submitQuizRoute,
} from '@/routes/courses/lessons';
import type { Auth } from '@/types/auth';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PlayerSource =
    | { kind: 'youtube' | 'vimeo'; embedId: string }
    | { kind: 'file'; src: string }
    | { kind: 'unsupported' };
type TaskType = 'video' | 'read' | 'reading' | 'quiz';

type QuizSubmission = {
    answers?: unknown;
    score: number;
    total: number;
    results: Array<{
        correct: boolean;
        correctAnswer?: number;
        explanation?: string | null;
    }>;
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

type ServerTaskQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    explanation: string | null;
};

type EnrollmentData = {
    progressPercentage: number | string;
    completedAt: string | null;
} | null;
type Props = {
    course: ServerCourse;
    lessons: ServerLesson[];
    enrollment: EnrollmentData;
    assessments: AssessmentFullData[];
};
type NormalizedTaskType = Exclude<TaskType, 'reading'>;

type LessonTask = {
    id: number;
    type: NormalizedTaskType;
    title: string;
    description: string;
    maxAttempts?: number | null;
    videoUrl: string | null;
    videoPositionSeconds: number;
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

type ActiveContent =
    | { mode: 'task'; lesson: LessonData; task: LessonTask }
    | { mode: 'assessment'; assessment: AssessmentFullData }
    | null;

type ServerTask = {
    taskId: number | null;
    type: TaskType;
    title: string;
    minutes: number;
    videoUrl: string | null;
    videoPositionSeconds?: number;
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
    questionType:
        | 'mcq'
        | 'multiple_select'
        | 'true_false'
        | 'matching'
        | 'short_answer'
        | 'essay'
        | string;
    questionText: string;
    options?: Array<string | { label?: string; value?: string }> | null;
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
        answers?: Record<
            number,
            { selected_option?: string; answer_text?: string }
        >;
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
            selectedOption?: string | null;
            isCorrect?: boolean | null;
            pointsAwarded?: number | null;
            maxPoints?: number | null;
            feedback?: string | null;
            explanation?: string | null;
            correctAnswer?: string | null;
        }>;
    } | null;
};

function csrfToken(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

function resolvePlayerSource(url: string): PlayerSource {
    try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.toLowerCase();

        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            const embedId =
                parsedUrl.searchParams.get('v') ??
                parsedUrl.pathname.split('/').filter(Boolean).pop();

            return embedId
                ? { kind: 'youtube', embedId }
                : { kind: 'unsupported' };
        }

        if (host.includes('vimeo.com')) {
            const embedId = parsedUrl.pathname.split('/').filter(Boolean).pop();

            return embedId
                ? { kind: 'vimeo', embedId }
                : { kind: 'unsupported' };
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

function normalizePdfUrl(url: string): string {
    try {
        const parsed = new URL(url);

        // If same origin or localhost, use just the path
        if (
            parsed.origin === window.location.origin ||
            parsed.hostname === 'localhost'
        ) {
            return parsed.pathname;
        }

        return url;
    } catch {
        return url;
    }
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
                videoUrl: task.videoUrl,
                videoPositionSeconds: task.videoPositionSeconds ?? 0,
                pdfUrl: task.pdfUrl ? normalizePdfUrl(task.pdfUrl) : null,
                pdfName: task.documentName,
                isPublished: task.isPublished,
                publishedAt: task.publishedAt,
                isCompleted: task.isCompleted ?? false,
                quizQuestions: task.questions.map((question) => ({
                    id: question.id,
                    question: question.question,
                    options: question.options,
                    explanation:
                        question.explanation ??
                        'Explanation available after quiz is submitted.',
                })),
                submission: task.submission ?? null,
            };
        }),
    }));
}

function formatClock(seconds: number): string {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;

    return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/**
 * Send a heartbeat to accumulate watch/reading time for anti-cheat.
 * Includes retry logic with exponential backoff.
 */
async function sendHeartbeat(
    courseSlug: string,
    lessonId: number,
    taskId: number,
    type: 'video' | 'reading',
    seconds: number,
    currentTime?: number,
): Promise<void> {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const body: Record<string, unknown> = {
                task_id: taskId,
                type,
                seconds,
            };

            if (type === 'video' && currentTime !== undefined) {
                body.current_time = Math.floor(currentTime);
            }

            await fetch(
                heartbeatRoute.url({ course: courseSlug, lesson: lessonId }),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify(body),
                    credentials: 'same-origin',
                },
            );

            return; // Success
        } catch {
            attempt++;

            if (attempt >= MAX_RETRIES) {
                // Silently fail after max retries
                return;
            }

            // Exponential backoff: 1s, 2s, 4s
            await new Promise((resolve) =>
                setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
            );
        }
    }
}

async function markTaskComplete(
    courseSlug: string,
    lessonId: number,
    taskId: number,
): Promise<void> {
    const response = await fetch(
        completeLesson.url({ course: courseSlug, lesson: lessonId }),
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ task_id: taskId }),
            credentials: 'same-origin',
        },
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Failed to save progress');
    }

    toast.success(data.message || 'Progress tersimpan.');
}

function submittedQuizAnswers(
    submission: QuizSubmission | null,
    questions: LessonQuizQuestion[],
): number[] {
    const empty = questions.map(() => -1);

    if (!submission?.answers) {
        return empty;
    }

    if (Array.isArray(submission.answers)) {
        const answers = [...empty];

        // Check if it's a flat array of integers (backend format: [2, 1, 3])
        if (
            submission.answers.length > 0 &&
            typeof submission.answers[0] === 'number'
        ) {
            submission.answers.forEach((answer, index) => {
                if (index < answers.length && typeof answer === 'number') {
                    answers[index] = answer;
                }
            });

            return answers;
        }

        // Object format: [{question_id, answer}, ...]
        submission.answers.forEach((answer) => {
            if (!answer || typeof answer !== 'object') {
                return;
            }

            const payload = answer as {
                question_id?: number;
                questionId?: number;
                answer?: number;
            };
            const questionId = payload.question_id ?? payload.questionId;
            const questionIndex = questions.findIndex(
                (question) => question.id === questionId,
            );

            if (questionIndex !== -1 && typeof payload.answer === 'number') {
                answers[questionIndex] = payload.answer;
            }
        });

        return answers;
    }

    return empty;
}

function MetricCard({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                {label}
            </div>
            <p className="mt-1 text-lg leading-tight font-semibold tabular-nums">
                {value}
            </p>
        </div>
    );
}

function VideoTask({
    courseSlug,
    lessonId,
    task,
    onComplete,
}: {
    courseSlug: string;
    lessonId: number;
    task: LessonTask;
    onComplete: () => void;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Plyr | null>(null);
    const completionSentRef = useRef(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watchSecondsRef = useRef(0);
    const isPlayingRef = useRef(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const source = useMemo(
        () => resolvePlayerSource(task.videoUrl ?? ''),
        [task.videoUrl],
    );

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Video heartbeat: track actual play time and send every 30s with position
    useEffect(() => {
        const HEARTBEAT_INTERVAL = 30; // seconds
        let accumulatedSinceLastSend = 0;

        const ticker = setInterval(() => {
            if (isPlayingRef.current) {
                accumulatedSinceLastSend++;
                watchSecondsRef.current++;
            }

            if (accumulatedSinceLastSend >= HEARTBEAT_INTERVAL) {
                const currentTime = playerRef.current?.currentTime ?? 0;
                sendHeartbeat(
                    courseSlug,
                    lessonId,
                    task.id,
                    'video',
                    accumulatedSinceLastSend,
                    currentTime,
                );
                accumulatedSinceLastSend = 0;
            }
        }, 1000);

        heartbeatRef.current = ticker;

        return () => {
            clearInterval(ticker);

            // Send remaining seconds on unmount
            if (accumulatedSinceLastSend > 0) {
                const currentTime = playerRef.current?.currentTime ?? 0;
                sendHeartbeat(
                    courseSlug,
                    lessonId,
                    task.id,
                    'video',
                    accumulatedSinceLastSend,
                    currentTime,
                );
            }
        };
    }, [courseSlug, lessonId, task.id]);

    useEffect(() => {
        const container = containerRef.current;

        if (!container || source.kind === 'unsupported') {
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
                player = new Plyr(target, {
                    controls: [
                        'play-large',
                        'play',
                        'progress',
                        'current-time',
                        'fullscreen',
                    ],
                    disableContextMenu: true,
                    keyboard: { focused: false, global: false },
                    seekTime: 0,
                });
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
                player = new Plyr(video, {
                    controls: [
                        'play-large',
                        'play',
                        'progress',
                        'current-time',
                        'fullscreen',
                    ],
                    disableContextMenu: true,
                    keyboard: { focused: false, global: false },
                    seekTime: 0,
                });
            }

            if (player) {
                playerRef.current = player;

                // Restore last position from backend
                player.on('ready', () => {
                    if (task.videoPositionSeconds > 0 && player) {
                        player.currentTime = task.videoPositionSeconds;
                    }
                });

                // Anti-cheat: prevent seeking forward
                let maxTime = task.videoPositionSeconds || 0;
                player.on('timeupdate', () => {
                    const current = player!.currentTime;

                    if (current > maxTime) {
                        maxTime = current;
                    }
                });
                player.on('seeking', () => {
                    const current = player!.currentTime;

                    if (current > maxTime + 1) {
                        player!.currentTime = maxTime;
                    }
                });

                // Track play/pause state for heartbeat
                player.on('playing', () => {
                    isPlayingRef.current = true;
                });
                player.on('pause', () => {
                    isPlayingRef.current = false;
                });
                player.on('ended', async () => {
                    isPlayingRef.current = false;

                    if (completionSentRef.current) {
                        return;
                    }

                    completionSentRef.current = true;

                    // Send final heartbeat before completion
                    await sendHeartbeat(
                        courseSlug,
                        lessonId,
                        task.id,
                        'video',
                        Math.min(watchSecondsRef.current, 60),
                        player!.currentTime,
                    );

                    try {
                        await markTaskComplete(courseSlug, lessonId, task.id);
                        onComplete();
                    } catch (error) {
                        completionSentRef.current = false;
                        toast.error(
                            error instanceof Error
                                ? error.message
                                : 'Gagal menyimpan progress.',
                        );
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
    }, [
        courseSlug,
        lessonId,
        onComplete,
        source,
        task.id,
        task.videoPositionSeconds,
    ]);

    if (!task.videoUrl || source.kind === 'unsupported') {
        return (
            <div className="space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        URL video tidak valid atau belum tersedia.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {isOffline && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        Anda sedang offline. Progress tidak akan tersimpan.
                    </AlertDescription>
                </Alert>
            )}
            <div className="overflow-hidden rounded-2xl border bg-black shadow-xl shadow-black/10">
                <div
                    ref={containerRef}
                    className="aspect-video w-full bg-black"
                />
            </div>
        </div>
    );
}

function PdfStreamViewer({
    url,
    scrollRef,
    onProgressChange,
}: {
    url: string;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onProgressChange?: (progress: number) => void;
}) {
    const [numPages, setNumPages] = useState<number>(0);
    const [loadError, setLoadError] = useState(false);
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [containerWidth, setContainerWidth] = useState(680);
    const [currentPage, setCurrentPage] = useState(1);
    const maxProgressRef = useRef(0);
    const containerRef = scrollRef;

    // Fetch PDF via XHR to bypass IDM interception
    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        fetch(url, {
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch PDF');
                }

                return res.blob();
            })
            .then((blob) => {
                if (cancelled) {
                    return;
                }

                const blobUrl = URL.createObjectURL(blob);
                setPdfData(blobUrl);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setLoadError(true);
                setLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [url]);

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (pdfData) {
                URL.revokeObjectURL(pdfData);
            }
        };
    }, [pdfData]);

    // Detect container width for responsive PDF
    useEffect(() => {
        const element = containerRef.current;

        if (!element) {
            return;
        }

        const updateWidth = () => {
            const width = element.clientWidth - 32; // padding
            setContainerWidth(Math.min(680, width));
        };

        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(element);

        return () => observer.disconnect();
    }, [containerRef]);

    // Track current page on scroll
    useEffect(() => {
        const element = containerRef.current;

        if (!element || numPages === 0) {
            return;
        }

        const handleScroll = () => {
            const scrollTop = element.scrollTop;
            const pageHeight = element.scrollHeight / numPages;
            const page = Math.floor(scrollTop / pageHeight) + 1;
            setCurrentPage(Math.min(page, numPages));
        };

        element.addEventListener('scroll', handleScroll);

        return () => element.removeEventListener('scroll', handleScroll);
    }, [containerRef, numPages]);

    function onDocumentLoadSuccess({ numPages: total }: { numPages: number }) {
        setNumPages(total);
    }

    useEffect(() => {
        const element = containerRef.current;

        if (!element || !onProgressChange || numPages === 0) {
            return;
        }

        const handleScroll = () => {
            const maxScroll = element.scrollHeight - element.clientHeight;
            // If content fits without scrolling, it's fully visible = 100%
            const current =
                maxScroll <= 0 ? 100 : (element.scrollTop / maxScroll) * 100;
            const rounded = Math.min(100, Math.round(current));

            if (rounded > maxProgressRef.current) {
                maxProgressRef.current = rounded;
                onProgressChange(rounded);
            }
        };

        element.addEventListener('scroll', handleScroll);

        // Delay initial calculation to let pages render
        const timer = setTimeout(handleScroll, 500);

        return () => {
            element.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, [containerRef, onProgressChange, numPages]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/20 py-14">
                <FileText className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Gagal memuat dokumen PDF. Silakan muat ulang halaman.
                </p>
            </div>
        );
    }

    if (loading || !pdfData) {
        return (
            <div className="flex items-center justify-center rounded-2xl border bg-muted/30 py-20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="relative">
            {numPages > 0 && (
                <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-lg border bg-background/95 px-3 py-2 text-xs backdrop-blur">
                    <span className="text-muted-foreground">
                        Halaman {currentPage} / {numPages}
                    </span>
                </div>
            )}
            <div
                ref={containerRef}
                className="h-155 overflow-y-auto rounded-2xl border bg-muted/30 p-4"
                onContextMenu={(e) => e.preventDefault()}
            >
                <Document
                    file={pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={() => setLoadError(true)}
                    loading={
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    }
                >
                    {Array.from({ length: numPages }, (_, index) => (
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            width={containerWidth}
                            className="mx-auto mb-4 shadow-sm last:mb-0"
                            renderTextLayer
                            renderAnnotationLayer
                        />
                    ))}
                </Document>
            </div>
        </div>
    );
}

function ReadingTask({
    courseSlug,
    lesson,
    task,
    onComplete,
}: {
    courseSlug: string;
    lesson: LessonData;
    task: LessonTask;
    onComplete: () => void;
}) {
    const pdfScrollRef = useRef<HTMLDivElement | null>(null);
    const [readingProgress, setReadingProgress] = useState(
        task.isCompleted ? 100 : 0,
    );
    const [completed, setCompleted] = useState(task.isCompleted);
    const hasPdf = Boolean(task.pdfUrl);

    // Reading heartbeat: track time spent on page, send every 15s
    useEffect(() => {
        const HEARTBEAT_INTERVAL = 15;
        let accumulatedSinceLastSend = 0;
        let isVisible = true;

        const handleVisibility = () => {
            isVisible = document.visibilityState === 'visible';
        };

        document.addEventListener('visibilitychange', handleVisibility);

        const ticker = setInterval(() => {
            if (isVisible) {
                accumulatedSinceLastSend++;
            }

            if (accumulatedSinceLastSend >= HEARTBEAT_INTERVAL) {
                sendHeartbeat(
                    courseSlug,
                    lesson.id,
                    task.id,
                    'reading',
                    accumulatedSinceLastSend,
                );
                accumulatedSinceLastSend = 0;
            }
        }, 1000);

        return () => {
            clearInterval(ticker);
            document.removeEventListener('visibilitychange', handleVisibility);

            if (accumulatedSinceLastSend > 0) {
                sendHeartbeat(
                    courseSlug,
                    lesson.id,
                    task.id,
                    'reading',
                    accumulatedSinceLastSend,
                );
            }
        };
    }, [courseSlug, lesson.id, task.id]);

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
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Gagal menyimpan progress.',
            );
        }
    }, [completed, courseSlug, lesson.id, onComplete, task.id]);

    const handleProgressChange = useCallback(
        (progress: number) => {
            setReadingProgress(progress);

            if (progress >= 90) {
                finishReading();
            }
        },
        [finishReading],
    );

    if (!hasPdf) {
        return (
            <div className="rounded-2xl border bg-background py-14">
                <Empty>
                    <EmptyHeader>
                        <FileText className="mx-auto size-10 text-muted-foreground" />
                        <EmptyTitle>Dokumen belum tersedia</EmptyTitle>
                        <EmptyDescription>
                            File PDF untuk tugas ini belum diunggah.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress membaca</span>
                    <span className="font-medium text-foreground tabular-nums">
                        {readingProgress}%
                    </span>
                </div>
                <Progress value={readingProgress} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                    {task.pdfName ?? 'Dokumen PDF'}
                </p>
            </div>

            <PdfStreamViewer
                url={task.pdfUrl!}
                scrollRef={pdfScrollRef}
                onProgressChange={handleProgressChange}
            />

            {!completed ? (
                <div className="flex justify-end border-t pt-4">
                    <Button onClick={finishReading}>
                        Tandai selesai dibaca
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

function QuizTask({
    courseSlug,
    lesson,
    task,
    onComplete,
    onActiveChange,
    setAriaLiveMessage,
}: {
    courseSlug: string;
    lesson: LessonData;
    task: LessonTask;
    onComplete: () => void;
    onActiveChange?: (active: boolean) => void;
    setAriaLiveMessage: (msg: string) => void;
}) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const questions = task.quizQuestions;
    const [started, setStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [showReview, setShowReview] = useState(false);

    // Shuffle option order per question (stable per mount)
    const [shuffledIndices] = useState<number[][]>(() =>
        questions.map((q) => {
            const indices = q.options.map((_, i) => i);

            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            return indices;
        }),
    );
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<number[]>(() => {
        if (typeof window === 'undefined') {
            return submittedQuizAnswers(task.submission, questions);
        }

        const saved = window.localStorage.getItem(`quiz-${task.id}-answers`);

        if (saved) {
            try {
                const parsed = JSON.parse(saved) as number[];

                if (
                    Array.isArray(parsed) &&
                    parsed.length === questions.length
                ) {
                    return parsed;
                }
            } catch {
                window.localStorage.removeItem(`quiz-${task.id}-answers`);
            }
        }

        return submittedQuizAnswers(task.submission, questions);
    });

    useEffect(() => {
        onActiveChange?.(started && !showResults && !showReview);
    }, [started, showResults, showReview, onActiveChange]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (showResults) {
            window.localStorage.removeItem(`quiz-${task.id}-answers`);

            return;
        }

        window.localStorage.setItem(
            `quiz-${task.id}-answers`,
            JSON.stringify(answers),
        );
    }, [answers, showResults, task.id]);

    if (questions.length === 0) {
        return (
            <div className="rounded-2xl border py-10">
                <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        Kuis belum memiliki pertanyaan.
                    </AlertDescription>
                </Alert>
            </div>
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

        fetch(submitQuizRoute.url({ course: courseSlug, lesson: lesson.id }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                Accept: 'application/json',
            },
            body: JSON.stringify({
                task_id: task.id,
                answers: questions.map((question, index) => ({
                    question_id: question.id,
                    answer: answers[index],
                })),
            }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    const error = await response.json();

                    throw new Error(error.message || 'Quiz submission failed');
                }

                return response.json();
            })
            .then(() => {
                setShowResults(true);
                setShowReview(false);
                toast.success('Kuis berhasil dikirim!');
                setAriaLiveMessage('Kuis berhasil dikirim!');
                onComplete();
            })
            .catch((error) => {
                toast.error(
                    error.message || 'Gagal mengirim kuis. Silakan coba lagi.',
                    {
                        action: {
                            label: 'Coba Lagi',
                            onClick: submitQuiz,
                        },
                    },
                );
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    if (showResults && task.submission) {
        const scorePercentage = Math.round(
            (task.submission.score / task.submission.total) * 100,
        );
        const passed = scorePercentage >= 70;

        return (
            <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex items-start gap-3">
                        {passed ? (
                            <CheckCircle2 className="mt-1 size-6 text-emerald-600" />
                        ) : (
                            <XCircle className="mt-1 size-6 text-destructive" />
                        )}
                        <div>
                            <h3 className="text-lg font-semibold">
                                {passed ? 'Kerja bagus!' : 'Terus berusaha!'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Skor kamu {task.submission.score} dari{' '}
                                {task.submission.total}.
                            </p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <div className="flex items-center gap-2 text-xl font-semibold sm:justify-end">
                            <Trophy className="size-5 text-amber-500" />+
                            {task.submission.xpEarned ?? 0} XP
                            {task.submission.xpMultiplier &&
                            task.submission.xpMultiplier < 1 ? (
                                <span
                                    className="text-xs font-normal text-muted-foreground"
                                    title={`XP dikurangi karena percobaan ke-${task.submission.attemptNumber ?? 1}. Multiplier: ${task.submission.xpMultiplier}x`}
                                >
                                    ({task.submission.xpMultiplier}x)
                                </span>
                            ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Poin:{' '}
                            {task.submission.pointsEarned ??
                                task.submission.score}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Tinjauan jawaban</h4>
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
                                    {result?.correct ? (
                                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    ) : (
                                        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                                    )}
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium">
                                            {index + 1}. {question.question}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Jawaban kamu:{' '}
                                            </span>
                                            {selectedAnswer >= 0
                                                ? question.options[
                                                      selectedAnswer
                                                  ]
                                                : 'Jawaban tersimpan di server.'}
                                        </p>
                                        {!result?.correct &&
                                        result?.correctAnswer != null ? (
                                            <p className="text-emerald-600 dark:text-emerald-400">
                                                <span className="font-medium">
                                                    Jawaban benar:{' '}
                                                </span>
                                                {
                                                    question.options[
                                                        result.correctAnswer
                                                    ]
                                                }
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-3 border-t pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            setShowResults(false);
                            setStarted(false);
                        }}
                    >
                        Kembali
                    </Button>
                    {task.submission.canRetry ? (
                        <Button
                            className="flex-1"
                            onClick={() => {
                                setShowResults(false);
                                setAnswers(questions.map(() => -1));
                                setCurrentIndex(0);
                                setStarted(true);
                            }}
                        >
                            Mulai Ulang
                            {task.submission.attemptNumber
                                ? ` (${task.submission.attemptNumber}/${task.maxAttempts ?? '∞'})`
                                : ''}
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    // Review mode: show all questions and answers before submit
    if (showReview) {
        return (
            <div className="space-y-4">
                <div className="rounded-2xl border bg-muted/30 p-4">
                    <h3 className="text-lg font-semibold">Tinjau Jawaban</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Periksa jawaban Anda sebelum mengirim kuis.
                    </p>
                </div>

                <div className="space-y-3">
                    {questions.map((question, index) => {
                        const selectedAnswer = answers[index];

                        return (
                            <div
                                key={question.id}
                                className="rounded-2xl border bg-background p-4"
                            >
                                <p className="text-sm font-medium">
                                    {index + 1}. {question.question}
                                </p>
                                <p className="mt-2 text-sm">
                                    <span className="font-medium">
                                        Jawaban:{' '}
                                    </span>
                                    {selectedAnswer >= 0 ? (
                                        question.options[selectedAnswer]
                                    ) : (
                                        <span className="text-destructive">
                                            Belum dijawab
                                        </span>
                                    )}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-3 border-t pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowReview(false)}
                    >
                        Kembali Edit
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={submitQuiz}
                        disabled={!allAnswered || submitting}
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        Kirim Kuis
                    </Button>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                        icon={BookOpen}
                        label="Pertanyaan"
                        value={String(questions.length)}
                    />
                    <MetricCard icon={Target} label="Passing" value="70%" />
                    <MetricCard
                        icon={ClipboardCheck}
                        label="Tipe"
                        value="Pilihan Ganda"
                    />
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Petunjuk</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                            Jawab semua pertanyaan sebelum mengirim.
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                            Anda bisa berpindah antar pertanyaan.
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                            Skor minimal 70% untuk lulus.
                        </li>
                    </ul>
                </div>

                {task.submission ? (
                    <div className="flex gap-3 border-t pt-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            size="lg"
                            onClick={() => {
                                setShowResults(true);
                                setStarted(true);
                            }}
                        >
                            Tinjau
                        </Button>
                        {task.submission.canRetry ? (
                            <Button
                                className="flex-1"
                                size="lg"
                                onClick={() => setStarted(true)}
                            >
                                Mulai Ulang
                                {task.submission.attemptNumber
                                    ? ` (${task.submission.attemptNumber}/${task.maxAttempts ?? '∞'})`
                                    : ''}
                            </Button>
                        ) : null}
                    </div>
                ) : (
                    <div className="border-t pt-4">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => setStarted(true)}
                        >
                            Mulai Kuis
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Dijawab {answeredCount}/{questions.length}
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                        {Math.round(progress)}%
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Question Navigator */}
            <div className="flex flex-wrap gap-2">
                {questions.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                            'flex size-9 items-center justify-center rounded-lg border text-xs font-medium transition-colors hover:bg-muted',
                            index === currentIndex &&
                                'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
                            index !== currentIndex &&
                                answers[index] !== -1 &&
                                'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                            index !== currentIndex &&
                                answers[index] === -1 &&
                                'border-border bg-background',
                        )}
                        aria-label={`Pertanyaan ${index + 1}${answers[index] !== -1 ? ' (dijawab)' : ''}`}
                        aria-current={
                            index === currentIndex ? 'step' : undefined
                        }
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border bg-background p-5">
                <h3 className="text-lg font-semibold">
                    {currentIndex + 1}. {currentQuestion.question}
                </h3>
                <div className="mt-5 space-y-3">
                    {shuffledIndices[currentIndex].map((originalIndex) => (
                        <button
                            key={originalIndex}
                            type="button"
                            role="radio"
                            aria-checked={
                                answers[currentIndex] === originalIndex
                            }
                            aria-label={`Pilihan ${originalIndex + 1}: ${currentQuestion.options[originalIndex]}`}
                            onClick={() => {
                                const nextAnswers = [...answers];
                                nextAnswers[currentIndex] =
                                    nextAnswers[currentIndex] === originalIndex
                                        ? -1
                                        : originalIndex;
                                setAnswers(nextAnswers);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    const nextAnswers = [...answers];
                                    nextAnswers[currentIndex] =
                                        nextAnswers[currentIndex] ===
                                        originalIndex
                                            ? -1
                                            : originalIndex;
                                    setAnswers(nextAnswers);
                                }
                            }}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
                                answers[currentIndex] === originalIndex
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                    answers[currentIndex] === originalIndex
                                        ? 'border-primary bg-primary'
                                        : 'border-muted-foreground/40',
                                )}
                            >
                                {answers[currentIndex] === originalIndex ? (
                                    <span className="size-2 rounded-full bg-white" />
                                ) : null}
                            </span>
                            <span className="flex-1 text-sm leading-relaxed">
                                {currentQuestion.options[originalIndex]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {errors.answers ? (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{errors.answers}</AlertDescription>
                </Alert>
            ) : null}

            <div className="flex w-full flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <Button
                    variant="outline"
                    size="lg"
                    className="sm:size-default"
                    onClick={() =>
                        setCurrentIndex((index) => Math.max(0, index - 1))
                    }
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="mr-2 size-4" />
                    Sebelumnya
                </Button>
                {currentIndex < questions.length - 1 ? (
                    <Button
                        size="lg"
                        className="sm:size-default"
                        onClick={() =>
                            setCurrentIndex((index) =>
                                Math.min(questions.length - 1, index + 1),
                            )
                        }
                        disabled={answers[currentIndex] === -1}
                    >
                        Berikutnya
                        <ChevronRight className="ml-2 size-4" />
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="sm:size-default"
                        onClick={submitQuiz}
                        disabled={!allAnswered || submitting}
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        Kirim Kuis
                    </Button>
                )}
            </div>

            {allAnswered && (
                <div className="border-t pt-4">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowReview(true)}
                    >
                        Tinjau Semua Jawaban
                    </Button>
                </div>
            )}
        </div>
    );
}

function AssessmentPanel({
    assessment,
    onClose,
}: {
    assessment: AssessmentFullData;
    onClose: () => void;
}) {
    const initialView = assessment.activeSubmission
        ? 'continue'
        : assessment.latestResults
          ? 'results'
          : 'overview';
    const [view, setView] = useState<
        'overview' | 'continue' | 'attempt' | 'results'
    >(initialView);

    if (view === 'attempt' && assessment.activeSubmission) {
        return <AssessmentAttempt assessment={assessment} />;
    }

    if (view === 'continue' && assessment.activeSubmission) {
        return (
            <AssessmentContinue
                assessment={assessment}
                onContinue={() => setView('attempt')}
            />
        );
    }

    if (view === 'results' && assessment.latestResults) {
        return (
            <AssessmentResults
                assessment={assessment}
                onBack={() => setView('overview')}
            />
        );
    }

    return (
        <AssessmentOverview
            assessment={assessment}
            onClose={onClose}
            onViewResults={() => setView('results')}
        />
    );
}

function AssessmentContinue({
    assessment,
    onContinue,
}: {
    assessment: AssessmentFullData;
    onContinue: () => void;
}) {
    const submission = assessment.activeSubmission!;
    const answeredCount = Object.keys(submission.answers ?? {}).length;
    const totalQuestions = assessment.questions.length;
    const progress =
        totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const elapsedSeconds = Math.max(
        0,
        Math.floor(
            (Date.now() - new Date(submission.startedAt).getTime()) / 1000,
        ),
    );
    const timeLimitSeconds = assessment.timeLimitMinutes
        ? assessment.timeLimitMinutes * 60
        : null;
    const timeRemaining =
        timeLimitSeconds !== null ? timeLimitSeconds - elapsedSeconds : null;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl border bg-amber-50/70 p-4 dark:bg-amber-950/20">
                <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                    <h3 className="font-semibold">
                        Assessment sedang berlangsung
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Anda memiliki percobaan ke-{submission.attemptNumber}{' '}
                        yang belum selesai.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                    icon={BookOpen}
                    label="Dijawab"
                    value={`${answeredCount}/${totalQuestions}`}
                />
                <MetricCard
                    icon={Target}
                    label="Progress"
                    value={`${Math.round(progress)}%`}
                />
                <MetricCard
                    icon={Clock}
                    label="Sisa Waktu"
                    value={
                        timeRemaining !== null
                            ? formatClock(timeRemaining)
                            : 'Tanpa batas'
                    }
                />
            </div>

            <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm/6 text-muted-foreground">
                    {totalQuestions - answeredCount} pertanyaan belum dijawab
                </p>
            </div>

            <div className="border-t pt-4">
                <Button className="w-full" size="lg" onClick={onContinue}>
                    Lanjutkan Assessment
                    <ChevronRight className="ml-2 size-4" />
                </Button>
            </div>
        </div>
    );
}

function AssessmentOverview({
    assessment,
    onViewResults,
}: {
    assessment: AssessmentFullData;
    onClose: () => void;
    onViewResults: () => void;
}) {
    const [starting, setStarting] = useState(false);

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                    icon={BookOpen}
                    label="Pertanyaan"
                    value={String(assessment.questions.length)}
                />
                <MetricCard
                    icon={Target}
                    label="Passing"
                    value={`${assessment.passingScore}%`}
                />
                <MetricCard
                    icon={Clock}
                    label="Waktu"
                    value={
                        assessment.timeLimitMinutes
                            ? `${assessment.timeLimitMinutes} menit`
                            : 'Tanpa batas'
                    }
                />
            </div>

            <Separator />

            <div className="space-y-3">
                <h4 className="text-sm font-semibold">Petunjuk</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        Jawab semua pertanyaan sebelum mengirim.
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        Anda bisa berpindah antar pertanyaan.
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        Skor minimal {assessment.passingScore}% untuk lulus.
                    </li>
                    {assessment.timeLimitMinutes ? (
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                            Batas waktu {assessment.timeLimitMinutes} menit.
                        </li>
                    ) : null}
                </ul>
            </div>

            {assessment.latestResults ? (
                <div className="flex gap-3 border-t pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        onClick={onViewResults}
                    >
                        Tinjau
                    </Button>
                    {assessment.canAttempt !== false ? (
                        <Button
                            disabled={starting}
                            className="flex-1"
                            size="lg"
                            onClick={() => {
                                setStarting(true);
                                router.post(
                                    startAssessment.url({
                                        assessment: assessment.slug,
                                    }),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setStarting(false),
                                    },
                                );
                            }}
                        >
                            {starting ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : null}
                            Mulai Ulang
                            {assessment.latestResults?.submission.attemptNumber
                                ? ` (${assessment.latestResults.submission.attemptNumber}/${assessment.attemptCount ?? '∞'})`
                                : ''}
                        </Button>
                    ) : null}
                </div>
            ) : (
                <div className="border-t pt-4">
                    <Button
                        disabled={starting || assessment.canAttempt === false}
                        className="w-full"
                        size="lg"
                        onClick={() => {
                            setStarting(true);
                            router.post(
                                startAssessment.url({
                                    assessment: assessment.slug,
                                }),
                                {},
                                {
                                    preserveScroll: true,
                                    onFinish: () => setStarting(false),
                                },
                            );
                        }}
                    >
                        {starting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        {assessment.canAttempt === false
                            ? 'Batas percobaan tercapai'
                            : 'Mulai Assessment'}
                    </Button>
                </div>
            )}
        </div>
    );
}

function AssessmentAttempt({ assessment }: { assessment: AssessmentFullData }) {
    const submission = assessment.activeSubmission;
    const [answers, setAnswers] = useState<
        Record<number, { selected_option?: string; answer_text?: string }>
    >(() => {
        // Try localStorage first (offline fallback)
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem(
                `assessment-${assessment.id}-answers`,
            );

            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    // Ignore parse errors
                }
            }
        }

        return submission?.answers ?? {};
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(() => {
        if (!submission?.startedAt) {
            return 0;
        }

        return Math.max(
            0,
            Math.floor(
                (Date.now() - new Date(submission.startedAt).getTime()) / 1000,
            ),
        );
    });
    const currentQuestion = assessment.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress =
        assessment.questions.length > 0
            ? (answeredCount / assessment.questions.length) * 100
            : 0;
    const timeLimitSeconds = assessment.timeLimitMinutes
        ? assessment.timeLimitMinutes * 60
        : null;
    const timeRemaining =
        timeLimitSeconds !== null ? timeLimitSeconds - elapsedSeconds : null;

    const handleSubmit = useCallback(() => {
        if (submitting) {
            return;
        }

        setSubmitting(true);
        router.post(
            submitAssessment.url({ assessment: assessment.slug }),
            {},
            { preserveScroll: true, onFinish: () => setSubmitting(false) },
        );
    }, [assessment.slug, submitting]);

    const saveAnswer = useCallback(
        (
            questionId: number,
            value: { selected_option?: string; answer_text?: string },
        ) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            setSaving(true);
            saveTimeoutRef.current = setTimeout(() => {
                fetch(
                    saveAssessmentAnswer.url({ assessment: assessment.slug }),
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrfToken(),
                        },
                        body: JSON.stringify({
                            question_id: questionId,
                            ...value,
                        }),
                    },
                )
                    .then(() => {
                        setSaving(false);
                        setLastSaved(new Date());
                    })
                    .catch(() => {
                        setSaving(false);
                        toast.error('Gagal menyimpan otomatis.');
                    });
            }, 2000);
        },
        [assessment.slug],
    );

    // localStorage backup for offline fallback
    useEffect(() => {
        const key = `assessment-${assessment.id}-answers`;

        if (Object.keys(answers).length > 0) {
            localStorage.setItem(key, JSON.stringify(answers));
        }

        return () => {
            if (submitting) {
                localStorage.removeItem(key);
            }
        };
    }, [answers, assessment.id, submitting]);

    // Restore from localStorage on mount
    useEffect(() => {
        const key = `assessment-${assessment.id}-answers`;
        const saved = localStorage.getItem(key);

        if (saved && Object.keys(answers).length === 0) {
            try {
                const parsed = JSON.parse(saved);

                if (typeof parsed === 'object' && parsed !== null) {
                    setAnswers(parsed);
                }
            } catch {
                localStorage.removeItem(key);
            }
        }
    }, [answers, assessment.id]);

    // Pause timer when tab inactive
    useEffect(() => {
        let isVisible = document.visibilityState === 'visible';
        const handleVisibility = () => {
            isVisible = document.visibilityState === 'visible';
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const interval = window.setInterval(() => {
            if (isVisible) {
                setElapsedSeconds((seconds) => seconds + 1);
            }
        }, 1000);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // 1-minute warning + auto-submit
    useEffect(() => {
        if (timeRemaining !== null) {
            if (timeRemaining === 60) {
                toast.warning('⏰ Sisa waktu 1 menit!');
            }

            if (timeRemaining <= 0) {
                handleSubmit();
            }
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
            {/* Progress bar — identical to QuizTask */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Dijawab {answeredCount}/{assessment.questions.length}
                    </span>
                    <span className="flex items-center gap-2">
                        {timeRemaining !== null ? (
                            <Badge
                                variant={
                                    timeRemaining < 60
                                        ? 'destructive'
                                        : 'outline'
                                }
                                className="text-xs"
                            >
                                <Clock className="mr-1 size-3" />
                                {formatClock(timeRemaining)}
                            </Badge>
                        ) : null}
                        <span className="font-medium text-foreground tabular-nums">
                            {Math.round(progress)}%
                        </span>
                    </span>
                </div>
                <Progress value={progress} className="h-2" />

                {/* Auto-save indicator */}
                <div className="flex items-center justify-end gap-1 text-sm">
                    {saving ? (
                        <>
                            <Loader2 className="size-3 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Menyimpan...
                            </span>
                        </>
                    ) : lastSaved ? (
                        <>
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span className="text-emerald-600">Tersimpan</span>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Question card */}
            {currentQuestion ? (
                <div className="rounded-2xl border bg-background p-5">
                    <h3 className="text-lg font-semibold">
                        {currentIndex + 1}. {currentQuestion.questionText}
                    </h3>
                    <div className="mt-5">
                        <AssessmentAnswerInput
                            question={currentQuestion}
                            value={answers[currentQuestion.id]}
                            onChange={(value) => {
                                setAnswers((previous) => ({
                                    ...previous,
                                    [currentQuestion.id]: value,
                                }));
                                saveAnswer(currentQuestion.id, value);
                            }}
                        />
                    </div>
                </div>
            ) : null}

            {/* Navigation — identical to QuizTask */}
            <div className="flex w-full flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <Button
                    variant="outline"
                    size="lg"
                    className="sm:size-default"
                    disabled={currentIndex === 0}
                    onClick={() =>
                        setCurrentIndex((index) => Math.max(0, index - 1))
                    }
                >
                    <ChevronLeft className="mr-2 size-4" />
                    Sebelumnya
                </Button>
                {currentIndex < assessment.questions.length - 1 ? (
                    <Button
                        size="lg"
                        className="sm:size-default"
                        onClick={() => setCurrentIndex((index) => index + 1)}
                    >
                        Berikutnya
                        <ChevronRight className="ml-2 size-4" />
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="sm:size-default"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        Kirim Assessment
                    </Button>
                )}
            </div>
        </div>
    );
}

function AssessmentAnswerInput({
    question,
    value,
    onChange,
}: {
    question: AssessmentQuestion;
    value?: { selected_option?: string; answer_text?: string };
    onChange: (value: {
        selected_option?: string;
        answer_text?: string;
    }) => void;
}) {
    const hasOptions =
        (question.questionType === 'mcq' ||
            question.questionType === 'true_false') &&
        question.options &&
        question.options.length > 0;
    const options = (question.options ?? []).map((option, index) => {
        if (typeof option === 'string') {
            return {
                key: `${index}-${option}`,
                label: option,
                value: option,
            };
        }

        const label = String(option.label ?? option.value ?? '');
        const optionValue = String(option.value ?? label);

        return {
            key: `${index}-${optionValue}`,
            label,
            value: optionValue,
        };
    });

    if (hasOptions) {
        return (
            <div
                className="space-y-3"
                role="radiogroup"
                aria-label={question.questionText}
            >
                {options.map((option) => (
                    <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={value?.selected_option === option.value}
                        aria-label={option.label}
                        onClick={() =>
                            onChange({
                                selected_option:
                                    value?.selected_option === option.value
                                        ? undefined
                                        : option.value,
                            })
                        }
                        onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                onChange({
                                    selected_option:
                                        value?.selected_option === option.value
                                            ? undefined
                                            : option.value,
                                });
                            }
                        }}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
                            value?.selected_option === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                value?.selected_option === option.value
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground/40',
                            )}
                        >
                            {value?.selected_option === option.value ? (
                                <span className="size-2 rounded-full bg-white" />
                            ) : null}
                        </span>
                        <span className="flex-1 text-sm leading-relaxed">
                            {option.label}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Textarea
                id={`assessment-${question.id}`}
                rows={6}
                value={value?.answer_text ?? ''}
                onChange={(event) =>
                    onChange({ answer_text: event.target.value })
                }
                placeholder="Tulis jawaban Anda di sini..."
                className="resize-y"
            />
            <p className="text-sm/6 text-muted-foreground">
                {(() => {
                    const wordCount = value?.answer_text?.trim()
                        ? value.answer_text.trim().split(/\s+/).length
                        : 0;
                    const parts = [`${wordCount} kata`];

                    if (question.minWords) {
                        parts.push(`min: ${question.minWords}`);
                    }

                    if (question.maxWords) {
                        parts.push(`max: ${question.maxWords}`);
                    }

                    return parts.join(' • ');
                })()}
            </p>
        </div>
    );
}

function AssessmentResults({
    assessment,
    onBack,
}: {
    assessment: AssessmentFullData;
    onBack: () => void;
}) {
    const results = assessment.latestResults;

    if (!results) {
        return null;
    }

    const pointsEarned =
        results.submission.pointsEarned ?? results.submission.totalScore ?? 0;
    const pointsPossible =
        results.submission.pointsPossible ?? assessment.totalPoints ?? 0;
    const percentage =
        pointsPossible > 0
            ? Math.round((pointsEarned / pointsPossible) * 100)
            : 0;

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    'overflow-hidden rounded-2xl border',
                    results.submission.passed
                        ? 'border-emerald-300'
                        : 'border-amber-300',
                )}
            >
                <div className="border-b bg-muted/20 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {results.submission.passed
                                    ? 'Assessment Lulus'
                                    : 'Hasil Assessment'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {assessment.title}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ChevronLeft className="mr-2 size-4" />
                            Kembali
                        </Button>
                    </div>
                </div>
                <div className="space-y-5 p-4 sm:p-6">
                    <div className="flex flex-col items-center gap-3 text-center">
                        {results.submission.passed ? (
                            <Trophy className="size-14 text-amber-500" />
                        ) : (
                            <AlertCircle className="size-14 text-amber-500" />
                        )}
                        <div>
                            <p className="text-5xl font-bold tabular-nums">
                                {percentage}%
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {pointsEarned} / {pointsPossible} poin
                            </p>
                        </div>
                    </div>
                    <Progress value={percentage} className="h-3" />
                    {results.submission.overallFeedback ? (
                        <Alert>
                            <MessageSquare className="size-4" />
                            <AlertDescription>
                                {results.submission.overallFeedback}
                            </AlertDescription>
                        </Alert>
                    ) : null}
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Detail jawaban</h3>
                {assessment.questions.map((question, index) => {
                    const answer = results.answers.find(
                        (result) => result.questionId === question.id,
                    );

                    if (!answer) {
                        return null;
                    }

                    return (
                        <div
                            key={question.id}
                            className="rounded-2xl border p-4 sm:p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h4 className="text-base font-semibold">
                                        Pertanyaan {index + 1}
                                    </h4>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {question.questionText}
                                    </p>
                                </div>
                                <Badge variant="secondary">
                                    {answer.pointsAwarded ?? 0}/
                                    {question.points} pts
                                </Badge>
                            </div>
                            {answer.feedback ? (
                                <div className="mt-4 rounded-2xl border-l-4 border-primary bg-primary/5 p-4">
                                    <div className="flex gap-2">
                                        <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                                        <p className="text-sm leading-relaxed">
                                            {answer.feedback}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

type CourseTaskPanelProps = {
    lessons: LessonData[];
    assessments: AssessmentFullData[];
    activeMode: 'task' | 'assessment';
    selectedLessonId: number | null;
    selectedTaskId: number | null;
    selectedAssessmentId: number | null;
    completedCount: number;
    totalTasks: number;
    assessmentsPassed: number;
    completedLessonIds: number[];
    unlockedLessonIds: Map<number, boolean>;
    openOutlineItem: string | undefined;
    progressPercentage: number;
    selectTask: (lesson: LessonData, task: LessonTask) => void;
    selectAssessment: (assessment: AssessmentFullData) => void;
    setOpenOutlineItem: (value: string | undefined) => void;
};

function CourseTaskPanel({
    lessons,
    assessments,
    activeMode,
    selectedLessonId,
    selectedTaskId,
    selectedAssessmentId,
    completedCount,
    totalTasks,
    assessmentsPassed,
    completedLessonIds,
    unlockedLessonIds,
    openOutlineItem,
    progressPercentage,
    selectTask,
    selectAssessment,
    setOpenOutlineItem,
}: CourseTaskPanelProps) {
    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border bg-background lg:sticky lg:top-20 lg:h-fit">
            <div className="border-b px-4 py-4 sm:px-5">
                <h2 className="text-base font-semibold">Kontrol Belajar</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {completedCount}/{lessons.length} materi selesai •{' '}
                    {totalTasks} tugas
                </p>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium tabular-nums">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>

                <Accordion
                    type="single"
                    collapsible
                    value={openOutlineItem}
                    onValueChange={(value) => {
                        setOpenOutlineItem(value || undefined);

                        if (!value || value === 'assessments') {
                            return;
                        }

                        const lesson = lessons.find(
                            (item) => item.id === Number(value),
                        );

                        if (lesson?.tasks[0]) {
                            selectTask(lesson, lesson.tasks[0]);
                        }
                    }}
                    className="w-full pr-3"
                >
                    {lessons.map((lesson, index) => {
                        const locked = !(
                            unlockedLessonIds.get(lesson.id) ?? false
                        );
                        const completed = completedLessonIds.includes(
                            lesson.id,
                        );
                        const completedTasks = lesson.tasks.filter(
                            (task) => task.isCompleted,
                        ).length;

                        return (
                            <AccordionItem
                                key={lesson.id}
                                value={String(lesson.id)}
                                className={cn(locked && 'opacity-60')}
                            >
                                <AccordionTrigger
                                    disabled={locked}
                                    className="py-3 text-left hover:no-underline [&>svg]:ml-2"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                                        <span
                                            className={cn(
                                                'flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors',
                                                completed
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : locked
                                                      ? 'border-muted bg-muted text-muted-foreground'
                                                      : 'border-sidebar-border bg-sidebar text-sidebar-foreground',
                                            )}
                                        >
                                            {locked ? (
                                                <Lock className="size-3.5" />
                                            ) : completed ? (
                                                <CheckCircle2 className="size-3.5" />
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="line-clamp-2 text-sm leading-snug font-medium">
                                                {lesson.title}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                {completedTasks}/
                                                {lesson.tasks.length} tasks
                                            </span>
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-0.5 pl-9 sm:pl-10">
                                        {lesson.tasks.map((task) => {
                                            const active =
                                                activeMode === 'task' &&
                                                selectedLessonId ===
                                                    lesson.id &&
                                                selectedTaskId === task.id;

                                            return (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    onClick={() =>
                                                        selectTask(lesson, task)
                                                    }
                                                    className={cn(
                                                        'group flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm transition-colors',
                                                        active
                                                            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                                            task.isCompleted
                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                : active
                                                                  ? 'border-sidebar-accent-foreground/50'
                                                                  : 'border-sidebar-border',
                                                        )}
                                                    >
                                                        {task.isCompleted ? (
                                                            <CheckCircle2 className="size-2.5" />
                                                        ) : null}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate leading-snug">
                                                        {task.title}
                                                    </span>
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
                            <AccordionTrigger className="py-3 text-left hover:no-underline [&>svg]:ml-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-amber-600">
                                        <Trophy className="size-3.5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 text-sm leading-snug font-medium">
                                            Assessments
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {assessmentsPassed}/
                                            {assessments.length} passed
                                        </span>
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-0.5 pl-9 sm:pl-10">
                                    {assessments.map((assessment) => {
                                        const active =
                                            activeMode === 'assessment' &&
                                            selectedAssessmentId ===
                                                assessment.id;

                                        return (
                                            <button
                                                key={assessment.id}
                                                type="button"
                                                onClick={() =>
                                                    selectAssessment(assessment)
                                                }
                                                className={cn(
                                                    'flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm transition-colors',
                                                    active
                                                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                                        assessment.passed
                                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                                            : active
                                                              ? 'border-sidebar-accent-foreground/50'
                                                              : 'border-sidebar-border',
                                                    )}
                                                >
                                                    {assessment.passed ? (
                                                        <CheckCircle2 className="size-2.5" />
                                                    ) : null}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate leading-snug">
                                                    {assessment.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ) : null}
                </Accordion>
            </div>
        </div>
    );
}

export default function CourseShow({
    course: serverCourse,
    lessons: serverLessons,
    enrollment,
    assessments = [],
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.is_admin;
    const isEnrolled = enrollment !== null;
    const lessons = useMemo(() => mapLessons(serverLessons), [serverLessons]);
    const [notice, setNotice] = useState<string | null>(null);
    const [ariaLiveMessage, setAriaLiveMessage] = useState<string>('');
    const hashSelection = useMemo(() => {
        if (typeof window === 'undefined') {
            return { lessonId: null, taskId: null };
        }

        const params = new URLSearchParams(window.location.hash.slice(1));
        const lessonId = params.get('lesson');
        const taskId = params.get('task');

        return {
            lessonId: lessonId ? Number(lessonId) : null,
            taskId: taskId ? Number(taskId) : null,
        };
    }, []);
    // Auto-resume: find first incomplete task if no hash selection
    const resumeTarget = (() => {
        // If hash specifies a task, use that
        if (hashSelection.lessonId && hashSelection.taskId) {
            const lesson = lessons.find((l) => l.id === hashSelection.lessonId);

            if (lesson?.tasks.some((t) => t.id === hashSelection.taskId)) {
                return {
                    lessonId: hashSelection.lessonId,
                    taskId: hashSelection.taskId,
                };
            }
        }

        // Find first incomplete task
        for (const lesson of lessons) {
            const incompleteTask = lesson.tasks.find((t) => !t.isCompleted);

            if (incompleteTask) {
                return { lessonId: lesson.id, taskId: incompleteTask.id };
            }
        }

        // All complete — default to first task
        const firstLesson = lessons[0];

        return {
            lessonId: firstLesson?.id ?? null,
            taskId: firstLesson?.tasks[0]?.id ?? null,
        };
    })();

    const initialLessonId = resumeTarget.lessonId;
    const initialTaskId = resumeTarget.taskId;
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        initialLessonId,
    );
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
        initialTaskId,
    );
    // Auto-select assessment if one has an active submission (in-progress)
    const activeAssessment = assessments.find((a) => a.activeSubmission);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<
        number | null
    >(activeAssessment?.id ?? null);
    const [activeMode, setActiveMode] = useState<'task' | 'assessment'>(
        activeAssessment ? 'assessment' : 'task',
    );
    const [openOutlineItem, setOpenOutlineItem] = useState<string | undefined>(
        activeAssessment
            ? 'assessments'
            : initialLessonId
              ? String(initialLessonId)
              : undefined,
    );
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>(
        serverLessons
            .filter((lesson) => lesson.isCompleted)
            .map((lesson) => lesson.id),
    );

    const selectedLesson =
        lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
    const selectedTask =
        selectedLesson?.tasks.find((task) => task.id === selectedTaskId) ??
        null;
    const selectedAssessment =
        assessments.find(
            (assessment) => assessment.id === selectedAssessmentId,
        ) ?? null;
    const completedCount = lessons.filter((lesson) =>
        completedLessonIds.includes(lesson.id),
    ).length;
    const progressPercentage =
        lessons.length > 0
            ? Math.round((completedCount / lessons.length) * 100)
            : 0;
    const totalTasks = lessons.reduce(
        (sum, lesson) => sum + lesson.tasks.length,
        0,
    );
    const assessmentsPassed = assessments.filter(
        (assessment) => assessment.passed,
    ).length;

    const unlockedLessonIds = useMemo(() => {
        const map = new Map<number, boolean>();

        lessons.forEach((lesson, index) => {
            if (isAdmin || index === 0) {
                map.set(lesson.id, true);

                return;
            }

            const previousLesson = lessons[index - 1];
            map.set(
                lesson.id,
                isEnrolled && previousLesson
                    ? completedLessonIds.includes(previousLesson.id)
                    : false,
            );
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
            return {
                previous: null as LessonTask | null,
                next: null as LessonTask | null,
            };
        }

        const lessonIndex = lessons.findIndex(
            (lesson) => lesson.id === selectedLesson.id,
        );
        const taskIndex = selectedLesson.tasks.findIndex(
            (task) => task.id === selectedTask.id,
        );
        const previous =
            taskIndex > 0
                ? selectedLesson.tasks[taskIndex - 1]
                : (lessons[lessonIndex - 1]?.tasks.at(-1) ?? null);
        const next =
            taskIndex < selectedLesson.tasks.length - 1
                ? selectedLesson.tasks[taskIndex + 1]
                : (lessons[lessonIndex + 1]?.tasks[0] ?? null);

        return { previous, next };
    }, [lessons, selectedLesson, selectedTask]);

    const assessmentNavigation = useMemo(() => {
        if (!selectedAssessment) {
            return {
                previous: null as AssessmentFullData | null,
                next: null as AssessmentFullData | null,
            };
        }

        const index = assessments.findIndex(
            (assessment) => assessment.id === selectedAssessment.id,
        );

        return {
            previous: index > 0 ? assessments[index - 1] : null,
            next:
                index < assessments.length - 1 ? assessments[index + 1] : null,
        };
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

    const selectTask = useCallback((lesson: LessonData, task: LessonTask) => {
        setActiveMode('task');
        setSelectedAssessmentId(null);
        setSelectedLessonId(lesson.id);
        setSelectedTaskId(task.id);
        setOpenOutlineItem(String(lesson.id));
    }, []);

    const selectAssessment = (assessment: { id: number }) => {
        setActiveMode('assessment');
        setSelectedAssessmentId(assessment.id);
        setOpenOutlineItem('assessments');
    };

    // Quiz navigation confirmation
    const [quizInProgress, setQuizInProgress] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<{
        lesson: LessonData;
        task: LessonTask;
    } | null>(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    const safeSelectTask = useCallback(
        (
            lesson: { id: number; [key: string]: unknown },
            task: { id: number; [key: string]: unknown },
        ) => {
            if (
                quizInProgress &&
                (lesson.id !== selectedLessonId || task.id !== selectedTaskId)
            ) {
                setPendingNavigation({
                    lesson: lesson as LessonData,
                    task: task as LessonTask,
                });

                return;
            }

            selectTask(lesson as LessonData, task as LessonTask);
            setMobileSheetOpen(false);
        },
        [quizInProgress, selectedLessonId, selectedTaskId, selectTask],
    );

    const confirmNavigation = () => {
        if (pendingNavigation) {
            setQuizInProgress(false);
            selectTask(pendingNavigation.lesson, pendingNavigation.task);
            setPendingNavigation(null);
            setMobileSheetOpen(false);
        }
    };

    const cancelNavigation = () => {
        setPendingNavigation(null);
    };

    const moveToTask = useCallback(
        (targetTask: LessonTask | null) => {
            if (!targetTask) {
                return;
            }

            const targetLesson = lessons.find((lesson) =>
                lesson.tasks.some((task) => task.id === targetTask.id),
            );

            if (targetLesson) {
                safeSelectTask(targetLesson, targetTask);
            }
        },
        [lessons, safeSelectTask],
    );

    // Keyboard shortcuts: ← → for navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is typing in an input/textarea
            const tag = (e.target as HTMLElement)?.tagName;

            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                return;
            }

            if (activeMode !== 'task') {
                return;
            }

            if (e.key === 'ArrowLeft' && navigation.previous) {
                e.preventDefault();
                moveToTask(navigation.previous);
            } else if (e.key === 'ArrowRight' && navigation.next) {
                e.preventDefault();
                moveToTask(navigation.next);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMode, moveToTask, navigation]);

    const refreshProgress = () => {
        router.reload({
            only: ['lessons', 'enrollment'],
            onSuccess: (page) => {
                const freshLessons = (page.props as unknown as Props).lessons;
                const newCompletedIds = freshLessons
                    .filter((lesson) => lesson.isCompleted)
                    .map((lesson) => lesson.id);
                const unlockedLessons = newCompletedIds.filter(
                    (id) => !completedLessonIds.includes(id),
                );

                setCompletedLessonIds(newCompletedIds);

                if (unlockedLessons.length > 0) {
                    const lessonTitles = unlockedLessons
                        .map(
                            (id) =>
                                freshLessons.find((l) => l.id === id)?.title,
                        )
                        .filter(Boolean)
                        .join(', ');
                    setAriaLiveMessage(`Lesson baru terbuka: ${lessonTitles}`);
                }
            },
        });
    };

    const activeTitle =
        activeContent?.mode === 'assessment'
            ? activeContent.assessment.title
            : (activeContent?.task.title ?? 'Pilih materi');

    return (
        <>
            <Head title={`${serverCourse.title} - Course Detail`} />

            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {ariaLiveMessage}
            </div>

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                {notice ? (
                    <Alert className="border-primary/20 bg-primary/5">
                        <Sparkles className="size-4" />
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                ) : null}

                <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>{serverCourse.title}</TypographyH1>
                        <TypographyMuted>
                            {serverCourse.summary}
                        </TypographyMuted>
                    </div>
                </header>

                {/* Mobile sidebar trigger */}
                <div className="lg:hidden">
                    <Sheet
                        open={mobileSheetOpen}
                        onOpenChange={setMobileSheetOpen}
                    >
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Menu className="mr-2 size-4" />
                                Outline Materi
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-85 p-0">
                            <SheetHeader className="border-b px-4 py-3">
                                <SheetTitle>Outline Kursus</SheetTitle>
                            </SheetHeader>
                            <div className="overflow-y-auto p-2">
                                <CourseTaskPanel
                                    lessons={lessons}
                                    assessments={assessments}
                                    activeMode={activeMode}
                                    selectedLessonId={selectedLessonId}
                                    selectedTaskId={selectedTaskId}
                                    selectedAssessmentId={selectedAssessmentId}
                                    completedCount={completedCount}
                                    totalTasks={totalTasks}
                                    assessmentsPassed={assessmentsPassed}
                                    completedLessonIds={completedLessonIds}
                                    unlockedLessonIds={unlockedLessonIds}
                                    openOutlineItem={openOutlineItem}
                                    progressPercentage={progressPercentage}
                                    selectTask={safeSelectTask}
                                    selectAssessment={selectAssessment}
                                    setOpenOutlineItem={setOpenOutlineItem}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <section
                    className="animate-fade-in-up grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start"
                    style={{ animationDelay: '100ms' }}
                >
                    <div className="hidden lg:block">
                        <CourseTaskPanel
                            lessons={lessons}
                            assessments={assessments}
                            activeMode={activeMode}
                            selectedLessonId={selectedLessonId}
                            selectedTaskId={selectedTaskId}
                            selectedAssessmentId={selectedAssessmentId}
                            completedCount={completedCount}
                            totalTasks={totalTasks}
                            assessmentsPassed={assessmentsPassed}
                            completedLessonIds={completedLessonIds}
                            unlockedLessonIds={unlockedLessonIds}
                            openOutlineItem={openOutlineItem}
                            progressPercentage={progressPercentage}
                            selectTask={safeSelectTask}
                            selectAssessment={selectAssessment}
                            setOpenOutlineItem={setOpenOutlineItem}
                        />
                    </div>

                    <main className="min-w-0 space-y-4">
                        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border pt-0">
                            <div className="border-b px-4 py-4 sm:px-5">
                                <h2 className="text-base font-semibold">
                                    {activeTitle}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {activeContent?.mode === 'assessment'
                                        ? (activeContent.assessment
                                              .description ??
                                          'Assessment pemahaman kursus.')
                                        : (activeContent?.task.description ??
                                          'Pilih materi dari outline.')}
                                </p>
                            </div>
                            <div className="p-3 sm:p-5">
                                {activeContent?.mode === 'task' &&
                                activeContent.task.type === 'video' ? (
                                    <VideoTask
                                        courseSlug={serverCourse.slug}
                                        lessonId={activeContent.lesson.id}
                                        task={activeContent.task}
                                        onComplete={refreshProgress}
                                    />
                                ) : null}
                                {activeContent?.mode === 'task' &&
                                activeContent.task.type === 'read' ? (
                                    <ReadingTask
                                        courseSlug={serverCourse.slug}
                                        lesson={activeContent.lesson}
                                        task={activeContent.task}
                                        onComplete={refreshProgress}
                                    />
                                ) : null}
                                {activeContent?.mode === 'task' &&
                                activeContent.task.type === 'quiz' ? (
                                    <QuizTask
                                        courseSlug={serverCourse.slug}
                                        lesson={activeContent.lesson}
                                        task={activeContent.task}
                                        onComplete={refreshProgress}
                                        onActiveChange={setQuizInProgress}
                                        setAriaLiveMessage={setAriaLiveMessage}
                                    />
                                ) : null}
                                {activeContent?.mode === 'assessment' ? (
                                    <AssessmentPanel
                                        assessment={activeContent.assessment}
                                        onClose={() => {
                                            setActiveMode('task');
                                            setSelectedAssessmentId(null);
                                            setOpenOutlineItem(
                                                selectedLessonId
                                                    ? String(selectedLessonId)
                                                    : undefined,
                                            );
                                        }}
                                    />
                                ) : null}

                                {!activeContent ? (
                                    <Empty className="py-16">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                Tidak ada konten dipilih
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Pilih materi atau assessment
                                                dari course outline.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : null}
                            </div>
                            {activeContent ? (
                                <div className="border-t bg-muted/20 p-4 sm:p-5">
                                    {activeContent.mode === 'assessment' ? (
                                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <Button
                                                variant="outline"
                                                disabled={
                                                    !assessmentNavigation.previous
                                                }
                                                onClick={() => {
                                                    if (
                                                        assessmentNavigation.previous
                                                    ) {
                                                        selectAssessment(
                                                            assessmentNavigation.previous,
                                                        );
                                                    }
                                                }}
                                            >
                                                <ChevronLeft className="mr-2 size-4" />
                                                Sebelumnya
                                            </Button>
                                            <span className="text-xs text-muted-foreground">
                                                {assessments.findIndex(
                                                    (assessment) =>
                                                        assessment.id ===
                                                        selectedAssessmentId,
                                                ) + 1}
                                                /{assessments.length}
                                            </span>
                                            <Button
                                                variant="outline"
                                                disabled={
                                                    !assessmentNavigation.next
                                                }
                                                onClick={() => {
                                                    if (
                                                        assessmentNavigation.next
                                                    ) {
                                                        selectAssessment(
                                                            assessmentNavigation.next,
                                                        );
                                                    }
                                                }}
                                            >
                                                Berikutnya
                                                <ChevronRight className="ml-2 size-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <Button
                                                variant="outline"
                                                disabled={!navigation.previous}
                                                onClick={() =>
                                                    moveToTask(
                                                        navigation.previous,
                                                    )
                                                }
                                            >
                                                <ChevronLeft className="mr-2 size-4" />
                                                Sebelumnya
                                            </Button>
                                            <span className="text-xs text-muted-foreground">
                                                {selectedLesson && selectedTask
                                                    ? `${selectedLesson.tasks.findIndex((task) => task.id === selectedTask.id) + 1}/${selectedLesson.tasks.length}`
                                                    : null}
                                            </span>
                                            <Button
                                                variant="outline"
                                                disabled={!navigation.next}
                                                onClick={() =>
                                                    moveToTask(navigation.next)
                                                }
                                            >
                                                Berikutnya
                                                <ChevronRight className="ml-2 size-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </main>
                </section>
            </div>

            {/* Quiz navigation confirmation dialog */}
            <AlertDialog
                open={pendingNavigation !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        cancelNavigation();
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tinggalkan Kuis?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kuis sedang berlangsung. Jika kamu pindah ke materi
                            lain, progres kuis saat ini akan hilang.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Kembali ke Kuis</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmNavigation}>
                            Tinggalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function CourseShowLayout({ children }: { children: ReactNode }) {
    const { course } = usePage<{ course?: ServerCourse }>().props;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Kursus', href: coursesIndex() },
                ...(course
                    ? [
                          {
                              title: course.title,
                              href: showCourse({ course: course.slug }),
                          },
                      ]
                    : []),
            ]}
        >
            {children}
        </AppLayout>
    );
}

CourseShow.layout = (page: ReactNode) => (
    <CourseShowLayout>{page}</CourseShowLayout>
);
