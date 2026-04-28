import { usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Loader2,
    MessageCircle,
    Pin,
    Plus,
    ThumbsUp,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

type DiscussionUser = {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
};

type Reply = {
    id: number;
    discussion_id: number;
    user_id: number;
    body: string;
    upvote_count: number;
    created_at: string;
    user: DiscussionUser;
};

type Discussion = {
    id: number;
    user_id: number;
    discussable_type: string;
    discussable_id: number;
    title: string;
    body: string;
    is_pinned: boolean;
    upvote_count: number;
    reply_count: number;
    replies_count?: number;
    created_at: string;
    user: DiscussionUser;
    replies?: Reply[];
};

type PaginatedResponse = {
    data: Discussion[];
    current_page: number;
    last_page: number;
    total: number;
};

type DiscussionPanelProps = {
    discussableType: 'lesson' | 'challenge';
    discussableId: number;
    className?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getXsrfToken(): string {
    return decodeURIComponent(
        document.cookie
            .split('; ')
            .find((c) => c.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? '',
    );
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DiscussionPanel({
    discussableType,
    discussableId,
    className,
}: DiscussionPanelProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const currentUser = auth.user;
    const isAdmin = currentUser.is_admin || currentUser.role === 'admin';

    const [isOpen, setIsOpen] = useState(false);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [loadingReplies, setLoadingReplies] = useState(false);

    // New discussion form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reply form
    const [replyBody, setReplyBody] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Upvoted items tracking
    const [upvotedItems, setUpvotedItems] = useState<Set<string>>(new Set());

    // ─── Fetch discussions ───────────────────────────────────────────────────

    const fetchDiscussions = useCallback(
        async (page = 1) => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    type: discussableType,
                    id: String(discussableId),
                    page: String(page),
                });
                const res = await fetch(`/discussions?${params}`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return;
                const json: PaginatedResponse = await res.json();
                if (page === 1) {
                    setDiscussions(json.data);
                } else {
                    setDiscussions((prev) => [...prev, ...json.data]);
                }
                setCurrentPage(json.current_page);
                setLastPage(json.last_page);
                setTotalCount(json.total);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        },
        [discussableType, discussableId],
    );

    // Lazy-load: only fetch when panel is opened
    useEffect(() => {
        if (isOpen && discussions.length === 0 && !loading) {
            fetchDiscussions(1);
        }
    }, [isOpen, discussions.length, loading, fetchDiscussions]);

    // ─── Fetch single discussion with replies ────────────────────────────────

    const fetchDiscussionDetail = useCallback(async (id: number) => {
        try {
            setLoadingReplies(true);
            const res = await fetch(`/discussions/${id}`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return;
            const discussion: Discussion = await res.json();
            setDiscussions((prev) =>
                prev.map((d) =>
                    d.id === id ? { ...d, replies: discussion.replies } : d,
                ),
            );
        } catch {
            // silently fail
        } finally {
            setLoadingReplies(false);
        }
    }, []);

    // ─── Create discussion ───────────────────────────────────────────────────

    const handleCreateDiscussion = async () => {
        if (!newTitle.trim() || !newBody.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/discussions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    type: discussableType,
                    id: discussableId,
                    title: newTitle,
                    body: newBody,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.xp_awarded > 0) {
                    toast.success(
                        `Discussion posted! +${json.xp_awarded} XP 🎉`,
                    );
                } else {
                    toast.success('Discussion posted!');
                }
                setNewTitle('');
                setNewBody('');
                setShowNewForm(false);
                await fetchDiscussions(1);
            } else if (res.status === 422) {
                const json = await res.json();
                const firstError = Object.values(json.errors ?? {}).flat()[0];
                toast.error(String(firstError) || 'Validation error');
            } else if (res.status === 429) {
                toast.error('Too many requests. Please wait a moment.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Reply ───────────────────────────────────────────────────────────────

    const handleReply = async (discussionId: number) => {
        if (!replyBody.trim()) return;
        setSubmittingReply(true);
        try {
            const res = await fetch(`/discussions/${discussionId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ body: replyBody }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.xp_awarded > 0) {
                    toast.success(`Reply posted! +${json.xp_awarded} XP 🎉`);
                } else {
                    toast.success('Reply posted!');
                }
                setReplyBody('');
                await fetchDiscussionDetail(discussionId);
                // Update reply count in list
                setDiscussions((prev) =>
                    prev.map((d) =>
                        d.id === discussionId
                            ? {
                                  ...d,
                                  reply_count: d.reply_count + 1,
                                  replies_count: (d.replies_count ?? 0) + 1,
                              }
                            : d,
                    ),
                );
            } else if (res.status === 429) {
                toast.error('Too many requests. Please wait a moment.');
            }
        } finally {
            setSubmittingReply(false);
        }
    };

    // ─── Upvote ──────────────────────────────────────────────────────────────

    const handleUpvote = async (
        type: 'discussion' | 'reply',
        id: number,
    ) => {
        const key = `${type}:${id}`;
        try {
            const res = await fetch('/discussions/upvote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ type, id }),
            });
            if (!res.ok) return;
            const json = await res.json();
            const delta = json.upvoted ? 1 : -1;

            setUpvotedItems((prev) => {
                const next = new Set(prev);
                if (json.upvoted) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
                return next;
            });

            if (type === 'discussion') {
                setDiscussions((prev) =>
                    prev.map((d) =>
                        d.id === id
                            ? { ...d, upvote_count: d.upvote_count + delta }
                            : d,
                    ),
                );
            } else {
                // Update reply upvote count
                setDiscussions((prev) =>
                    prev.map((d) => ({
                        ...d,
                        replies: d.replies?.map((r) =>
                            r.id === id
                                ? {
                                      ...r,
                                      upvote_count: r.upvote_count + delta,
                                  }
                                : r,
                        ),
                    })),
                );
            }
        } catch {
            // silently fail
        }
    };

    // ─── Pin ─────────────────────────────────────────────────────────────────

    const handleTogglePin = async (discussionId: number) => {
        try {
            const res = await fetch(`/discussions/${discussionId}/pin`, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            if (!res.ok) return;
            const json = await res.json();
            setDiscussions((prev) =>
                prev.map((d) =>
                    d.id === discussionId
                        ? { ...d, is_pinned: json.is_pinned }
                        : d,
                ),
            );
            toast.success(json.is_pinned ? 'Discussion pinned' : 'Discussion unpinned');
        } catch {
            // silently fail
        }
    };

    // ─── Delete ──────────────────────────────────────────────────────────────

    const handleDelete = async (discussionId: number) => {
        if (!confirm('Are you sure you want to delete this discussion?')) return;
        try {
            const res = await fetch(`/discussions/${discussionId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                setDiscussions((prev) =>
                    prev.filter((d) => d.id !== discussionId),
                );
                setTotalCount((prev) => prev - 1);
                if (expandedId === discussionId) setExpandedId(null);
                toast.success('Discussion deleted');
            }
        } catch {
            // silently fail
        }
    };

    // ─── Expand/collapse discussion ──────────────────────────────────────────

    const handleToggleExpand = (id: number) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        const discussion = discussions.find((d) => d.id === id);
        if (!discussion?.replies) {
            fetchDiscussionDetail(id);
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className={cn('mt-6', className)}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between gap-2"
                    >
                        <span className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Discussions
                            {totalCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {totalCount}
                                </Badge>
                            )}
                        </span>
                        {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3 space-y-3">
                    {/* New Discussion Button / Form */}
                    {showNewForm ? (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    New Discussion
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Share a question or insight with fellow
                                    learners
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Input
                                    placeholder="Discussion title"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                    maxLength={255}
                                />
                                <Textarea
                                    placeholder="What's on your mind?"
                                    value={newBody}
                                    onChange={(e) => setNewBody(e.target.value)}
                                    rows={3}
                                    maxLength={10000}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleCreateDiscussion}
                                        disabled={
                                            submitting ||
                                            !newTitle.trim() ||
                                            !newBody.trim()
                                        }
                                    >
                                        {submitting && (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        )}
                                        Post
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowNewForm(false);
                                            setNewTitle('');
                                            setNewBody('');
                                        }}
                                    >
                                        <X className="mr-1 h-3 w-3" />
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNewForm(true)}
                            className="gap-1"
                        >
                            <Plus className="h-3 w-3" />
                            New Discussion
                        </Button>
                    )}

                    {/* Loading state */}
                    {loading && discussions.length === 0 && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && discussions.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                            <p>No discussions yet.</p>
                            <p>Be the first to start one!</p>
                        </div>
                    )}

                    {/* Discussion list */}
                    {discussions.map((discussion) => (
                        <Card
                            key={discussion.id}
                            className={cn(
                                'transition-colors',
                                discussion.is_pinned &&
                                    'border-primary/30 bg-primary/5',
                            )}
                        >
                            <CardContent className="p-3">
                                {/* Discussion header */}
                                <div
                                    className="cursor-pointer"
                                    onClick={() =>
                                        handleToggleExpand(discussion.id)
                                    }
                                >
                                    <div className="flex items-start gap-2">
                                        <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarImage
                                                src={
                                                    discussion.user?.avatar ??
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback className="text-[10px]">
                                                {getInitials(
                                                    discussion.user?.name ??
                                                        'U',
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                {discussion.is_pinned && (
                                                    <Pin className="h-3 w-3 text-primary" />
                                                )}
                                                <span className="truncate text-sm font-medium">
                                                    {discussion.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    {discussion.user?.name ??
                                                        'Unknown'}
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    {timeAgo(
                                                        discussion.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            {expandedId !== discussion.id && (
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                    {discussion.body.slice(
                                                        0,
                                                        100,
                                                    )}
                                                    {discussion.body.length >
                                                        100 && '…'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-0.5">
                                                <ThumbsUp className="h-3 w-3" />
                                                {discussion.upvote_count}
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                <MessageCircle className="h-3 w-3" />
                                                {discussion.reply_count ??
                                                    discussion.replies_count ??
                                                    0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded discussion */}
                                {expandedId === discussion.id && (
                                    <div className="mt-3 space-y-3 border-t pt-3">
                                        {/* Full body */}
                                        <p className="whitespace-pre-wrap text-sm">
                                            {discussion.body}
                                        </p>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant={
                                                    upvotedItems.has(
                                                        `discussion:${discussion.id}`,
                                                    )
                                                        ? 'default'
                                                        : 'ghost'
                                                }
                                                className="h-7 gap-1 px-2 text-xs"
                                                onClick={() =>
                                                    handleUpvote(
                                                        'discussion',
                                                        discussion.id,
                                                    )
                                                }
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                                {discussion.upvote_count}
                                            </Button>

                                            {isAdmin && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 gap-1 px-2 text-xs"
                                                    onClick={() =>
                                                        handleTogglePin(
                                                            discussion.id,
                                                        )
                                                    }
                                                >
                                                    <Pin className="h-3 w-3" />
                                                    {discussion.is_pinned
                                                        ? 'Unpin'
                                                        : 'Pin'}
                                                </Button>
                                            )}

                                            {(discussion.user_id ===
                                                currentUser.id ||
                                                isAdmin) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(
                                                            discussion.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>

                                        {/* Replies */}
                                        {loadingReplies &&
                                            !discussion.replies && (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                </div>
                                            )}

                                        {discussion.replies &&
                                            discussion.replies.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Replies (
                                                        {
                                                            discussion.replies
                                                                .length
                                                        }
                                                        )
                                                    </p>
                                                    {discussion.replies.map(
                                                        (reply) => (
                                                            <div
                                                                key={reply.id}
                                                                className="rounded-md border bg-muted/30 p-2"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <Avatar className="h-5 w-5 shrink-0">
                                                                        <AvatarImage
                                                                            src={
                                                                                reply
                                                                                    .user
                                                                                    ?.avatar ??
                                                                                undefined
                                                                            }
                                                                        />
                                                                        <AvatarFallback className="text-[8px]">
                                                                            {getInitials(
                                                                                reply
                                                                                    .user
                                                                                    ?.name ??
                                                                                    'U',
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5 text-xs">
                                                                            <span className="font-medium">
                                                                                {reply
                                                                                    .user
                                                                                    ?.name ??
                                                                                    'Unknown'}
                                                                            </span>
                                                                            <span className="text-muted-foreground">
                                                                                ·
                                                                            </span>
                                                                            <span className="text-muted-foreground">
                                                                                {timeAgo(
                                                                                    reply.created_at,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <p className="mt-0.5 whitespace-pre-wrap text-xs">
                                                                            {
                                                                                reply.body
                                                                            }
                                                                        </p>
                                                                        <Button
                                                                            size="sm"
                                                                            variant={
                                                                                upvotedItems.has(
                                                                                    `reply:${reply.id}`,
                                                                                )
                                                                                    ? 'default'
                                                                                    : 'ghost'
                                                                            }
                                                                            className="mt-1 h-6 gap-1 px-1.5 text-[10px]"
                                                                            onClick={() =>
                                                                                handleUpvote(
                                                                                    'reply',
                                                                                    reply.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <ThumbsUp className="h-2.5 w-2.5" />
                                                                            {
                                                                                reply.upvote_count
                                                                            }
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                        {/* Reply form */}
                                        <div className="flex gap-2">
                                            <Textarea
                                                placeholder="Write a reply…"
                                                value={replyBody}
                                                onChange={(e) =>
                                                    setReplyBody(e.target.value)
                                                }
                                                rows={2}
                                                className="min-h-[60px] text-sm"
                                                maxLength={10000}
                                            />
                                            <Button
                                                size="sm"
                                                className="shrink-0 self-end"
                                                disabled={
                                                    submittingReply ||
                                                    !replyBody.trim()
                                                }
                                                onClick={() =>
                                                    handleReply(discussion.id)
                                                }
                                            >
                                                {submittingReply ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    'Reply'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Load more */}
                    {currentPage < lastPage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            disabled={loading}
                            onClick={() => fetchDiscussions(currentPage + 1)}
                        >
                            {loading ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            Load more discussions
                        </Button>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
