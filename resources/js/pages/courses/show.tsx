import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';

import AppLayout from '@/layouts/app-layout';
import {
    enroll as enrollCourse,
    index as coursesIndex,
    show as showCourse,
} from '@/routes/courses';
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
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// ── Inline Components: ContentCard ──

type ContentCardProps = {
    children: ReactNode;
    className?: string;
};

type ContentCardHeaderProps = {
    children: ReactNode;
    className?: string;
};

type ContentCardTitleProps = {
    children: ReactNode;
    className?: string;
};

type ContentCardDescriptionProps = {
    children: ReactNode;
    className?: string;
};

type ContentCardActionsProps = {
    children: ReactNode;
    className?: string;
};

type ContentCardBodyProps = {
    children: ReactNode;
    className?: string;
};

type ContentCardFooterProps = {
    children: ReactNode;
    className?: string;
};

function ContentCard({ children, className }: ContentCardProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-5 rounded-xl border bg-card shadow-sm',
                className,
            )}
        >
            {children}
        </div>
    );
}

function ContentCardHeader({
    children,
    className,
}: ContentCardHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 px-5 pt-5', className)}>
            {children}
        </div>
    );
}

function ContentCardTitle({
    children,
    className,
}: ContentCardTitleProps) {
    return (
        <h2 className={cn('text-lg leading-tight font-semibold', className)}>
            {children}
        </h2>
    );
}

function ContentCardDescription({
    children,
    className,
}: ContentCardDescriptionProps) {
    return (
        <p className={cn('text-[13px] text-muted-foreground', className)}>
            {children}
        </p>
    );
}

function ContentCardActions({
    children,
    className,
}: ContentCardActionsProps) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            {children}
        </div>
    );
}

function ContentCardBody({ children, className }: ContentCardBodyProps) {
    return <div className={cn('px-5', className)}>{children}</div>;
}

function ContentCardFooter({
    children,
    className,
}: ContentCardFooterProps) {
    return (
        <div className={cn('flex flex-col gap-2 px-5 pb-5', className)}>
            {children}
        </div>
    );
}

// ── Inline Components: ContentNavigation ──

type ContentNavigationProps = {
    hasPrevious?: boolean;
    onPrevious?: () => void;
    previousLabel?: string;
    previousDisabled?: boolean;
    hasNext?: boolean;
    onNext?: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    currentIndex?: number;
    totalCount?: number;
    className?: string;
};

function ContentNavigation({
    hasPrevious = false,
    onPrevious,
    previousLabel = 'Previous',
    previousDisabled = false,
    hasNext = false,
    onNext,
    nextLabel = 'Next',
    nextDisabled = false,
    currentIndex,
    totalCount,
    className,
}: ContentNavigationProps) {
    const showPosition = currentIndex !== undefined && totalCount !== undefined;

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5',
                className,
            )}
        >
            <Button
                variant="ghost"
                size="sm"
                disabled={!hasPrevious || previousDisabled}
                onClick={onPrevious}
                className="gap-1.5 text-xs"
            >
                <ChevronLeft className="size-3.5" />
                <span>{previousLabel}</span>
            </Button>

            {showPosition && (
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {currentIndex}/{totalCount}
                </span>
            )}

            <Button
                variant="ghost"
                size="sm"
                disabled={!hasNext || nextDisabled}
                onClick={onNext}
                className="gap-1.5 text-xs"
            >
                <span>{nextLabel}</span>
                <ChevronRight className="size-3.5" />
            </Button>
        </div>
    );
}

// ── Inline Components: VideoContent ──

type PlayerSource =
    | { kind: 'youtube' | 'vimeo'; embedId: string }
    | { kind: 'file'; src: string }
    | { kind: 'unsupported' };

function resolvePlayerSource(url: string): PlayerSource {
    try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.toLowerCase();

        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            const youtubeId =
                parsedUrl.searchParams.get('v') ??
                parsedUrl.pathname.split('/').filter(Boolean).pop();

            if (youtubeId) {
                return { kind: 'youtube', embedId: youtubeId };
            }
        }

        if (host.includes('vimeo.com')) {
            const vimeoId = parsedUrl.pathname.split('/').filter(Boolean).pop();

            if (vimeoId) {
                return { kind: 'vimeo', embedId: vimeoId };
            }
        }

        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            return { kind: 'file', src: url };
        }

        return { kind: 'unsupported' };
    } catch {
        return { kind: 'unsupported' };
    }
}

type VideoProcessingStatus =
    | 'pending'
    | 'processing'
    | 'ready'
    | 'converted'
    | 'failed'
    | null;

type VideoContentProps = {
    courseSlug: string;
    lessonId: number;
    taskId: number;
    title: string;
    description?: string;
    videoUrl: string;
    videoProcessingStatus?: VideoProcessingStatus;
    onComplete?: () => void;
};

function VideoContent({
    courseSlug,
    lessonId,
    taskId,
    title,
    description,
    videoUrl,
    videoProcessingStatus,
    onComplete,
}: VideoContentProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Plyr | null>(null);
    const [hasCompleted, setHasCompleted] = useState(false);
    const source = useMemo(() => resolvePlayerSource(videoUrl), [videoUrl]);

    const processingStatus = videoProcessingStatus;

    useEffect(() => {
        const container = containerRef.current;

        if (!container || source.kind === 'unsupported') {
            return;
        }

        if (
            processingStatus === 'pending' ||
            processingStatus === 'processing' ||
            processingStatus === 'failed'
        ) {
            return;
        }

        container.innerHTML = '';

        let player: Plyr | null = null;

        try {
            if (source.kind === 'youtube' || source.kind === 'vimeo') {
                const div = document.createElement('div');
                div.setAttribute('data-plyr-provider', source.kind);
                div.setAttribute('data-plyr-embed-id', source.embedId);
                container.appendChild(div);

                player = new Plyr(div, {
                    controls: [
                        'play-large',
                        'play',
                        'progress',
                        'current-time',
                        'mute',
                        'volume',
                        'settings',
                        'pip',
                        'fullscreen',
                    ],
                });
            } else if (source.kind === 'file') {
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
                        'mute',
                        'volume',
                        'settings',
                        'pip',
                        'fullscreen',
                    ],
                });
            }

            if (player) {
                playerRef.current = player;

                player.on('ended', async () => {
                    if (hasCompleted) {
                        return;
                    }

                    setHasCompleted(true);

                    try {
                        const response = await fetch(
                            completeLesson.url({
                                course: courseSlug,
                                lesson: lessonId,
                            }),
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'X-CSRF-TOKEN':
                                        document
                                            .querySelector(
                                                'meta[name="csrf-token"]',
                                            )
                                            ?.getAttribute('content') || '',
                                },
                                body: JSON.stringify({
                                    task_id: taskId,
                                }),
                                credentials: 'same-origin',
                            },
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                                errorData.message || 'Failed to save progress',
                            );
                        }

                        const data = await response.json();

                        toast.success(
                            data.message || 'Video completed! XP awarded.',
                        );
                        onComplete?.();
                    } catch (error: any) {
                        console.error('Failed to mark video complete:', error);
                        toast.error(
                            error?.message ||
                                'Failed to save progress. Please try again.',
                        );
                        setHasCompleted(false);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initialize video player:', error);
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }

            if (container) {
                container.innerHTML = '';
            }
        };
    }, [
        source,
        processingStatus,
        courseSlug,
        lessonId,
        taskId,
        onComplete,
        hasCompleted,
    ]);

    if (processingStatus === 'pending' || processingStatus === 'processing') {
        return (
            <ContentCard>
                <ContentCardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <ContentCardTitle>{title}</ContentCardTitle>
                            {description && (
                                <ContentCardDescription>
                                    {description}
                                </ContentCardDescription>
                            )}
                        </div>
                        <Badge variant="secondary">
                            {processingStatus === 'pending'
                                ? 'Queued'
                                : 'Processing'}
                        </Badge>
                    </div>
                </ContentCardHeader>

                <ContentCardBody>
                    <div className="overflow-hidden rounded-xl border bg-black">
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 p-6 text-center">
                            <Loader2 className="size-12 animate-spin text-muted-foreground" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-white">
                                    {processingStatus === 'pending'
                                        ? 'Video is queued for processing'
                                        : 'Video is being converted'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    This may take a few minutes. The page will
                                    update automatically when ready.
                                </p>
                            </div>
                            <Progress
                                value={processingStatus === 'pending' ? 0 : 50}
                                className="w-full max-w-xs"
                            />
                        </div>
                    </div>
                </ContentCardBody>
            </ContentCard>
        );
    }

    if (processingStatus === 'failed') {
        return (
            <ContentCard>
                <ContentCardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <ContentCardTitle>{title}</ContentCardTitle>
                            {description && (
                                <ContentCardDescription>
                                    {description}
                                </ContentCardDescription>
                            )}
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                    </div>
                </ContentCardHeader>

                <ContentCardBody>
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                            Video processing failed. Please contact support or try
                            uploading a different video.
                        </AlertDescription>
                    </Alert>
                </ContentCardBody>

                <ContentCardFooter>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        <RotateCcw className="mr-2 size-4" />
                        Retry
                    </Button>
                </ContentCardFooter>
            </ContentCard>
        );
    }

    if (source.kind === 'unsupported') {
        return (
            <ContentCard>
                <ContentCardHeader>
                    <ContentCardTitle>{title}</ContentCardTitle>
                    {description && (
                        <ContentCardDescription>
                            {description}
                        </ContentCardDescription>
                    )}
                </ContentCardHeader>

                <ContentCardBody>
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                            Unsupported video URL format. Please use YouTube, Vimeo,
                            or a direct video file link.
                        </AlertDescription>
                    </Alert>
                </ContentCardBody>
            </ContentCard>
        );
    }

    return (
        <ContentCard>
            <ContentCardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <ContentCardTitle>{title}</ContentCardTitle>
                        {description && (
                            <ContentCardDescription>
                                {description}
                            </ContentCardDescription>
                        )}
                    </div>
                    <ContentCardActions>
                        <Badge variant="outline">
                            <PlayCircle className="mr-1.5 size-3" />
                            Video
                        </Badge>
                    </ContentCardActions>
                </div>
            </ContentCardHeader>

            <ContentCardBody>
                <div
                    ref={containerRef}
                    className="overflow-hidden rounded-xl border bg-black"
                />
            </ContentCardBody>
        </ContentCard>
    );
}

