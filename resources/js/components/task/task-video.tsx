import { useHttp } from '@inertiajs/react';
import { AlertCircle, Loader2, RotateCcw, TriangleAlert } from 'lucide-react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TaskCard } from '@/components/task/task-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { complete as completeLesson } from '@/routes/courses/lessons';

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

type TaskVideoProps = {
    courseSlug: string;
    lessonId: number;
    task: {
        id: number;
        title: string;
        description: string;
        videoUrl: string;
        videoProcessingStatus?: VideoProcessingStatus;
    };
    onComplete?: () => void;
};

export function TaskVideo({
    courseSlug,
    lessonId,
    task,
    onComplete,
}: TaskVideoProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Plyr | null>(null);
    const [hasCompleted, setHasCompleted] = useState(false);
    const { http } = useHttp();
    const source = useMemo(
        () => resolvePlayerSource(task.videoUrl),
        [task.videoUrl],
    );

    const processingStatus = task.videoProcessingStatus;

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

        // Clear any existing content
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
                        await http.post(
                            completeLesson.url({
                                course: courseSlug,
                                lesson: lessonId,
                            }),
                            {
                                task_id: task.id,
                            },
                        );

                        toast.success('Video completed! XP awarded.');
                        onComplete?.();
                    } catch (error) {
                        console.error('Failed to mark video complete:', error);
                        toast.error(
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

            // Clear container on cleanup
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [
        source,
        processingStatus,
        courseSlug,
        lessonId,
        task.id,
        hasCompleted,
        http,
        onComplete,
    ]);

    // Processing state
    if (processingStatus === 'pending' || processingStatus === 'processing') {
        return (
            <TaskCard
                title={task.title}
                description={task.description}
                headerAction={
                    <Badge variant="secondary">
                        {processingStatus === 'pending'
                            ? 'Queued'
                            : 'Processing'}
                    </Badge>
                }
            >
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
            </TaskCard>
        );
    }

    // Failed state
    if (processingStatus === 'failed') {
        return (
            <TaskCard
                title={task.title}
                description={task.description}
                headerAction={<Badge variant="destructive">Failed</Badge>}
            >
                <Alert variant="destructive">
                    <TriangleAlert className="size-4" />
                    <AlertTitle>Video Processing Failed</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            The video could not be processed. This might be due
                            to an unsupported format or corrupted file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                        >
                            <RotateCcw className="mr-2 size-4" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </TaskCard>
        );
    }

    // Unsupported source
    if (source.kind === 'unsupported') {
        return (
            <TaskCard title={task.title} description={task.description}>
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Unsupported Video Source</AlertTitle>
                    <AlertDescription>
                        The video URL format is not supported. Please contact
                        support.
                    </AlertDescription>
                </Alert>
            </TaskCard>
        );
    }

    // Video player
    return (
        <TaskCard title={task.title} description={task.description}>
            <div className="overflow-hidden rounded-xl border bg-black">
                <div ref={containerRef} className="aspect-video w-full" />
            </div>
        </TaskCard>
    );
}
