import { router } from '@inertiajs/react';
import {
    BookOpenCheck,
    FileText,
    FlaskConical,
    LayoutGrid,
    Search,
    Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SearchController from '@/actions/App/Http/Controllers/SearchController';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { index as coursesIndex } from '@/routes/courses';
import { index as labsIndex } from '@/routes/labs';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type SearchResult = {
    type: 'course' | 'lesson' | 'lab';
    title: string;
    description: string;
    url: string;
    meta: Record<string, string>;
};

const typeIcons: Record<SearchResult['type'], React.ElementType> = {
    course: BookOpenCheck,
    lesson: FileText,
    lab: FlaskConical,
};

const typeLabels: Record<SearchResult['type'], string> = {
    course: 'Kursus',
    lesson: 'Pelajaran',
    lab: 'Laboratorium',
};

const quickLinks = [
    { title: 'Dasbor', href: dashboard.url(), icon: LayoutGrid },
    { title: 'Kursus', href: coursesIndex.url(), icon: BookOpenCheck },
    { title: 'Papan Peringkat', href: leaderboardIndex.url(), icon: Trophy },
    { title: 'Laboratorium', href: labsIndex.url(), icon: FlaskConical },
];

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const abortRef = useRef<AbortController>(null);

    // Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        }

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            setLoading(false);
        }
    }, [open]);

    const performSearch = useCallback((value: string) => {
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (abortRef.current) {
            abortRef.current.abort();
        }

        if (value.trim().length < 2) {
            setResults([]);
            setLoading(false);

            return;
        }

        setLoading(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const controller = new AbortController();
                abortRef.current = controller;

                const url = SearchController.url({ query: { q: value } });
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const data = await response.json();
                setResults(data.results ?? []);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }

                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    function navigateTo(url: string) {
        setOpen(false);
        router.visit(url);
    }

    // Group results by type
    const grouped = results.reduce<Record<string, SearchResult[]>>(
        (acc, result) => {
            const key = result.type;

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(result);

            return acc;
        },
        {},
    );

    const hasResults = results.length > 0;
    const showQuickLinks = query.trim().length < 2;

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            title="Cari Crypter"
            description="Cari kursus, pelajaran, dan laboratorium"
        >
            <CommandInput
                placeholder="Cari kursus, laboratorium..."
                value={query}
                onValueChange={performSearch}
            />
            <CommandList>
                {loading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Spinner className="size-4" />
                        <span>Mencari…</span>
                    </div>
                )}

                {!loading && !hasResults && query.trim().length >= 2 && (
                    <CommandEmpty>Tidak ada hasil untuk "{query}"</CommandEmpty>
                )}

                {/* Quick Links — shown when no search query */}
                {showQuickLinks && (
                    <CommandGroup heading="Tautan Cepat">
                        {quickLinks.map((link) => (
                            <CommandItem
                                key={link.title}
                                value={link.title}
                                onSelect={() => navigateTo(link.href)}
                                className="cursor-pointer"
                            >
                                <link.icon data-icon="inline-start" />
                                <span>{link.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {/* Search Results — grouped by type */}
                {!loading &&
                    Object.entries(grouped).map(([type, items], groupIndex) => (
                        <div key={type}>
                            {groupIndex > 0 && <CommandSeparator />}
                            <CommandGroup
                                heading={
                                    typeLabels[type as SearchResult['type']]
                                }
                            >
                                {items.map((item, index) => {
                                    const Icon = typeIcons[item.type] ?? Search;

                                    return (
                                        <CommandItem
                                            key={`${item.type}-${index}`}
                                            value={`${item.type}-${item.title}`}
                                            onSelect={() =>
                                                navigateTo(item.url)
                                            }
                                            className="cursor-pointer"
                                        >
                                            <Icon data-icon="inline-start" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">
                                                    {item.title}
                                                </span>
                                                {item.description && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </div>
                    ))}

                {/* Keyboard hint */}
                <div className="flex items-center justify-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ↑↓
                    </kbd>
                    <span>Navigasi</span>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ↵
                    </kbd>
                    <span>Buka</span>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        Esc
                    </kbd>
                    <span>Tutup</span>
                </div>
            </CommandList>
        </CommandDialog>
    );
}