// ── DocumentContent Component ──

type DocumentContentProps = {
    courseSlug: string;
    lessonId: number;
    taskId: number;
    title: string;
    description?: string;
    content?: string;
    pdfUrl?: string;
    pdfName?: string;
    onComplete?: () => void;
};

function DocumentContent({
    courseSlug,
    lessonId,
    taskId,
    title,
    description,
    content,
    pdfUrl,
    pdfName,
    onComplete,
}: DocumentContentProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [readingProgress, setReadingProgress] = useState(0);
    const [hasCompleted, setHasCompleted] = useState(false);

    const hasContent = !!content;
    const hasPdf = !!pdfUrl;

    const handleComplete = useCallback(async () => {
        try {
            const response = await fetch(
                completeLesson.url({
                    course: courseSlug,
                    lesson: lessonId,
                }),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        task_id: taskId,
                    }),
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save progress');
            }

            const data = await response.json();

            toast.success(data.message || 'Document completed! XP awarded.');
            onComplete?.();
        } catch (error: any) {
            console.error('Failed to mark document complete:', error);
            toast.error(
                error?.message || 'Failed to save progress. Please try again.',
            );
            setHasCompleted(false);
        }
    }, [courseSlug, lessonId, taskId, onComplete]);

    useEffect(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        const handleScroll = () => {
            const scrollTop = element.scrollTop;
            const scrollHeight = element.scrollHeight - element.clientHeight;
            const progress =
                scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

            setReadingProgress(Math.min(100, Math.round(progress)));

            if (progress >= 90 && !hasCompleted) {
                setHasCompleted(true);
                handleComplete();
            }
        };

        element.addEventListener('scroll', handleScroll);

        return () => element.removeEventListener('scroll', handleScroll);
    }, [hasCompleted, handleComplete]);

    const handleMarkComplete = () => {
        if (!hasCompleted) {
            setHasCompleted(true);
            handleComplete();
        }
    };

    if (!hasContent && !hasPdf) {
        return (
            <ContentCard>
                <ContentCardHeader>
                    <ContentCardTitle>{title}</ContentCardTitle>
                    {description && (
                        <ContentCardDescription>
                            {description}
                        </ContentCardDescription>
                    )}
                </ContentCardHeader>

                <ContentCardBody>
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <FileText className="mx-auto size-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            No content available for this document yet.
                        </p>
                    </div>
                </ContentCardBody>
            </ContentCard>
        );
    }

    return (
        <ContentCard>
            <ContentCardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <ContentCardTitle>{title}</ContentCardTitle>
                        {description && (
                            <ContentCardDescription>
                                {description}
                            </ContentCardDescription>
                        )}
                    </div>
                    <ContentCardActions>
                        <Badge variant="outline">
                            <BookOpen className="mr-1.5 size-3" />
                            Reading
                        </Badge>
                    </ContentCardActions>
                </div>
            </ContentCardHeader>

            <ContentCardBody>
                <div className="space-y-4">
                    {hasContent && (
                        <>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Reading Progress
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {readingProgress}%
                                    </span>
                                </div>
                                <Progress
                                    value={readingProgress}
                                    className="h-1.5"
                                />
                            </div>
                            <Separator />
                        </>
                    )}

                    {hasContent && hasPdf ? (
                        <Tabs defaultValue="content" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="content">
                                    Content
                                </TabsTrigger>
                                <TabsTrigger value="pdf">
                                    PDF Document
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="content" className="mt-4">
                                <ScrollArea
                                    ref={scrollRef}
                                    className="h-[600px] rounded-lg border p-6"
                                >
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: content ?? '',
                                        }}
                                    />
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="pdf" className="mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="size-8 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">
                                                    {pdfName}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    PDF Document
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline">
                                            <a
                                                href={pdfUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Download className="mr-2 size-4" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                    <iframe
                                        src={pdfUrl}
                                        className="h-[600px] w-full rounded-lg border"
                                        title={pdfName}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : hasContent ? (
                        <ScrollArea
                            ref={scrollRef}
                            className="h-[600px] rounded-lg border p-6"
                        >
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: content ?? '',
                                }}
                            />
                        </ScrollArea>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="size-8 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{pdfName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            PDF Document
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="outline">
                                    <a
                                        href={pdfUrl}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="mr-2 size-4" />
                                        Download
                                    </a>
                                </Button>
                            </div>
                            <iframe
                                src={pdfUrl}
                                className="h-[600px] w-full rounded-lg border"
                                title={pdfName}
                            />
                        </div>
                    )}
                </div>
            </ContentCardBody>

            {!hasCompleted && (
                <ContentCardFooter>
                    <Button onClick={handleMarkComplete} className="ml-auto">
                        Mark as Complete
                    </Button>
                </ContentCardFooter>
            )}
        </ContentCard>
    );
}

// ── QuizContent Component ──

type QuizContentProps = {
    courseSlug: string;
    lessonId: number;
    taskId: number;
    title: string;
    description?: string;
    questions: Array<{
        id: number;
        question: string;
        options: [string, string, string, string];
        explanation: string;
    }>;
    submission?: {
        score: number;
        total: number;
        results: Array<{
            correct: boolean;
            explanation: string | null;
        }>;
        xpEarned: number;
        pointsEarned: number;
        attemptNumber: number;
        xpMultiplier: number;
        bestScore: number;
        bestTotal: number;
        canRetry: boolean;
    } | null;
    onComplete?: () => void;
};

