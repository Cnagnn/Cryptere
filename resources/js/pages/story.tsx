import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Archive,
    BookOpen,
    Briefcase,
    CheckCircle2,
    Crown,
    Eye,
    Flame,
    Key,
    Link as LinkIcon,
    Lock,
    Mail,
    ScrollText,
    Shield,
    Star,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// ── Types ──

type StoryChapter = {
    id: number;
    slug: string;
    title: string;
    narrative: string | null;
    chapter_number: number;
    unlock_type: string;
    unlock_value: string;
    icon: string;
    is_unlocked: boolean;
    is_read: boolean;
    unlocked_at: string | null;
    read_at: string | null;
    unlock_hint: string;
};

type StorySummary = {
    total: number;
    unlocked: number;
    read: number;
    next_hint: string | null;
    latest_chapter: {
        id: number;
        slug: string;
        title: string;
        chapter_number: number;
        icon: string;
        is_read: boolean;
    } | null;
};

type Props = {
    chapters: StoryChapter[];
    summary: StorySummary;
};

// ── Icon mapping ──

const ICON_MAP: Record<string, typeof ScrollText> = {
    scroll: ScrollText,
    mail: Mail,
    briefcase: Briefcase,
    key: Key,
    shield: Shield,
    link: LinkIcon,
    lock: Lock,
    zap: Zap,
    flame: Flame,
    archive: Archive,
    crown: Crown,
    star: Star,
};

function ChapterIcon({ icon, className }: { icon: string; className?: string }) {
    const IconComponent = ICON_MAP[icon] ?? ScrollText;
    return <IconComponent className={className} />;
}

// ── Act grouping ──

type ActGroup = {
    title: string;
    description: string;
    chapters: StoryChapter[];
};

function groupChaptersIntoActs(chapters: StoryChapter[]): ActGroup[] {
    const acts: ActGroup[] = [
        {
            title: 'Prologue',
            description: 'Your journey begins with a mysterious message...',
            chapters: chapters.filter((c) => c.chapter_number === 0),
        },
        {
            title: 'Act 1: Classical Foundations',
            description: 'Master the ancient art of cryptography',
            chapters: chapters.filter((c) => c.chapter_number >= 1 && c.chapter_number <= 2),
        },
        {
            title: 'Act 2: Modern Arsenal',
            description: 'Wield the power of modern cryptographic tools',
            chapters: chapters.filter((c) => c.chapter_number >= 3 && c.chapter_number <= 4),
        },
        {
            title: 'Act 3: The Final Mission',
            description: 'Lead the operation to secure the digital world',
            chapters: chapters.filter((c) => c.chapter_number === 5),
        },
        {
            title: 'Bonus Chapters',
            description: 'Special missions for elite agents',
            chapters: chapters.filter((c) => c.chapter_number >= 6),
        },
    ];

    return acts.filter((act) => act.chapters.length > 0);
}

// ── Chapter Card ──

