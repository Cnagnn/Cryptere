import { useHttp } from '@inertiajs/react';
import { BookOpen, Download, FileText } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TaskCard } from '@/components/task/task-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { complete as completeLesson } from '@/routes/courses/lessons';

type TaskDocumentProps = {
    courseSlug: string;
    lessonId: number;
    task: {
        id: number;
        title: string;
        description: string;
        content?: string;
        pdfUrl?: string;
        pdfName?: string;
    };
    onComplete?: () => void;
};

export function TaskDocument({
    courseSlug,
    lessonId,
    task,
    onComplete,
}: TaskDocumentProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [readingProgress, setReadingProgress] = useState(0);
    const [hasCompleted, setHasCompleted] = useState(false);
    const { http } = useHttp();

    const hasContent = !!task.content;
    const hasPdf = !!task.pdfUrl;

    const handleComplete = useCallback(async () => {
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

            toast.success('Document completed! XP awarded.');
            onComplete?.();
        } catch (error) {
            console.error('Failed to mark document complete:', error);
            toast.error('Failed to save progress. Please try again.');
            setHasCompleted(false);
        }
    }, [http, courseSlug, lessonId, task.id, onComplete]);

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) {
                return;
            }

            const element = scrollRef.current;
            const scrollTop = element.scrollTop;
            const scrollHeight = element.scrollHeight - element.clientHeight;
            const progress =
                scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

            setReadingProgress(Math.min(100, Math.round(progress)));

            // Mark as complete when scrolled to 90%
            if (progress >= 90 && !hasCompleted) {
                setHasCompleted(true);
                handleComplete();
            }
        };

        const element = scrollRef.current;

        if (element) {
            element.addEventListener('scroll', handleScroll);

            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, [hasCompleted, handleComplete]);

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

            // Mark as complete when scrolled to 90%
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
            <TaskCard title={task.title} description={task.description}>
                <div className="rounded-lg border border-dashed p-6 text-center">
                    <FileText className="mx-auto size-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        No content available for this document yet.
                    </p>
                </div>
            </TaskCard>
        );
    }

    return (
        <TaskCard
            title={task.title}
            description={task.description}
            headerAction={
                <Badge variant="outline">
                    <BookOpen className="mr-1 size-3" />
                    Reading
                </Badge>
            }
        >
            <div className="space-y-4">
                {/* Reading Progress */}
                {hasContent && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Reading Progress
                            </span>
                            <span className="font-medium">
                                {readingProgress}%
                            </span>
                        </div>
                        <Progress value={readingProgress} className="h-2" />
                    </div>
                )}

                <Separator />

                {/* Content Tabs */}
                {hasContent && hasPdf ? (
                    <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="pdf">PDF Document</TabsTrigger>
                        </TabsList>
                        <TabsContent value="content" className="mt-4">
                            <ScrollArea
                                ref={scrollRef}
                                className="h-[600px] rounded-lg border p-6"
                            >
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: task.content ?? '',
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
                                                {task.pdfName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                PDF Document
                                            </p>
                                        </div>
                                    </div>
                                    <Button asChild variant="outline">
                                        <a
                                            href={task.pdfUrl}
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
                                    src={task.pdfUrl}
                                    className="h-[600px] w-full rounded-lg border"
                                    title={task.pdfName}
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
                                __html: task.content ?? '',
                            }}
                        />
                    </ScrollArea>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                                <FileText className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        {task.pdfName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        PDF Document
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline">
                                <a
                                    href={task.pdfUrl}
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
                            src={task.pdfUrl}
                            className="h-[600px] w-full rounded-lg border"
                            title={task.pdfName}
                        />
                    </div>
                )}

                {/* Mark Complete Button */}
                {!hasCompleted && (
                    <div className="flex justify-end">
                        <Button onClick={handleMarkComplete}>
                            Mark as Complete
                        </Button>
                    </div>
                )}
            </div>
        </TaskCard>
    );
}
