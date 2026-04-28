import {
    Download,
    FileText,
    Loader2,
    NotebookPen,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    destroy,
    index,
    store,
    update,
    export as exportNotes,
} from '@/actions/App/Http/Controllers/NoteController';

type Note = {
    id: number;
    title: string;
    content: string;
    notable_type: string | null;
    notable_id: number | null;
    created_at: string;
    updated_at: string;
};

type NotePanelProps = {
    notableType?: 'lesson' | 'course' | 'challenge';
    notableId?: number;
    className?: string;
};

export function NotePanel({
    notableType,
    notableId,
    className,
}: NotePanelProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch notes
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (notableType && notableId) {
                const typeMap: Record<string, string> = {
                    lesson: 'App\\Models\\Lesson',
                    course: 'App\\Models\\Course',
                    challenge: 'App\\Models\\Challenge',
                };
                params.notable_type = typeMap[notableType] ?? notableType;
                params.notable_id = String(notableId);
            }

            const url = index.url({ query: params });
            const res = await fetch(url, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            setNotes(json.data ?? []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [notableType, notableId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // Create note
    const handleCreate = async () => {
        if (!newContent.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(store.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((c) => c.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify({
                    title: newTitle || 'Untitled Note',
                    content: newContent,
                    ...(notableType && notableId
                        ? { notable_type: notableType, notable_id: notableId }
                        : {}),
                }),
            });
            if (res.ok) {
                setNewTitle('');
                setNewContent('');
                setIsCreating(false);
                await fetchNotes();
            }
        } finally {
            setSaving(false);
        }
    };

    // Auto-save on edit (debounced)
    const handleAutoSave = useCallback(
        (note: Note, title: string, content: string) => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(async () => {
                try {
                    setSaving(true);
                    await fetch(update.url({ note: note.id }), {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': decodeURIComponent(
                                document.cookie
                                    .split('; ')
                                    .find((c) =>
                                        c.startsWith('XSRF-TOKEN='),
                                    )
                                    ?.split('=')[1] ?? '',
                            ),
                        },
                        body: JSON.stringify({ title, content }),
                    });
                } finally {
                    setSaving(false);
                }
            }, 1500);
        },
        [],
    );

    // Delete note
    const handleDelete = async (note: Note) => {
        try {
            await fetch(destroy.url({ note: note.id }), {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((c) => c.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
            });
            if (activeNote?.id === note.id) {
                setActiveNote(null);
            }
            await fetchNotes();
        } catch {
            // silently fail
        }
    };

    // Export notes
    const handleExport = async () => {
        try {
            const res = await fetch(exportNotes.url(), {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            const blob = new Blob([JSON.stringify(json, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `notes-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // silently fail
        }
    };

    // Open note for editing
    const openNote = (note: Note) => {
        setActiveNote(note);
        setEditTitle(note.title);
        setEditContent(note.content);
        setIsCreating(false);
    };

    return (
        <Card className={cn('flex flex-col', className)}>
            <CardHeader className="gap-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <NotebookPen className="size-4 text-primary" />
                        <CardTitle className="text-sm">Notes</CardTitle>
                        {saving && (
                            <Badge
                                variant="secondary"
                                className="text-[10px]"
                            >
                                <Loader2 className="mr-1 size-3 animate-spin" />
                                Saving...
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={handleExport}
                                    >
                                        <Download className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Export notes</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => {
                                setIsCreating(true);
                                setActiveNote(null);
                                setNewTitle('');
                                setNewContent('');
                            }}
                        >
                            <Plus className="size-3.5" />
                        </Button>
                    </div>
                </div>
                <CardDescription className="text-xs">
                    Take notes while learning — auto-saved as you type.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-2 pt-0">
                {loading ? (
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : isCreating ? (
                    /* ── Create new note form ── */
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">
                                New Note
                            </Label>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={() => setIsCreating(false)}
                            >
                                <X className="size-3" />
                            </Button>
                        </div>
                        <Input
                            placeholder="Note title (optional)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-8 text-xs"
                        />
                        <Textarea
                            placeholder="Write your note..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            className="min-h-[120px] resize-none text-xs"
                        />
                        <Button
                            size="sm"
                            onClick={handleCreate}
                            disabled={!newContent.trim() || saving}
                        >
                            {saving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Save data-icon className="size-3.5" />
                            )}
                            Save Note
                        </Button>
                    </div>
                ) : activeNote ? (
                    /* ── Edit existing note ── */
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">
                                Editing
                            </Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(activeNote)}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={() => setActiveNote(null)}
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                        </div>
                        <Input
                            value={editTitle}
                            onChange={(e) => {
                                setEditTitle(e.target.value);
                                handleAutoSave(
                                    activeNote,
                                    e.target.value,
                                    editContent,
                                );
                            }}
                            className="h-8 text-xs"
                        />
                        <Textarea
                            value={editContent}
                            onChange={(e) => {
                                setEditContent(e.target.value);
                                handleAutoSave(
                                    activeNote,
                                    editTitle,
                                    e.target.value,
                                );
                            }}
                            className="min-h-[120px] resize-none text-xs"
                        />
                    </div>
                ) : notes.length === 0 ? (
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <FileText className="size-8 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">
                            No notes yet. Click + to create one.
                        </p>
                    </div>
                ) : (
                    /* ── Notes list ── */
                    <ScrollArea className="max-h-[300px]">
                        <div className="flex flex-col gap-1.5">
                            {notes.map((note) => (
                                <button
                                    key={note.id}
                                    onClick={() => openNote(note)}
                                    className={cn(
                                        'flex flex-col gap-0.5 rounded-md border p-2 text-left transition-colors',
                                        'hover:bg-accent',
                                    )}
                                >
                                    <span className="line-clamp-1 text-xs font-medium">
                                        {note.title || 'Untitled'}
                                    </span>
                                    <span className="line-clamp-2 text-[10px] text-muted-foreground">
                                        {note.content}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60">
                                        {new Date(
                                            note.updated_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

// ── Floating Note Button (for use in lesson/course pages) ──
export function FloatingNoteButton({
    notableType,
    notableId,
}: {
    notableType: 'lesson' | 'course' | 'challenge';
    notableId: number;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="fixed right-4 bottom-20 z-40 size-12 rounded-full shadow-lg"
                >
                    <NotebookPen className="size-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Notes</DialogTitle>
                    <DialogDescription>
                        Take notes for this {notableType}.
                    </DialogDescription>
                </DialogHeader>
                <NotePanel
                    notableType={notableType}
                    notableId={notableId}
                    className="border-0 shadow-none"
                />
            </DialogContent>
        </Dialog>
    );
}