function QuizContent({
    courseSlug,
    lessonId,
    taskId,
    title,
    description,
    questions,
    submission,
    onComplete,
}: QuizContentProps) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResults, setShowResults] = useState(!!submission);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localAnswers, setLocalAnswers] = useState<number[]>(() => {
        const saved = localStorage.getItem(`quiz-${taskId}-answers`);

        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // Ignore parse errors
            }
        }

        return submission?.results.map((_, i) => i) ?? questions.map(() => -1);
    });

    useEffect(() => {
        if (!showResults) {
            localStorage.setItem(
                `quiz-${taskId}-answers`,
                JSON.stringify(localAnswers),
            );
        }
    }, [localAnswers, taskId, showResults]);

    useEffect(() => {
        if (showResults) {
            localStorage.removeItem(`quiz-${taskId}-answers`);
        }
    }, [showResults, taskId]);

    if (questions.length === 0) {
        return (
            <ContentCard>
                <ContentCardHeader>
                    <ContentCardTitle>{title}</ContentCardTitle>
                    {description && (
                        <ContentCardDescription>
                            {description}
                        </ContentCardDescription>
                    )}
                </ContentCardHeader>
                <ContentCardBody>
                    <Alert>
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                            This quiz has no questions yet.
                        </AlertDescription>
                    </Alert>
                </ContentCardBody>
            </ContentCard>
        );
    }

    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
        return (
            <ContentCard>
                <ContentCardHeader>
                    <ContentCardTitle>{title}</ContentCardTitle>
                    {description && (
                        <ContentCardDescription>
                            {description}
                        </ContentCardDescription>
                    )}
                </ContentCardHeader>
                <ContentCardBody>
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                            Invalid question index. Please refresh the page.
                        </AlertDescription>
                    </Alert>
                </ContentCardBody>
            </ContentCard>
        );
    }

    const currentAnswer = localAnswers[currentIndex];
    const allAnswered = localAnswers.every((answer) => answer !== -1);
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === questions.length - 1;

    const handleAnswerSelect = (value: string) => {
        const answerIndex = parseInt(value, 10);
        const newAnswers = [...localAnswers];
        newAnswers[currentIndex] = answerIndex;
        setLocalAnswers(newAnswers);
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleSubmit = () => {
        if (!allAnswered) {
            toast.error('Please answer all questions before submitting');

            return;
        }

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const answersWithIds = questions.map((question, index) => ({
            question_id: question.id,
            answer: localAnswers[index],
        }));

        router.post(
            submitQuizRoute.url({
                course: courseSlug,
                lesson: lessonId,
            }),
            {
                task_id: taskId,
                answers: answersWithIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowResults(true);
                    setIsSubmitting(false);
                    toast.success('Quiz submitted successfully!');
                    onComplete?.();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    console.error('Quiz submission error:', errors);
                    const errorMessage =
                        errors.message ||
                        errors.answers ||
                        'Quiz submission failed. Please try again.';
                    toast.error(errorMessage);
                },
            },
        );
    };

    const handleRetry = () => {
        setShowResults(false);
        setLocalAnswers(questions.map(() => -1));
        setCurrentIndex(0);
    };

    if (showResults && submission) {
        const percentage = Math.round(
            (submission.score / submission.total) * 100,
        );
        const passed = percentage >= 70;

        return (
            <ContentCard>
                <ContentCardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <ContentCardTitle>{title}</ContentCardTitle>
                            {description && (
                                <ContentCardDescription>
                                    {description}
                                </ContentCardDescription>
                            )}
                        </div>
                        <Badge
                            variant={passed ? 'default' : 'destructive'}
                            className="text-sm"
                        >
                            {percentage}% Score
                        </Badge>
                    </div>
                </ContentCardHeader>

                <ContentCardBody>
                    <div className="space-y-6">
                        <div className="rounded-lg border bg-muted/50 p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {passed ? (
                                            <CheckCircle2 className="size-5 text-green-600" />
                                        ) : (
                                            <XCircle className="size-5 text-destructive" />
                                        )}
                                        <h3 className="text-lg font-semibold">
                                            {passed
                                                ? 'Great job!'
                                                : 'Keep trying!'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        You scored {submission.score} out of{' '}
                                        {submission.total} questions
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="size-5 text-yellow-600" />
                                        <span className="text-2xl font-bold">
                                            +{submission.xpEarned} XP
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Attempt {submission.attemptNumber} •{' '}
                                        {Math.round(
                                            submission.xpMultiplier * 100,
                                        )}
                                        % multiplier
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold">
                                Review Your Answers
                            </h4>
                            {questions.map((question, index) => {
                                const result = submission.results[index];
                                const userAnswer = localAnswers[index];

                                return (
                                    <div
                                        key={question.id}
                                        className={cn(
                                            'rounded-lg border p-4',
                                            result.correct
                                                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                                                : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            {result.correct ? (
                                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                                            ) : (
                                                <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <p className="font-medium">
                                                    {index + 1}.{' '}
                                                    {question.question}
                                                </p>
                                                <p className="text-sm">
                                                    <span className="font-medium">
                                                        Your answer:
                                                    </span>{' '}
                                                    {
                                                        question.options[
                                                            userAnswer
                                                        ]
                                                    }
                                                </p>
                                                {result.explanation && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {result.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ContentCardBody>

                {submission.canRetry && (
                    <ContentCardFooter>
                        <Button
                            onClick={handleRetry}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            Try Again
                        </Button>
                    </ContentCardFooter>
                )}
            </ContentCard>
        );
    }

    const answeredCount = localAnswers.filter((a) => a !== -1).length;
    const progressPercentage = (answeredCount / questions.length) * 100;

    return (
        <ContentCard>
            <ContentCardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <ContentCardTitle>{title}</ContentCardTitle>
                        {description && (
                            <ContentCardDescription>
                                {description}
                            </ContentCardDescription>
                        )}
                    </div>
                    <Badge variant="outline" className="text-sm">
                        Question {currentIndex + 1} of {questions.length}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Answered: {answeredCount} / {questions.length}
                        </span>
                        <span className="font-medium">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                    <Progress value={progressPercentage} />
                </div>
            </ContentCardHeader>

            <ContentCardBody>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                            {currentIndex + 1}. {currentQuestion.question}
                        </h3>

                        <RadioGroup
                            value={
                                currentAnswer !== -1
                                    ? currentAnswer.toString()
                                    : undefined
                            }
                            onValueChange={handleAnswerSelect}
                        >
                            {currentQuestion.options.map((option, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50"
                                >
                                    <RadioGroupItem
                                        value={index.toString()}
                                        id={`option-${index}`}
                                    />
                                    <Label
                                        htmlFor={`option-${index}`}
                                        className="flex-1 cursor-pointer text-base"
                                    >
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {errors.answers && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>
                                {errors.answers}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </ContentCardBody>

            <ContentCardFooter>
                <div className="flex w-full items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={isFirstQuestion}
                        className="flex-1"
                    >
                        Previous
                    </Button>

                    {!isLastQuestion ? (
                        <Button
                            onClick={handleNext}
                            disabled={currentAnswer === -1}
                            className="flex-1"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!allAnswered || isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                        </Button>
                    )}
                </div>
            </ContentCardFooter>
        </ContentCard>
    );
}

// ── AssessmentContent Component ──

type AssessmentContentProps = {
    assessment: {
        id: number;
        title: string;
        description?: string;
        instructions?: string;
        timeLimit?: number;
        passingScore: number;
        questions: Array<{
            id: number;
            question: string;
            type: 'multiple_choice' | 'essay';
            options?: string[];
            points: number;
        }>;
        activeSubmission?: {
            id: number;
            startedAt: string;
            answers: Record<
                number,
                { selected_option?: number; answer_text?: string }
            >;
        } | null;
        latestResults?: {
            score: number;
            maxScore: number;
            passed: boolean;
            answers: Array<{
                questionId: number;
                isCorrect?: boolean;
                score: number;
                feedback?: string;
            }>;
        } | null;
    };
    courseSlug: string;
    onBack?: () => void;
};

type AssessmentView = 'overview' | 'attempt' | 'results';

function AssessmentContent({
    assessment,
    courseSlug,
    onBack,
}: AssessmentContentProps) {
    const [view, setView] = useState<AssessmentView>(() => {
        if (assessment.activeSubmission) {
            return 'attempt';
        }
        if (assessment.latestResults) {
            return 'results';
        }
        return 'overview';
    });

    return (
        <div className="flex flex-col gap-6">
            {view === 'overview' && (
                <OverviewView
                    assessment={assessment}
                    courseSlug={courseSlug}
                    onBack={onBack}
                    onViewResults={() => setView('results')}
                />
            )}
            {view === 'attempt' && assessment.activeSubmission && (
                <AttemptView
                    assessment={assessment}
                    courseSlug={courseSlug}
                    submission={assessment.activeSubmission}
                />
            )}
            {view === 'results' && assessment.latestResults && (
                <ResultsView
                    assessment={assessment}
                    results={assessment.latestResults}
                    onBack={() => setView('overview')}
                />
            )}
        </div>
    );
}

function OverviewView({
    assessment,
    courseSlug,
    onBack,
    onViewResults,
}: {
    assessment: AssessmentContentProps['assessment'];
    courseSlug: string;
    onBack?: () => void;
    onViewResults: () => void;
}) {
    const [starting, setStarting] = useState(false);

    const handleStart = () => {
        setStarting(true);
        router.post(
            `/courses/${courseSlug}/assessments/${assessment.id}/start`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setStarting(false),
            },
        );
    };

    const totalPoints = assessment.questions.reduce(
        (sum, q) => sum + q.points,
        0,
    );

    return (
        <>
            <ContentCard>
                <ContentCardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <ContentCardTitle>{assessment.title}</ContentCardTitle>
                            {assessment.description && (
                                <ContentCardDescription>
                                    {assessment.description}
                                </ContentCardDescription>
                            )}
                        </div>
                        {onBack && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onBack}
                                className="shrink-0"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                        )}
                    </div>
                </ContentCardHeader>

                <ContentCardBody>
                    <div className="space-y-6">
                        {assessment.instructions && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {assessment.instructions}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                                <Target className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Passing Score
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {assessment.passingScore}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Total Points
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {totalPoints}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Questions
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {assessment.questions.length}
                                    </p>
                                </div>
                            </div>
                            {assessment.timeLimit && (
                                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Time Limit
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {assessment.timeLimit} min
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Questions</h3>
                            <div className="space-y-2">
                                {assessment.questions.map((q, i) => (
                                    <div
                                        key={q.id}
                                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm">
                                                {q.type === 'multiple_choice'
                                                    ? 'Multiple Choice'
                                                    : 'Essay'}
                                            </span>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {q.points} pts
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ContentCardBody>

                <ContentCardFooter>
                    <Button
                        onClick={handleStart}
                        disabled={starting}
                        className="w-full"
                        size="lg"
                    >
                        {starting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <BookOpen className="mr-2 h-4 w-4" />
                                Start Assessment
                            </>
                        )}
                    </Button>
                    {assessment.latestResults && (
                        <Button
                            variant="outline"
                            onClick={onViewResults}
                            className="w-full"
                        >
                            View Previous Results
                        </Button>
                    )}
                </ContentCardFooter>
            </ContentCard>
        </>
    );
}

function AttemptView({
    assessment,
    courseSlug,
    submission,
}: {
    assessment: AssessmentContentProps['assessment'];
    courseSlug: string;
    submission: NonNullable<AssessmentContentProps['assessment']['activeSubmission']>;
}) {
    const [answers, setAnswers] = useState<
        Record<number, { selected_option?: number; answer_text?: string }>
    >(submission.answers || {});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentQuestion = assessment.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / assessment.questions.length) * 100;

    const [elapsed, setElapsed] = useState(() => {
        const started = new Date(submission.startedAt).getTime();
        return Math.max(0, Math.floor((Date.now() - started) / 1000));
    });

    useEffect(() => {
        const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeLimit = assessment.timeLimit ? assessment.timeLimit * 60 : null;
    const timeRemaining = timeLimit ? timeLimit - elapsed : null;

    useEffect(() => {
        if (timeRemaining !== null && timeRemaining <= 0) {
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining]);

    const autoSave = useCallback(
        (
            questionId: number,
            value: { selected_option?: number; answer_text?: string },
        ) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                fetch(
                    `/courses/${courseSlug}/assessments/${assessment.id}/save-answer`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN':
                                document.querySelector<HTMLMetaElement>(
                                    'meta[name="csrf-token"]',
                                )?.content ?? '',
                            Accept: 'application/json',
                        },
                        body: JSON.stringify({
                            question_id: questionId,
                            ...value,
                        }),
                    },
                );
            }, 800);
        },
        [assessment.id, courseSlug],
    );

    const handleAnswer = (
        questionId: number,
        value: { selected_option?: number; answer_text?: string },
    ) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        autoSave(questionId, value);
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            `/courses/${courseSlug}/assessments/${assessment.id}/submit`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(Math.abs(seconds) / 60);
        const s = Math.abs(seconds) % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <ContentCard>
                <ContentCardBody className="py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Progress
                                </span>
                                <span className="font-medium">
                                    {answeredCount}/{assessment.questions.length}
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        {timeRemaining !== null && (
                            <Badge
                                variant={
                                    timeRemaining < 60 ? 'destructive' : 'outline'
                                }
                                className="shrink-0"
                            >
                                <Clock className="mr-1.5 h-3.5 w-3.5" />
                                {formatTime(timeRemaining)}
                            </Badge>
                        )}
                    </div>
                </ContentCardBody>
            </ContentCard>

            <div className="flex flex-wrap gap-2">
                {assessment.questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                            i === currentIndex
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : answers[q.id]
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {currentQuestion && (
                <ContentCard>
                    <ContentCardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <ContentCardTitle>
                                    Question {currentIndex + 1}
                                </ContentCardTitle>
                                <ContentCardDescription className="mt-2">
                                    {currentQuestion.question}
                                </ContentCardDescription>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                                {currentQuestion.points} pts
                            </Badge>
                        </div>
                    </ContentCardHeader>

                    <ContentCardBody>
                        <QuestionInput
                            question={currentQuestion}
                            value={answers[currentQuestion.id]}
                            onChange={(val) => handleAnswer(currentQuestion.id, val)}
                        />
                    </ContentCardBody>

                    <ContentCardFooter>
                        <div className="flex w-full items-center justify-between">
                            <Button
                                variant="outline"
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex((i) => i - 1)}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Previous
                            </Button>
                            {currentIndex < assessment.questions.length - 1 ? (
                                <Button
                                    onClick={() => setCurrentIndex((i) => i + 1)}
                                >
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="mr-2 h-4 w-4" />
                                            Submit Assessment
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </ContentCardFooter>
                </ContentCard>
            )}
        </div>
    );
}

function ResultsView({
    assessment,
    results,
    onBack,
}: {
    assessment: AssessmentContentProps['assessment'];
    results: NonNullable<AssessmentContentProps['assessment']['latestResults']>;
    onBack: () => void;
}) {
    const passed = results.passed;
    const percentage = Math.round((results.score / results.maxScore) * 100);

    return (
        <div className="space-y-6">
            <ContentCard
                className={cn(
                    passed
                        ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                        : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
                )}
            >
                <ContentCardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <ContentCardTitle>
                                {passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                            </ContentCardTitle>
                            <ContentCardDescription className="mt-1">
                                {assessment.title}
                            </ContentCardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                </ContentCardHeader>

                <ContentCardBody>
                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-4 py-4">
                            {passed ? (
                                <Trophy className="h-16 w-16 text-green-500" />
                            ) : (
                                <AlertCircle className="h-16 w-16 text-amber-500" />
                            )}
                            <div className="text-center">
                                <div className="text-5xl font-bold">
                                    {percentage}%
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {results.score} / {results.maxScore} points
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Progress value={percentage} className="h-3" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span className="font-medium">
                                    Pass: {assessment.passingScore}%
                                </span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                </ContentCardBody>
            </ContentCard>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Answer Details</h3>
                {assessment.questions.map((question, i) => {
                    const answer = results.answers.find(
                        (a) => a.questionId === question.id,
                    );
                    if (!answer) return null;

                    return (
                        <ContentCard key={question.id}>
                            <ContentCardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <ContentCardTitle className="text-base">
                                            Question {i + 1}
                                        </ContentCardTitle>
                                        <ContentCardDescription className="mt-1">
                                            {question.question}
                                        </ContentCardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {answer.isCorrect !== undefined && (
                                            <div
                                                className={cn(
                                                    'flex h-6 w-6 items-center justify-center rounded-full',
                                                    answer.isCorrect
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                                                )}
                                            >
                                                {answer.isCorrect ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                            </div>
                                        )}
                                        <Badge variant="secondary">
                                            {answer.score}/{question.points} pts
                                        </Badge>
                                    </div>
                                </div>
                            </ContentCardHeader>

                            {answer.feedback && (
                                <ContentCardBody>
                                    <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Feedback
                                                </p>
                                                <p className="mt-1 text-sm leading-relaxed">
                                                    {answer.feedback}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </ContentCardBody>
                            )}
                        </ContentCard>
                    );
                })}
            </div>
        </div>
    );
}

function QuestionInput({
    question,
    value,
    onChange,
}: {
    question: AssessmentContentProps['assessment']['questions'][0];
    value?: { selected_option?: number; answer_text?: string };
    onChange: (val: { selected_option?: number; answer_text?: string }) => void;
}) {
    if (question.type === 'multiple_choice' && question.options) {
        return (
            <RadioGroup
                value={value?.selected_option?.toString()}
                onValueChange={(val) =>
                    onChange({ selected_option: parseInt(val) })
                }
            >
                <div className="space-y-3">
                    {question.options.map((option, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                                value?.selected_option === i
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50',
                            )}
                        >
                            <RadioGroupItem value={i.toString()} id={`q-${question.id}-${i}`} />
                            <Label
                                htmlFor={`q-${question.id}-${i}`}
                                className="flex-1 cursor-pointer text-sm"
                            >
                                {option}
                            </Label>
                        </div>
                    ))}
                </div>
            </RadioGroup>
        );
    }

    if (question.type === 'essay') {
        return (
            <div className="space-y-2">
                <Label htmlFor={`q-${question.id}`}>Your Response</Label>
                <Textarea
                    id={`q-${question.id}`}
                    value={value?.answer_text ?? ''}
                    onChange={(e) => onChange({ answer_text: e.target.value })}
                    rows={8}
                    placeholder="Write your detailed response here..."
                    className="resize-y"
                />
                <p className="text-xs text-muted-foreground">
                    Word count:{' '}
                    {value?.answer_text?.trim()
                        ? value.answer_text.trim().split(/\s+/).length
                        : 0}
                </p>
            </div>
        );
    }

    return null;
}

// ── ContentViewer Component ──

type ContentType = 'video' | 'read' | 'reading' | 'quiz' | 'assessment';

type BaseContent = {
    id: number;
    title: string;
    description?: string;
};

type VideoContentData = BaseContent & {
    type: 'video';
    videoUrl: string;
    videoProcessingStatus?: string | null;
};

type DocumentContentData = BaseContent & {
    type: 'read' | 'reading';
    content?: string;
    pdfUrl?: string | null;
    pdfName?: string | null;
};

type QuizContentData = BaseContent & {
    type: 'quiz';
    quizQuestions: Array<{
        id: number;
        question: string;
        options: [string, string, string, string];
        explanation: string;
    }>;
    submission?: {
        score: number;
        total: number;
        results: Array<{
            correct: boolean;
            explanation: string | null;
        }>;
        xpEarned: number;
        pointsEarned: number;
        attemptNumber: number;
        xpMultiplier: number;
        bestScore: number;
        bestTotal: number;
        canRetry: boolean;
    } | null;
};

type AssessmentContentData = {
    type: 'assessment';
    assessment: {
        id: number;
        title: string;
        description?: string;
        instructions?: string;
        timeLimit?: number;
        passingScore: number;
        questions: Array<{
            id: number;
            question: string;
            type: 'multiple_choice' | 'essay';
            options?: string[];
            points: number;
        }>;
        activeSubmission?: {
            id: number;
            startedAt: string;
            answers: Record<
                number,
                { selected_option?: number; answer_text?: string }
            >;
        } | null;
        latestResults?: {
            score: number;
            maxScore: number;
            passed: boolean;
            answers: Array<{
                questionId: number;
                isCorrect?: boolean;
                score: number;
                feedback?: string;
            }>;
        } | null;
    };
};

type ContentData =
    | VideoContentData
    | DocumentContentData
    | QuizContentData
    | AssessmentContentData;

type ContentViewerProps = {
    courseSlug: string;
    lessonId?: number;
    content: ContentData;
    onComplete?: () => void;
    onBack?: () => void;
};

function ContentViewer({
    courseSlug,
    lessonId,
    content,
    onComplete,
    onBack,
}: ContentViewerProps) {
    if (content.type === 'assessment') {
        return (
            <AssessmentContent
                assessment={content.assessment}
                courseSlug={courseSlug}
                onBack={onBack}
            />
        );
    }

    if (!lessonId) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                    Lesson ID is required for task content.
                </AlertDescription>
            </Alert>
        );
    }

    if (content.type === 'video') {
        if (!content.videoUrl) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        Video URL is missing for this task.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <VideoContent
                courseSlug={courseSlug}
                lessonId={lessonId}
                taskId={content.id}
                title={content.title}
                description={content.description}
                videoUrl={content.videoUrl}
                videoProcessingStatus={content.videoProcessingStatus as any}
                onComplete={onComplete}
            />
        );
    }

    if (content.type === 'read' || content.type === 'reading') {
        return (
            <DocumentContent
                courseSlug={courseSlug}
                lessonId={lessonId}
                taskId={content.id}
                title={content.title}
                description={content.description}
                content={content.content}
                pdfUrl={content.pdfUrl ?? undefined}
                pdfName={content.pdfName ?? undefined}
                onComplete={onComplete}
            />
        );
    }

    if (content.type === 'quiz') {
        if (!content.quizQuestions || content.quizQuestions.length === 0) {
            return (
                <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        This quiz has no questions yet.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <QuizContent
                courseSlug={courseSlug}
                lessonId={lessonId}
                taskId={content.id}
                title={content.title}
                description={content.description}
                questions={content.quizQuestions}
                submission={content.submission}
                onComplete={onComplete}
            />
        );
    }

    return (
        <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
                Unknown content type: {(content as any).type}
            </AlertDescription>
        </Alert>
    );
}

// ── Types ──

type QuizSubmission = {
    score: number;
    total: number;
    results: Array<{
        correct: boolean;
        explanation: string | null;
    }>;
    xpEarned: number;
    pointsEarned: number;
    attemptNumber: number;
    xpMultiplier: number;
    bestScore: number;
    bestTotal: number;
    canRetry: boolean;
};

type AssessmentFullData = {
    id: number;
    title: string;
    description?: string;
    instructions?: string;
    timeLimit?: number;
    passingScore: number;
    questions: Array<{
        id: number;
        question: string;
        type: 'multiple_choice' | 'essay';
        options?: string[];
        points: number;
    }>;
    activeSubmission?: {
        id: number;
        startedAt: string;
        answers: Record<
            number,
            { selected_option?: number; answer_text?: string }
        >;
    } | null;
    latestResults?: {
        score: number;
        maxScore: number;
        passed: boolean;
        answers: Array<{
            questionId: number;
            isCorrect?: boolean;
            score: number;
            feedback?: string;
        }>;
    } | null;
    passed: boolean;
};

type TaskType = 'video' | 'read' | 'reading' | 'quiz';

type LessonQuizQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
};

type LessonTask = {
    id: number;
    type: TaskType;
    title: string;
    description: string;
    videoUrl: string | null;
    videoProcessingStatus: string | null;
    pdfUrl: string | null;
    pdfName: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    isCompleted?: boolean;
    quizQuestions: LessonQuizQuestion[];
    submission?: QuizSubmission | null;
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

type EnrollmentData = {
    progressPercentage: number;
    completedAt: string | null;
} | null;

type Props = {
    course: ServerCourse;
    lessons: ServerLesson[];
    enrollment: EnrollmentData;
    assessments: AssessmentFullData[];
};

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

function mapServerLessonsToLessonData(
    serverLessons: ServerLesson[],
): LessonData[] {
    return serverLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.content?.trim() || 'No summary available yet.',
        tasks: lesson.tasks.map((task, index) => {
            const mappedTaskId = task.taskId ?? lesson.id * 1000 + index + 1;
            const displayTaskTitle = normalizeTaskTitle(task.title);
            // Normalize 'reading' → 'read' for consistency
            const normalizedType: TaskType =
                task.type === 'reading' ? 'read' : task.type;

            // Debug: Log quiz questions to verify IDs
            if (task.questions && task.questions.length > 0) {
                console.log(
                    'Quiz questions for task',
                    mappedTaskId,
                    ':',
                    task.questions,
                );
            }

            return {
                id: mappedTaskId,
                type: normalizedType,
                title: displayTaskTitle,
                description: defaultTaskDescription(normalizedType),
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
                    // Real answers are intentionally not exposed by backend payload.
                    correctIndex: -1,
                    explanation:
                        question.explanation ??
                        'Penjelasan jawaban tersedia setelah pengiriman kuis backend.',
                })),
                submission: task.submission ?? null,
            };
        }),
    }));
}

export default function CourseShow({
    course: serverCourse,
    lessons: serverLessons,
    enrollment,
    assessments = [],
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.is_admin || auth.user.role === 'admin';

    const mappedInitialLessons = useMemo(
        () => mapServerLessonsToLessonData(serverLessons),
        [serverLessons],
    );
    const mappedInitialCourse = useMemo(
        () => ({
            title: serverCourse.title,
            summary: serverCourse.summary,
            estimatedMinutes: serverCourse.estimatedMinutes,
            level: 'General',
        }),
        [serverCourse],
    );

    const course = mappedInitialCourse;
    const lessons = mappedInitialLessons;
    const [isEnrolled, setIsEnrolled] = useState(enrollment !== null);
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Track which assessment is currently being viewed
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<
        number | null
    >(null);
    const selectedAssessment =
        assessments.find((a) => a.id === selectedAssessmentId) ?? null;

    const [showAssessment, setShowAssessment] = useState(
        () =>
            selectedAssessment?.activeSubmission !== null &&
            selectedAssessment?.activeSubmission !== undefined,
    );

    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>(
        serverLessons
            .filter((lesson) => lesson.isCompleted)
            .map((lesson) => lesson.id),
    );
    // Restore selected lesson/task from URL hash on initial load
    const initialFromHash = useMemo(() => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const lessonId = params.get('lesson');
        const taskId = params.get('task');

        return {
            lessonId: lessonId ? Number(lessonId) : null,
            taskId: taskId ? Number(taskId) : null,
        };
    }, []);

    const getInitialLessonId = () => {
        if (initialFromHash.lessonId !== null) {
            const exists = mappedInitialLessons.some(
                (l) => l.id === initialFromHash.lessonId,
            );

            if (exists) {
                return initialFromHash.lessonId;
            }
        }

        return mappedInitialLessons[0]?.id ?? null;
    };

    const getInitialTaskId = (lessonId: number | null) => {
        if (lessonId !== null && initialFromHash.taskId !== null) {
            const lesson = mappedInitialLessons.find((l) => l.id === lessonId);
            const exists = lesson?.tasks.some(
                (t) => t.id === initialFromHash.taskId,
            );

            if (exists) {
                return initialFromHash.taskId;
            }
        }

        const lesson = mappedInitialLessons.find((l) => l.id === lessonId);

        return lesson?.tasks[0]?.id ?? null;
    };

    const initLessonId = getInitialLessonId();

    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        initLessonId,
    );
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
        getInitialTaskId(initLessonId),
    );

    const [notice, setNotice] = useState<string | null>(null);

    const [expandedTopicValue, setExpandedTopicValue] = useState<
        string | undefined
    >(initLessonId ? String(initLessonId) : undefined);

    // Handler for task completion from TaskViewer
    const handleTaskComplete = () => {
        // Refresh page data to get updated progress
        router.reload({
            only: ['lessons', 'enrollment'],
            onSuccess: () => {
                // Update completed lessons state for real-time UI update
                if (
                    selectedLesson &&
                    !completedLessonIds.includes(selectedLesson.id)
                ) {
                    setCompletedLessonIds((prev) => [
                        ...prev,
                        selectedLesson.id,
                    ]);
                }
            },
        });
    };

    // Sync URL hash when selected lesson/task changes
    useEffect(() => {
        const params = new URLSearchParams();

        if (selectedLessonId !== null) {
            params.set('lesson', String(selectedLessonId));
        }

        if (selectedTaskId !== null) {
            params.set('task', String(selectedTaskId));
        }

        const hash = params.toString();
        window.history.replaceState(null, '', `#${hash}`);
    }, [selectedLessonId, selectedTaskId]);

    const resolvedSelectedLessonId = useMemo(() => {
        if (lessons.length === 0) {
            return null;
        }

        if (
            selectedLessonId !== null &&
            lessons.some((lesson) => lesson.id === selectedLessonId)
        ) {
            return selectedLessonId;
        }

        return lessons[0].id;
    }, [lessons, selectedLessonId]);

    const selectedLesson = useMemo(
        () =>
            lessons.find((lesson) => lesson.id === resolvedSelectedLessonId) ??
            null,
        [lessons, resolvedSelectedLessonId],
    );

    const resolvedSelectedTaskId = useMemo(() => {
        if (!selectedLesson || selectedLesson.tasks.length === 0) {
            return null;
        }

        if (
            selectedTaskId !== null &&
            selectedLesson.tasks.some((task) => task.id === selectedTaskId)
        ) {
            return selectedTaskId;
        }

        return selectedLesson.tasks[0].id;
    }, [selectedLesson, selectedTaskId]);

    const selectedTask = useMemo(
        () =>
            selectedLesson?.tasks.find(
                (task) => task.id === resolvedSelectedTaskId,
            ) ?? null,
        [resolvedSelectedTaskId, selectedLesson],
    );

    const unlockedLessonIds = useMemo(() => {
        const unlockedMap = new Map<number, boolean>();

        lessons.forEach((lesson, index) => {
            if (isAdmin) {
                unlockedMap.set(lesson.id, true);

                return;
            }

            if (index === 0) {
                unlockedMap.set(lesson.id, true);

                return;
            }

            if (!isEnrolled) {
                unlockedMap.set(lesson.id, false);

                return;
            }

            const previousLesson = lessons[index - 1];
            unlockedMap.set(
                lesson.id,
                previousLesson
                    ? completedLessonIds.includes(previousLesson.id)
                    : true,
            );
        });

        return unlockedMap;
    }, [completedLessonIds, isAdmin, isEnrolled, lessons]);

    const completedCount = useMemo(
        () =>
            lessons.filter((lesson) => completedLessonIds.includes(lesson.id))
                .length,
        [completedLessonIds, lessons],
    );

    const progressPercentage =
        lessons.length > 0
            ? Math.round((completedCount / lessons.length) * 100)
            : 0;

    const handleNextTask = () => {
        if (!selectedLesson) {
            return;
        }

        const currentTaskIndex = selectedLesson.tasks.findIndex(
            (t) => t.id === resolvedSelectedTaskId,
        );

        // Try next task in the same lesson
        if (currentTaskIndex < selectedLesson.tasks.length - 1) {
            setSelectedTaskId(selectedLesson.tasks[currentTaskIndex + 1].id);

            return;
        }

        // Try first task of the next lesson
        const currentLessonIndex = lessons.findIndex(
            (l) => l.id === selectedLesson.id,
        );

        if (currentLessonIndex < lessons.length - 1) {
            const nextLesson = lessons[currentLessonIndex + 1];
            setSelectedLessonId(nextLesson.id);
            setSelectedTaskId(nextLesson.tasks[0]?.id ?? null);
            setExpandedTopicValue(String(nextLesson.id));
        }
    };

    const handlePreviousTask = () => {
        if (!selectedLesson) {
            return;
        }

        const currentTaskIndex = selectedLesson.tasks.findIndex(
            (t) => t.id === resolvedSelectedTaskId,
        );

        // Try previous task in the same lesson
        if (currentTaskIndex > 0) {
            setSelectedTaskId(selectedLesson.tasks[currentTaskIndex - 1].id);

            return;
        }

        // Try last task of the previous lesson
        const currentLessonIndex = lessons.findIndex(
            (l) => l.id === selectedLesson.id,
        );

        if (currentLessonIndex > 0) {
            const prevLesson = lessons[currentLessonIndex - 1];
            setSelectedLessonId(prevLesson.id);
            setSelectedTaskId(
                prevLesson.tasks[prevLesson.tasks.length - 1]?.id ?? null,
            );
            setExpandedTopicValue(String(prevLesson.id));
        }
    };

    const handlePreviousAssessment = () => {
        if (assessmentNavContext.prevAssessment) {
            setSelectedAssessmentId(assessmentNavContext.prevAssessment.id);
        }
    };

    const handleNextAssessment = () => {
        if (assessmentNavContext.nextAssessment) {
            setSelectedAssessmentId(assessmentNavContext.nextAssessment.id);
        }
    };

    // Navigation context for Previous/Next buttons
    const navContext = useMemo(() => {
        if (!selectedLesson || !selectedTask) {
            return { prevTask: null, nextTask: null };
        }

        const currentTaskIndex = selectedLesson.tasks.findIndex(
            (t) => t.id === resolvedSelectedTaskId,
        );
        const currentLessonIndex = lessons.findIndex(
            (l) => l.id === selectedLesson.id,
        );

        let prevTask: { title: string; lessonTitle: string } | null = null;
        let nextTask: { title: string; lessonTitle: string } | null = null;

        if (currentTaskIndex > 0) {
            prevTask = {
                title: selectedLesson.tasks[currentTaskIndex - 1].title,
                lessonTitle: selectedLesson.title,
            };
        } else if (currentLessonIndex > 0) {
            const prevLesson = lessons[currentLessonIndex - 1];
            const lastTask = prevLesson.tasks[prevLesson.tasks.length - 1];

            if (lastTask) {
                prevTask = {
                    title: lastTask.title,
                    lessonTitle: prevLesson.title,
                };
            }
        }

        if (currentTaskIndex < selectedLesson.tasks.length - 1) {
            nextTask = {
                title: selectedLesson.tasks[currentTaskIndex + 1].title,
                lessonTitle: selectedLesson.title,
            };
        } else if (currentLessonIndex < lessons.length - 1) {
            const nextLesson = lessons[currentLessonIndex + 1];
            const firstTask = nextLesson.tasks[0];

            if (firstTask) {
                nextTask = {
                    title: firstTask.title,
                    lessonTitle: nextLesson.title,
                };
            }
        }

        return { prevTask, nextTask };
    }, [selectedLesson, selectedTask, lessons, resolvedSelectedTaskId]);

    // Navigation context for assessments
    const assessmentNavContext = useMemo(() => {
        if (!showAssessment || !selectedAssessmentId) {
            return { prevAssessment: null, nextAssessment: null };
        }

        const currentIndex = assessments.findIndex(
            (a) => a.id === selectedAssessmentId,
        );

        const prevAssessment =
            currentIndex > 0 ? assessments[currentIndex - 1] : null;
        const nextAssessment =
            currentIndex < assessments.length - 1
                ? assessments[currentIndex + 1]
                : null;

        return { prevAssessment, nextAssessment };
    }, [showAssessment, selectedAssessmentId, assessments]);

    const allLessonsCompleted =
        lessons.length > 0 && completedCount === lessons.length;
    const isCourseCompleted =
        allLessonsCompleted && assessments.every((a) => a.passed);

    // Build content data for ContentViewer
    const currentContentData = useMemo(() => {
        // Assessment mode
        if (showAssessment && selectedAssessment) {
            return {
                type: 'assessment' as const,
                assessment: {
                    id: selectedAssessment.id,
                    title: selectedAssessment.title,
                    description: selectedAssessment.description ?? undefined,
                    instructions: undefined,
                    timeLimit: selectedAssessment.timeLimitMinutes ?? undefined,
                    passingScore: selectedAssessment.passingScore,
                    questions: selectedAssessment.questions.map((q) => ({
                        id: q.id,
                        question: q.questionText,
                        type: q.questionType as 'multiple_choice' | 'essay',
                        options: q.options ?? undefined,
                        points: q.points,
                    })),
                    activeSubmission: selectedAssessment.activeSubmission
                        ? {
                              id: selectedAssessment.activeSubmission.id,
                              startedAt:
                                  selectedAssessment.activeSubmission.startedAt,
                              answers: {},
                          }
                        : null,
                    latestResults: selectedAssessment.latestResults
                        ? {
                              score:
                                  selectedAssessment.latestResults.submission
                                      .pointsEarned ?? 0,
                              maxScore:
                                  selectedAssessment.latestResults.submission
                                      .pointsPossible ?? 0,
                              passed: selectedAssessment.latestResults
                                  .submission.passed,
                              answers:
                                  selectedAssessment.latestResults.answers.map(
                                      (a) => ({
                                          questionId: a.questionId,
                                          isCorrect: a.isCorrect ?? undefined,
                                          score: a.pointsAwarded ?? 0,
                                          feedback: a.feedback ?? undefined,
                                      }),
                                  ),
                          }
                        : undefined,
                },
            };
        }

        // Task mode
        if (!selectedTask || !selectedLesson) {
            return null;
        }

        const baseContent = {
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
        };

        if (selectedTask.type === 'video') {
            return {
                ...baseContent,
                type: 'video' as const,
                videoUrl: selectedTask.videoUrl ?? '',
                videoProcessingStatus: selectedTask.videoProcessingStatus,
            };
        }

        if (selectedTask.type === 'read' || selectedTask.type === 'reading') {
            return {
                ...baseContent,
                type: 'read' as const,
                content:
                    serverLessons.find((l) => l.id === selectedLesson.id)
                        ?.content ?? undefined,
                pdfUrl: selectedTask.pdfUrl,
                pdfName: selectedTask.pdfName,
            };
        }

        if (selectedTask.type === 'quiz') {
            return {
                ...baseContent,
                type: 'quiz' as const,
                quizQuestions: selectedTask.quizQuestions,
                submission: selectedTask.submission,
            };
        }

        return null;
    }, [
        showAssessment,
        selectedAssessment,
        selectedTask,
        selectedLesson,
        serverLessons,
    ]);

    useEffect(() => {
        if (!notice) {
            return;
        }

        const timer = window.setTimeout(() => {
            setNotice(null);
        }, 2600);

        return () => {
            window.clearTimeout(timer);
        };
    }, [notice]);

    return (
        <>
            <Head title={`${course.title} - Course Detail`} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                {notice ? (
                    <Alert>
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                ) : null}

                <section className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>{course.title}</TypographyH1>
                        <TypographyMuted className="text-sm/6">
                            {course.summary}
                        </TypographyMuted>
                    </div>
                </section>

                <section className="grid gap-3 lg:grid-cols-[1fr_320px]">
                    {/* Main Content */}
                    <div className="flex flex-col gap-6">
                        {currentContentData ? (
                            <>
                                <ContentViewer
                                    courseSlug={serverCourse.slug}
                                    lessonId={selectedLessonId ?? undefined}
                                    content={currentContentData}
                                    onComplete={handleTaskComplete}
                                    onBack={
                                        showAssessment
                                            ? () => {
                                                  setShowAssessment(false);
                                                  setSelectedAssessmentId(null);
                                              }
                                            : undefined
                                    }
                                />

                                {/* Navigation */}
                                {showAssessment && assessments.length > 1 ? (
                                    <ContentNavigation
                                        hasPrevious={
                                            !!assessmentNavContext.prevAssessment
                                        }
                                        onPrevious={handlePreviousAssessment}
                                        previousLabel="Sebelumnya"
                                        hasNext={
                                            !!assessmentNavContext.nextAssessment
                                        }
                                        onNext={handleNextAssessment}
                                        nextLabel="Berikutnya"
                                        currentIndex={
                                            assessments.findIndex(
                                                (a) =>
                                                    a.id ===
                                                    selectedAssessmentId,
                                            ) + 1
                                        }
                                        totalCount={assessments.length}
                                    />
                                ) : selectedTask ? (
                                    <ContentNavigation
                                        hasPrevious={!!navContext.prevTask}
                                        onPrevious={handlePreviousTask}
                                        previousLabel="Sebelumnya"
                                        hasNext={!!navContext.nextTask}
                                        onNext={handleNextTask}
                                        nextLabel="Berikutnya"
                                        currentIndex={
                                            selectedLesson && selectedTask
                                                ? selectedLesson.tasks.findIndex(
                                                      (t) =>
                                                          t.id ===
                                                          selectedTask.id,
                                                  ) + 1
                                                : undefined
                                        }
                                        totalCount={
                                            selectedLesson?.tasks.length
                                        }
                                    />
                                ) : null}
                            </>
                        ) : (
                            <Empty className="px-2 py-6">
                                <EmptyHeader>
                                    <EmptyTitle>
                                        Tidak Ada Konten Dipilih
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Pilih topik atau assessment untuk
                                        menampilkan konten.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <Card className="lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-2rem)]">
                        <CardHeader className="space-y-2 pb-3">
                            {/* Progress */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs">
                                        Progress
                                    </CardDescription>
                                    <span className="text-xs font-semibold tabular-nums">
                                        {progressPercentage}%
                                    </span>
                                </div>
                                <Progress
                                    value={progressPercentage}
                                    className="h-1"
                                />
                                <CardDescription className="text-[10px]">
                                    {completedCount}/{lessons.length} completed
                                </CardDescription>
                            </div>

                            {/* Enroll Button */}
                            {!isEnrolled && (
                                <Button
                                    onClick={() => {
                                        setIsEnrolling(true);
                                        router.post(
                                            enrollCourse({
                                                course: serverCourse.slug,
                                            }),
                                            {},
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setIsEnrolled(true);
                                                    setNotice(
                                                        'Anda sekarang terdaftar di kursus ini!',
                                                    );
                                                },
                                                onFinish: () => {
                                                    setIsEnrolling(false);
                                                },
                                            },
                                        );
                                    }}
                                    disabled={isEnrolling}
                                    className="w-full h-8"
                                    size="sm"
                                >
                                    <BookOpen className="mr-1.5 size-3" />
                                    <span className="text-xs">
                                        {isEnrolling ? 'Enrolling...' : 'Enroll'}
                                    </span>
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="p-0 pb-3">
                            <Accordion
                                type="single"
                                collapsible
                                value={
                                    selectedLessonId
                                        ? String(selectedLessonId)
                                        : showAssessment
                                          ? 'assessments'
                                          : undefined
                                }
                                onValueChange={(value) => {
                                    if (value === 'assessments') {
                                        // Don't auto-expand
                                    } else if (value) {
                                        const lessonId = Number(value);
                                        const lesson = lessons.find(
                                            (l) => l.id === lessonId,
                                        );
                                        if (lesson?.tasks[0]) {
                                            setSelectedLessonId(lessonId);
                                            setSelectedTaskId(
                                                lesson.tasks[0].id,
                                            );
                                            setShowAssessment(false);
                                            setSelectedAssessmentId(null);
                                        }
                                    }
                                }}
                                className="px-3"
                            >
                                {lessons.map((lesson, index) => {
                                    const isLocked = !(
                                        unlockedLessonIds.get(lesson.id) ?? false
                                    );
                                    const isCompleted =
                                        completedLessonIds.includes(lesson.id);
                                    const completedTaskCount =
                                        lesson.tasks.filter((t) => t.isCompleted)
                                            .length;

                                    return (
                                        <AccordionItem
                                            key={lesson.id}
                                            value={String(lesson.id)}
                                            className={cn(
                                                'border-0',
                                                isLocked && 'opacity-50',
                                            )}
                                        >
                                            <AccordionTrigger
                                                disabled={isLocked}
                                                className="py-2 hover:no-underline [&[data-state=open]]:pb-1"
                                            >
                                                <div className="flex items-center gap-2 text-left">
                                                    {/* Status Icon */}
                                                    <div
                                                        className={cn(
                                                            'flex size-5 shrink-0 items-center justify-center rounded-full',
                                                            isCompleted
                                                                ? 'bg-primary'
                                                                : isLocked
                                                                  ? 'bg-muted'
                                                                  : 'bg-muted',
                                                        )}
                                                    >
                                                        {isLocked ? (
                                                            <Lock className="size-2.5 text-muted-foreground" />
                                                        ) : isCompleted ? (
                                                            <CheckCircle2 className="size-3 text-primary-foreground" />
                                                        ) : (
                                                            <span className="text-[10px] font-semibold">
                                                                {index + 1}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Lesson Title */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium truncate">
                                                            {lesson.title}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {completedTaskCount}/
                                                            {lesson.tasks.length}
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="pb-1">
                                                <div className="space-y-0.5 pl-7">
                                                    {lesson.tasks.map((task) => {
                                                        const ItemIcon =
                                                            task.type === 'video'
                                                                ? PlayCircle
                                                                : task.type ===
                                                                    'quiz'
                                                                  ? ClipboardCheck
                                                                  : task.type ===
                                                                      'read'
                                                                    ? BookOpen
                                                                    : FileText;
                                                        const isActive =
                                                            selectedLessonId ===
                                                                lesson.id &&
                                                            selectedTaskId ===
                                                                task.id;

                                                        return (
                                                            <button
                                                                key={task.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedLessonId(
                                                                        lesson.id,
                                                                    );
                                                                    setSelectedTaskId(
                                                                        task.id,
                                                                    );
                                                                    setShowAssessment(
                                                                        false,
                                                                    );
                                                                    setSelectedAssessmentId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    'group flex items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors w-full',
                                                                    isActive
                                                                        ? 'bg-primary/10 font-medium text-primary'
                                                                        : 'hover:bg-muted/50',
                                                                )}
                                                            >
                                                                {/* Completion */}
                                                                <div
                                                                    className={cn(
                                                                        'size-3 shrink-0 rounded-sm border flex items-center justify-center',
                                                                        task.isCompleted
                                                                            ? 'border-primary bg-primary'
                                                                            : 'border-muted-foreground/30',
                                                                    )}
                                                                >
                                                                    {task.isCompleted && (
                                                                        <CheckCircle2 className="size-2 text-primary-foreground" />
                                                                    )}
                                                                </div>

                                                                {/* Icon */}
                                                                <ItemIcon
                                                                    className={cn(
                                                                        'size-3 shrink-0',
                                                                        isActive
                                                                            ? 'text-primary'
                                                                            : 'text-muted-foreground',
                                                                    )}
                                                                />

                                                                {/* Title */}
                                                                <span className="flex-1 truncate">
                                                                    {task.title}
                                                                </span>

                                                                {/* Active */}
                                                                {isActive && (
                                                                    <ChevronRight className="size-3 shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}

                                {/* Assessments */}
                                {assessments.length > 0 && (
                                    <AccordionItem
                                        value="assessments"
                                        className="border-0"
                                    >
                                        <AccordionTrigger className="py-2 hover:no-underline [&[data-state=open]]:pb-1">
                                            <div className="flex items-center gap-2 text-left">
                                                {/* Trophy Icon */}
                                                <div
                                                    className={cn(
                                                        'flex size-5 shrink-0 items-center justify-center rounded-full',
                                                        assessments.every(
                                                            (a) => a.passed,
                                                        )
                                                            ? 'bg-amber-500'
                                                            : 'bg-muted',
                                                    )}
                                                >
                                                    <Trophy
                                                        className={cn(
                                                            'size-3',
                                                            assessments.every(
                                                                (a) => a.passed,
                                                            )
                                                                ? 'text-white'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    />
                                                </div>

                                                {/* Assessment Title */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium truncate">
                                                        Assessment
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {
                                                            assessments.filter(
                                                                (a) => a.passed,
                                                            ).length
                                                        }
                                                        /{assessments.length}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="pb-1">
                                            <div className="space-y-0.5 pl-7">
                                                {assessments.map(
                                                    (assessment) => {
                                                        const isActive =
                                                            selectedAssessmentId ===
                                                            assessment.id;

                                                        return (
                                                            <button
                                                                key={
                                                                    assessment.id
                                                                }
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedAssessmentId(
                                                                        assessment.id,
                                                                    );
                                                                    setShowAssessment(
                                                                        true,
                                                                    );
                                                                    setSelectedLessonId(
                                                                        null,
                                                                    );
                                                                    setSelectedTaskId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    'group flex items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors w-full',
                                                                    isActive
                                                                        ? 'bg-primary/10 font-medium text-primary'
                                                                        : 'hover:bg-muted/50',
                                                                )}
                                                            >
                                                                {/* Completion */}
                                                                <div
                                                                    className={cn(
                                                                        'size-3 shrink-0 rounded-sm border flex items-center justify-center',
                                                                        assessment.passed
                                                                            ? 'border-primary bg-primary'
                                                                            : 'border-muted-foreground/30',
                                                                    )}
                                                                >
                                                                    {assessment.passed && (
                                                                        <CheckCircle2 className="size-2 text-primary-foreground" />
                                                                    )}
                                                                </div>

                                                                {/* Icon */}
                                                                <ClipboardCheck
                                                                    className={cn(
                                                                        'size-3 shrink-0',
                                                                        isActive
                                                                            ? 'text-primary'
                                                                            : 'text-muted-foreground',
                                                                    )}
                                                                />

                                                                {/* Title */}
                                                                <span className="flex-1 truncate">
                                                                    {
                                                                        assessment.title
                                                                    }
                                                                </span>

                                                                {/* Active */}
                                                                {isActive && (
                                                                    <ChevronRight className="size-3 shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}
                            </Accordion>

                            {/* Completion Badge */}
                            {isCourseCompleted && (
                                <div className="mt-2 px-3">
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-emerald-50/30 p-2.5 dark:from-amber-950/10 dark:to-emerald-950/5">
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-amber-900/30 dark:to-emerald-900/30">
                                            <Trophy className="size-3.5 text-amber-600 dark:text-amber-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                                                Complete! 🎉
                                            </p>
                                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                                                All lessons and assessments
                                                passed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

function CourseShowLayout({ children }: { children: React.ReactNode }) {
    const { course } = usePage<any>().props;

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Kursus',
                    href: coursesIndex(),
                },
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

CourseShow.layout = (page: React.ReactNode) => (
    <CourseShowLayout>{page}</CourseShowLayout>
);