function ChapterCard({
    chapter,
    onRead,
}: {
    chapter: StoryChapter;
    onRead: (chapter: StoryChapter) => void;
}) {
    const isUnlocked = chapter.is_unlocked;
    const isRead = chapter.is_read;

    return (
        <Card
            className={cn(
                'group relative transition-all duration-300',
                isUnlocked
                    ? 'cursor-pointer border-primary/20 hover:border-primary/50 hover:shadow-md'
                    : 'cursor-default border-muted opacity-60',
            )}
            onClick={() => isUnlocked && onRead(chapter)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full',
                                isUnlocked
                                    ? isRead
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                        : 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {isUnlocked ? (
                                <ChapterIcon icon={chapter.icon} className="size-5" />
                            ) : (
                                <Lock className="size-5" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-base">
                                {isUnlocked ? chapter.title : '???'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Chapter {chapter.chapter_number}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {isUnlocked && !isRead && (
                            <Badge variant="default" className="text-xs">
                                New
                            </Badge>
                        )}
                        {isRead && (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {isUnlocked ? (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                        Click to read this chapter
                    </p>
                ) : (
                    <p className="text-muted-foreground text-sm italic">
                        {chapter.unlock_hint}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ── Narrative Dialog ──

function NarrativeDialog({
    chapter,
    open,
    onOpenChange,
}: {
    chapter: StoryChapter | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!chapter) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ChapterIcon icon={chapter.icon} className="size-5" />
                        </div>
                        <div>
                            <DialogTitle>{chapter.title}</DialogTitle>
                            <DialogDescription>
                                Chapter {chapter.chapter_number}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <Separator />
                <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                        __html: chapter.narrative
                            ? formatMarkdown(chapter.narrative)
                            : '',
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}

// ── Simple Markdown formatter ──

function formatMarkdown(md: string): string {
    return md
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Horizontal rules
        .replace(/^---$/gm, '<hr />')
        // Paragraphs (double newlines)
        .replace(/\n\n/g, '</p><p>')
        // Line breaks
        .replace(/\n/g, '<br />')
        // Wrap in paragraph
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// ── Timeline connector ──

function TimelineConnector({ isCompleted }: { isCompleted: boolean }) {
    return (
        <div className="flex justify-center py-1">
            <div
                className={cn(
                    'h-8 w-0.5 rounded-full',
                    isCompleted ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-muted',
                )}
            />
        </div>
    );
}

// ── Main Page ──

export default function StoryPage({ chapters, summary }: Props) {
    const [selectedChapter, setSelectedChapter] = useState<StoryChapter | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const acts = groupChaptersIntoActs(chapters);
    const progressPercent = summary.total > 0
        ? Math.round((summary.unlocked / summary.total) * 100)
        : 0;

    function handleReadChapter(chapter: StoryChapter) {
        setSelectedChapter(chapter);
        setDialogOpen(true);

        // Mark as read if not already
        if (!chapter.is_read) {
            router.post(
                `/story/${chapter.id}/read`,
                {},
                { preserveScroll: true, preserveState: true },
            );
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Story', href: '/story' },
            ]}
        >
            <Head title="Story — The Cipher Bureau" />

            <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-6">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <ScrollText className="text-primary size-8" />
                        <TypographyH1>The Cipher Bureau</TypographyH1>
                    </div>
                    <TypographyMuted>
                        Follow the story of your journey as a Crypto Agent. Complete courses,
                        earn badges, and level up to unlock new chapters.
                    </TypographyMuted>
                </div>

                {/* Progress Summary */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Story Progress</p>
                                    <p className="text-muted-foreground text-xs">
                                        {summary.unlocked} of {summary.total} chapters unlocked
                                        {summary.read > 0 && ` · ${summary.read} read`}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-sm">
                                    {progressPercent}%
                                </Badge>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                            {summary.next_hint && (
                                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <Eye className="size-3.5 shrink-0" />
                                    <span>
                                        <strong>Next:</strong> {summary.next_hint}
                                    </span>
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Chapter Timeline */}
                <div className="space-y-8">
                    {acts.map((act, actIndex) => (
                        <div key={act.title} className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold tracking-tight">
                                    {act.title}
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    {act.description}
                                </p>
                            </div>

                            <div className="space-y-0">
                                {act.chapters.map((chapter, chapterIndex) => (
                                    <div key={chapter.id}>
                                        {chapterIndex > 0 && (
                                            <TimelineConnector
                                                isCompleted={chapter.is_unlocked}
                                            />
                                        )}
                                        <ChapterCard
                                            chapter={chapter}
                                            onRead={handleReadChapter}
                                        />
                                    </div>
                                ))}
                            </div>

                            {actIndex < acts.length - 1 && (
                                <div className="flex justify-center py-2">
                                    <div className="bg-border h-12 w-0.5 rounded-full" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Latest Chapter Card */}
                {summary.latest_chapter && !summary.latest_chapter.is_read && (
                    <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <BookOpen className="size-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                    New chapter available!
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    Chapter {summary.latest_chapter.chapter_number}:{' '}
                                    {summary.latest_chapter.title}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => {
                                    const chapter = chapters.find(
                                        (c) => c.id === summary.latest_chapter!.id,
                                    );
                                    if (chapter) handleReadChapter(chapter);
                                }}
                            >
                                Read Now
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Narrative Dialog */}
            <NarrativeDialog
                chapter={selectedChapter}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </AppLayout>
    );
}
