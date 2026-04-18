import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    Filter,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CourseFormDialog } from '@/components/course-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { show as showChallenge } from '@/routes/challenges';
import {
    enroll,
    index as coursesIndex,
    reset as resetCourseProgress,
    show,
} from '@/routes/courses';
import { show as showLab } from '@/routes/labs';
import type { Auth } from '@/types/auth';
import { ChallengeFormDialog } from '../challenges/_components/ChallengeFormDialog';

type CourseCard = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    coverImage: string | null;
    estimatedMinutes: number;
    lessonCount: number;
    enrollmentCount: number;
    isEnrolled: boolean;
    progressPercentage: number | null;
    labGroup?:
        | 'classical'
        | 'symmetric'
        | 'asymmetric'
        | 'hashing'
        | 'signature';
    pointsReward?: number;
    timeStart?: string | null;
    timeEnd?: string | null;
    status?: 'upcoming' | 'active' | 'ended';
    isSolved?: boolean;
};

type CountdownParts = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
};

type Props = {
    courses: CourseCard[];
    catalogMode?: 'learning' | 'labs' | 'challenges';
    sidebarMode?: 'filters' | 'statistics';
    statistics?: Array<{
        label: string;
        value: string;
    }>;
    pageTitle?: string;
    pageDescription?: string;
    headTitle?: string;
};

type SortValue =
    | 'title-asc'
    | 'progress-desc'
    | 'duration-asc'
    | 'learners-desc';

type EnrollmentFilterValue = 'all' | 'enrolled' | 'not-enrolled';
type LabsGroupFilterValue =
    | 'all'
    | 'classical'
    | 'symmetric'
    | 'asymmetric'
    | 'hashing'
    | 'signature';

type CatalogFiltersProps = {
    idPrefix: string;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    isLabsCatalog: boolean;
    isChallengesCatalog: boolean;
    enrollmentFilter: EnrollmentFilterValue;
    onEnrollmentFilterChange: (value: EnrollmentFilterValue) => void;
    labsGroupFilter: LabsGroupFilterValue;
    onLabsGroupFilterChange: (value: LabsGroupFilterValue) => void;
    sortBy: SortValue;
    onSortByChange: (value: SortValue) => void;
    hasActiveFilters: boolean;
    clearFilters: () => void;
    totalCourses: number;
    enrolledCourses: number;
};

const COURSES_PER_PAGE = 9;

function getCountdownParts(
    targetTime: string | null | undefined,
    nowMs: number,
): CountdownParts {
    if (!targetTime) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
        };
    }

    const targetMs = new Date(targetTime).getTime();

    if (Number.isNaN(targetMs)) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
        };
    }

    const diffMs = Math.max(0, targetMs - nowMs);
    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        days,
        hours,
        minutes,
        seconds,
        isExpired: diffMs === 0,
    };
}

function challengeStatusLabel(status: CourseCard['status']): string {
    if (status === 'upcoming') {
        return 'Upcoming';
    }

    if (status === 'ended') {
        return 'Ended';
    }

    return 'Active';
}

type CourseThumbnailProps = {
    title: string;
    coverImage: string | null;
};

function CourseThumbnail({ title, coverImage }: CourseThumbnailProps) {
    const [hasImageError, setHasImageError] = useState(false);
    const hasCoverImage =
        typeof coverImage === 'string' &&
        coverImage.trim() !== '' &&
        !hasImageError;

    return (
        <div className="relative h-36 overflow-hidden rounded-xl border bg-muted/35">
            {hasCoverImage ? (
                <>
                    <img
                        src={coverImage}
                        alt={`${title} cover image`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={() => {
                            setHasImageError(true);
                        }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
                </>
            ) : (
                <div className="absolute inset-0 bg-linear-to-br from-muted via-muted/75 to-muted/55" />
            )}

            <div
                className={cn(
                    'absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5',
                    hasCoverImage
                        ? 'border-white/25 bg-black/50 text-white'
                        : 'border-border/60 bg-background/85 text-muted-foreground',
                )}
            >
                <BookOpenCheck className="size-4" />
                {!hasCoverImage ? (
                    <span className="text-xs font-medium">No thumbnail</span>
                ) : null}
            </div>
        </div>
    );
}

const hardcodedCatalogCourses: CourseCard[] = [
    {
        id: 9001,
        slug: 'caesar-cipher-lab',
        title: 'Caesar Cipher',
        summary:
            'Visualize classic alphabet shifts to understand monoalphabetic substitution.',
        coverImage: null,
        estimatedMinutes: 20,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'classical',
    },
    {
        id: 9002,
        slug: 'vigenere-cipher-lab',
        title: 'Vigenere Cipher',
        summary:
            'Simulate keyword-based polyalphabetic encryption to observe dynamic shift patterns.',
        coverImage: null,
        estimatedMinutes: 25,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'classical',
    },
    {
        id: 9003,
        slug: 'aes-lab',
        title: 'AES',
        summary:
            'Explore a modern block cipher with focus on operation modes and plaintext change effects.',
        coverImage: null,
        estimatedMinutes: 30,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'symmetric',
    },
    {
        id: 9004,
        slug: 'rsa-lab',
        title: 'RSA',
        summary:
            'Visualize public-private key concepts with prime-number-based encryption and decryption.',
        coverImage: null,
        estimatedMinutes: 30,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'asymmetric',
    },
    {
        id: 9005,
        slug: 'sha-lab',
        title: 'SHA',
        summary:
            'Simulate one-way hashing to inspect avalanche effects and data integrity.',
        coverImage: null,
        estimatedMinutes: 20,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'hashing',
    },
    {
        id: 9006,
        slug: 'digital-signature-lab',
        title: 'Digital Signature',
        summary:
            'Demonstrate digital signature flow for authentication, integrity, and non-repudiation.',
        coverImage: null,
        estimatedMinutes: 25,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'signature',
    },
];

function CatalogFilters({
    idPrefix,
    searchTerm,
    onSearchTermChange,
    isLabsCatalog,
    isChallengesCatalog,
    enrollmentFilter,
    onEnrollmentFilterChange,
    labsGroupFilter,
    onLabsGroupFilterChange,
    sortBy,
    onSortByChange,
    hasActiveFilters,
    clearFilters,
    totalCourses,
    enrolledCourses,
}: CatalogFiltersProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="mt-1 flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-search`}>Search</Label>
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id={`${idPrefix}-search`}
                        value={searchTerm}
                        onChange={(event) =>
                            onSearchTermChange(event.target.value)
                        }
                        placeholder={
                            isLabsCatalog
                                ? 'Algorithm name, summary, or keyword'
                                : isChallengesCatalog
                                  ? 'Challenge title, prompt, or keyword'
                                  : 'Course title, summary, or topic'
                        }
                        className="pl-8"
                    />
                </div>
            </div>

            {!isChallengesCatalog ? (
                <div className="flex flex-col gap-2">
                    <Label>
                        {isLabsCatalog ? 'Algorithm group' : 'Enrollment'}
                    </Label>
                    {isLabsCatalog ? (
                        <Select
                            value={labsGroupFilter}
                            onValueChange={(value) =>
                                onLabsGroupFilterChange(
                                    value as LabsGroupFilterValue,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All groups" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All groups</SelectItem>
                                <SelectItem value="classical">
                                    Classical
                                </SelectItem>
                                <SelectItem value="symmetric">
                                    Symmetric
                                </SelectItem>
                                <SelectItem value="asymmetric">
                                    Asymmetric
                                </SelectItem>
                                <SelectItem value="hashing">Hashing</SelectItem>
                                <SelectItem value="signature">
                                    Digital signature
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <Select
                            value={enrollmentFilter}
                            onValueChange={(value) =>
                                onEnrollmentFilterChange(
                                    value as EnrollmentFilterValue,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All statuses
                                </SelectItem>
                                <SelectItem value="enrolled">
                                    Enrolled
                                </SelectItem>
                                <SelectItem value="not-enrolled">
                                    Not enrolled
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            ) : null}

            {isLabsCatalog || isChallengesCatalog ? null : (
                <div className="flex flex-col gap-2">
                    <Label>Sort by</Label>
                    <Select
                        value={sortBy}
                        onValueChange={(value) =>
                            onSortByChange(value as SortValue)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sort courses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="title-asc">Title A-Z</SelectItem>
                            <SelectItem value="progress-desc">
                                Progress highest
                            </SelectItem>
                            <SelectItem value="duration-asc">
                                Duration shortest
                            </SelectItem>
                            <SelectItem value="learners-desc">
                                Most learners
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!hasActiveFilters}
                    onClick={clearFilters}
                >
                    Reset controls
                </Button>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                <p>
                    {totalCourses}{' '}
                    {isLabsCatalog
                        ? 'lab module(s).'
                        : isChallengesCatalog
                          ? 'published challenge(s).'
                          : 'published course(s).'}
                </p>
                <p className="mt-1">
                    {isLabsCatalog
                        ? 'Simulation-only catalog. No progress or points tracked.'
                        : isChallengesCatalog
                          ? 'Challenge submissions tracked per challenge card.'
                          : `${enrolledCourses} enrolled in your current catalog.`}
                </p>
            </div>
        </div>
    );
}

function CatalogStatistics({
    statistics,
}: {
    statistics: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="flex flex-col gap-3">
            {statistics.map((item) => (
                <div
                    key={item.label}
                    className="rounded-md border bg-muted/20 p-3"
                >
                    <p className="text-sm text-muted-foreground">
                        {item.label}
                    </p>
                    <p className="mt-1 text-lg leading-tight font-semibold tracking-tight">
                        {item.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default function CoursesIndex({
    courses,
    catalogMode = 'learning',
    sidebarMode = 'filters',
    statistics = [],
    pageTitle = 'Course catalog',
    pageDescription = 'Discover the right track, refine results with filters, then continue your lessons with a clear action path.',
    headTitle = 'Courses',
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isLabsCatalog = catalogMode === 'labs';
    const isChallengesCatalog = catalogMode === 'challenges';
    const isAdmin = auth.user.is_admin;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [enrollmentFilter, setEnrollmentFilter] =
        useState<EnrollmentFilterValue>('all');
    const [labsGroupFilter, setLabsGroupFilter] =
        useState<LabsGroupFilterValue>('all');
    const [sortBy, setSortBy] = useState<SortValue>('title-asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 250);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!isChallengesCatalog) {
            return;
        }

        const timer = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, [isChallengesCatalog]);

    const catalogCourses = useMemo(() => {
        if (isLabsCatalog && courses.length === 0) {
            return hardcodedCatalogCourses;
        }

        return courses;
    }, [courses, isLabsCatalog]);

    const visibleCourses = useMemo(() => {
        const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

        const filteredCourses = catalogCourses.filter((course) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                `${course.title} ${course.summary}`
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesEnrollmentOrGroup = isLabsCatalog
                ? labsGroupFilter === 'all' ||
                  course.labGroup === labsGroupFilter
                : isChallengesCatalog
                  ? true
                  : enrollmentFilter === 'all' ||
                    (enrollmentFilter === 'enrolled' && course.isEnrolled) ||
                    (enrollmentFilter === 'not-enrolled' && !course.isEnrolled);

            return matchesSearch && matchesEnrollmentOrGroup;
        });

        return filteredCourses.sort((firstCourse, secondCourse) => {
            switch (sortBy) {
                case 'progress-desc':
                    return (
                        (secondCourse.progressPercentage ?? 0) -
                        (firstCourse.progressPercentage ?? 0)
                    );
                case 'duration-asc':
                    return (
                        firstCourse.estimatedMinutes -
                        secondCourse.estimatedMinutes
                    );
                case 'learners-desc':
                    return (
                        secondCourse.enrollmentCount -
                        firstCourse.enrollmentCount
                    );
                default:
                    return firstCourse.title.localeCompare(secondCourse.title);
            }
        });
    }, [
        catalogCourses,
        debouncedSearchTerm,
        enrollmentFilter,
        isChallengesCatalog,
        isLabsCatalog,
        labsGroupFilter,
        sortBy,
    ]);

    const clearFilters = (): void => {
        setSearchTerm('');
        setEnrollmentFilter('all');
        setLabsGroupFilter('all');
        setSortBy('title-asc');
        setCurrentPage(1);
    };

    const hasActiveFilters =
        searchTerm.length > 0 ||
        (isLabsCatalog
            ? labsGroupFilter !== 'all'
            : !isChallengesCatalog && enrollmentFilter !== 'all') ||
        (!isLabsCatalog && !isChallengesCatalog && sortBy !== 'title-asc');

    const hasPublishedCourses = catalogCourses.length > 0;
    const hasVisibleCourses = visibleCourses.length > 0;
    const isSearchSyncing = debouncedSearchTerm !== searchTerm;
    const totalPages = Math.max(
        1,
        Math.ceil(visibleCourses.length / COURSES_PER_PAGE),
    );
    const activePage = Math.min(currentPage, totalPages);
    const hasPreviousPage = activePage > 1;
    const hasNextPage = activePage < totalPages;

    const paginatedCourses = useMemo(() => {
        const start = (activePage - 1) * COURSES_PER_PAGE;
        const end = start + COURSES_PER_PAGE;

        return visibleCourses.slice(start, end);
    }, [visibleCourses, activePage]);

    const buildPaginationItems = (): Array<number | 'ellipsis'> => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const items: Array<number | 'ellipsis'> = [1];
        const windowStart = Math.max(activePage - 1, 2);
        const windowEnd = Math.min(activePage + 1, totalPages - 1);

        if (windowStart > 2) {
            items.push('ellipsis');
        }

        for (let page = windowStart; page <= windowEnd; page += 1) {
            items.push(page);
        }

        if (windowEnd < totalPages - 1) {
            items.push('ellipsis');
        }

        items.push(totalPages);

        return items;
    };

    const paginationItems = buildPaginationItems();

    const enrollmentSummary = catalogCourses.filter(
        (course) => course.isEnrolled,
    ).length;
    const activeFilterChips = [
        searchTerm.trim().length > 0
            ? {
                  key: 'search',
                  label: `Search: ${searchTerm.trim()}`,
                  onClear: () => setSearchTerm(''),
              }
            : null,
        !isLabsCatalog && !isChallengesCatalog && enrollmentFilter !== 'all'
            ? {
                  key: 'group',
                  label:
                      enrollmentFilter === 'enrolled'
                          ? 'Enrollment: Enrolled'
                          : 'Enrollment: Not enrolled',
                  onClear: () => {
                      setEnrollmentFilter('all');
                  },
              }
            : null,
        !isLabsCatalog && !isChallengesCatalog && sortBy !== 'title-asc'
            ? {
                  key: 'sort',
                  label: `Sort: ${sortBy.replace('-', ' ')}`,
                  onClear: () => setSortBy('title-asc' as SortValue),
              }
            : null,
    ].filter(
        (chip): chip is { key: string; label: string; onClear: () => void } =>
            chip !== null,
    );

    const activeFilterCount = activeFilterChips.length;

    return (
        <>
            <Head title={headTitle} />

            <div className="flex flex-col gap-6 px-4 py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl leading-tight font-semibold tracking-tight">
                            {pageTitle}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {pageDescription}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        {isAdmin && isChallengesCatalog && (
                            <>
                                <Button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Add Challenge
                                </Button>
                                <ChallengeFormDialog
                                    mode="create"
                                    open={isCreateModalOpen}
                                    onOpenChange={setIsCreateModalOpen}
                                />
                            </>
                        )}
                        {isAdmin && !isChallengesCatalog && !isLabsCatalog && (
                            <>
                                <Button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Add Course
                                </Button>
                                <CourseFormDialog
                                    mode="create"
                                    open={isCreateModalOpen}
                                    onOpenChange={setIsCreateModalOpen}
                                />
                            </>
                        )}

                        <div className="lg:hidden">
                            {sidebarMode === 'filters' ? (
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Filter className="size-4" />
                                            Filters
                                            {activeFilterCount > 0 ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1"
                                                >
                                                    {activeFilterCount}
                                                </Badge>
                                            ) : null}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="left"
                                        className="w-full sm:max-w-sm"
                                    >
                                        <SheetHeader className="px-4">
                                            <SheetTitle className="text-base">
                                                Sort and filter
                                            </SheetTitle>
                                            <SheetDescription>
                                                {isLabsCatalog
                                                    ? 'Refine labs by keyword, group, and sort mode.'
                                                    : isChallengesCatalog
                                                      ? 'Refine challenge cards by keyword and availability.'
                                                      : 'Refine your catalog before you enroll or continue.'}
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="px-4 pb-6">
                                            <CatalogFilters
                                                idPrefix="mobile"
                                                searchTerm={searchTerm}
                                                onSearchTermChange={(value) => {
                                                    setSearchTerm(value);
                                                    setCurrentPage(1);
                                                }}
                                                isLabsCatalog={isLabsCatalog}
                                                isChallengesCatalog={
                                                    isChallengesCatalog
                                                }
                                                enrollmentFilter={
                                                    enrollmentFilter
                                                }
                                                onEnrollmentFilterChange={(
                                                    value,
                                                ) => {
                                                    setEnrollmentFilter(value);
                                                    setCurrentPage(1);
                                                }}
                                                labsGroupFilter={
                                                    labsGroupFilter
                                                }
                                                onLabsGroupFilterChange={(
                                                    value,
                                                ) => {
                                                    setLabsGroupFilter(value);
                                                    setCurrentPage(1);
                                                }}
                                                sortBy={sortBy}
                                                onSortByChange={(value) => {
                                                    setSortBy(value);
                                                    setCurrentPage(1);
                                                }}
                                                hasActiveFilters={
                                                    hasActiveFilters
                                                }
                                                clearFilters={clearFilters}
                                                totalCourses={
                                                    catalogCourses.length
                                                }
                                                enrolledCourses={
                                                    enrollmentSummary
                                                }
                                            />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            ) : (
                                <Card className="w-full sm:w-72">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Statistics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CatalogStatistics
                                            statistics={statistics}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
                    <Card className="hidden h-fit lg:sticky lg:top-20 lg:block">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {sidebarMode === 'filters'
                                    ? 'Sort and filter'
                                    : 'Statistics'}
                            </CardTitle>
                            <CardDescription>
                                {sidebarMode === 'filters'
                                    ? isLabsCatalog
                                        ? 'Refine your labs by keyword, algorithm group, and sort mode.'
                                        : isChallengesCatalog
                                          ? 'Refine challenge cards by keyword and availability.'
                                          : 'Focus your learning path by keyword, status, and sort mode.'
                                    : 'Quick snapshot for this page.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sidebarMode === 'filters' ? (
                                <CatalogFilters
                                    idPrefix="desktop"
                                    searchTerm={searchTerm}
                                    onSearchTermChange={(value) => {
                                        setSearchTerm(value);
                                        setCurrentPage(1);
                                    }}
                                    isLabsCatalog={isLabsCatalog}
                                    isChallengesCatalog={isChallengesCatalog}
                                    enrollmentFilter={enrollmentFilter}
                                    onEnrollmentFilterChange={(value) => {
                                        setEnrollmentFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    labsGroupFilter={labsGroupFilter}
                                    onLabsGroupFilterChange={(value) => {
                                        setLabsGroupFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    sortBy={sortBy}
                                    onSortByChange={(value) => {
                                        setSortBy(value);
                                        setCurrentPage(1);
                                    }}
                                    hasActiveFilters={hasActiveFilters}
                                    clearFilters={clearFilters}
                                    totalCourses={catalogCourses.length}
                                    enrolledCourses={enrollmentSummary}
                                />
                            ) : (
                                <CatalogStatistics statistics={statistics} />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4">
                        {hasPublishedCourses &&
                            activeFilterChips.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {activeFilterChips.map((chip) => (
                                        <Badge
                                            key={chip.key}
                                            variant="secondary"
                                            className="gap-1 pr-1"
                                        >
                                            <span>{chip.label}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => {
                                                    chip.onClear();
                                                    setCurrentPage(1);
                                                }}
                                                className="size-5"
                                                aria-label={`Clear ${chip.label}`}
                                            >
                                                <X />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                        {!hasPublishedCourses && isLabsCatalog && (
                            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                                {hardcodedCatalogCourses.map((course) => (
                                    <Card
                                        key={course.id}
                                        className="flex h-full flex-col overflow-hidden"
                                    >
                                        <CardHeader className="flex flex-col gap-4">
                                            <CourseThumbnail
                                                title={course.title}
                                                coverImage={course.coverImage}
                                            />

                                            <div className="flex flex-col gap-2">
                                                <CardTitle className="text-xl leading-tight tracking-tight">
                                                    {course.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm leading-relaxed">
                                                    {course.summary}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>

                                        {!isLabsCatalog &&
                                        !isChallengesCatalog ? (
                                            <CardContent className="flex flex-col gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <span>
                                                            Not enrolled yet
                                                        </span>
                                                        <span>0%</span>
                                                    </div>
                                                    <Progress
                                                        value={0}
                                                        className="h-2"
                                                    />
                                                </div>
                                            </CardContent>
                                        ) : null}

                                        <CardFooter className="mt-auto">
                                            <Button
                                                type="button"
                                                variant={
                                                    isLabsCatalog
                                                        ? 'outline'
                                                        : 'secondary'
                                                }
                                                disabled
                                                className="w-full"
                                            >
                                                {isLabsCatalog
                                                    ? 'Open simulation'
                                                    : isChallengesCatalog
                                                      ? 'Open challenge'
                                                      : 'Coming soon'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {!hasPublishedCourses && !isLabsCatalog && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {isChallengesCatalog
                                            ? 'No challenge has been published yet'
                                            : 'No course has been published yet'}
                                    </CardTitle>
                                    <CardDescription>
                                        {isChallengesCatalog
                                            ? 'Return later or ask an admin to publish the next challenge batch.'
                                            : 'Return later or ask an admin to publish learning tracks.'}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}

                        {hasPublishedCourses && isSearchSyncing && (
                            <div
                                className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
                                aria-live="polite"
                            >
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <Card
                                        key={`course-skeleton-${index}`}
                                        className="overflow-hidden"
                                    >
                                        <CardHeader className="flex flex-col gap-3">
                                            <Skeleton className="h-32 w-full rounded-xl" />
                                            <Skeleton className="h-5 w-2/3" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                        </CardHeader>
                                        <CardContent className="flex flex-col gap-3">
                                            <Skeleton className="h-2 w-full" />
                                            <Skeleton className="h-9 w-full" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {hasPublishedCourses &&
                            !isSearchSyncing &&
                            !hasVisibleCourses && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {isChallengesCatalog
                                                ? 'No challenge matches current controls'
                                                : 'No course matches current controls'}
                                        </CardTitle>
                                        <CardDescription>
                                            Broaden your search or reset filters
                                            to reveal more
                                            {isChallengesCatalog
                                                ? ' challenge cards.'
                                                : ' tracks.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={clearFilters}
                                        >
                                            Reset controls
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                        {hasPublishedCourses &&
                            !isSearchSyncing &&
                            hasVisibleCourses && (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                                        {paginatedCourses.map((course) => (
                                            <Card
                                                key={course.id}
                                                className="flex h-full flex-col overflow-hidden"
                                            >
                                                <CardHeader className="flex flex-col gap-4">
                                                    <CourseThumbnail
                                                        title={course.title}
                                                        coverImage={
                                                            course.coverImage
                                                        }
                                                    />

                                                    <div className="flex flex-col gap-2">
                                                        {isChallengesCatalog ? (
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {isChallengesCatalog &&
                                                                typeof course.pointsReward ===
                                                                    'number' ? (
                                                                    <Badge variant="secondary">
                                                                        {
                                                                            course.pointsReward
                                                                        }{' '}
                                                                        points
                                                                    </Badge>
                                                                ) : null}
                                                                {isChallengesCatalog ? (
                                                                    <Badge variant="outline">
                                                                        {challengeStatusLabel(
                                                                            course.status,
                                                                        )}
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                        <CardTitle className="text-xl leading-tight tracking-tight">
                                                            {course.title}
                                                        </CardTitle>
                                                        <CardDescription className="text-sm leading-relaxed">
                                                            {course.summary}
                                                        </CardDescription>
                                                    </div>
                                                </CardHeader>

                                                {!isLabsCatalog &&
                                                !isChallengesCatalog ? (
                                                    <CardContent className="flex flex-col gap-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            {/** Keep numeric progress centralized for button and bar logic. */}
                                                            {(() => {
                                                                const progressPercentage =
                                                                    course.progressPercentage ??
                                                                    0;

                                                                return (
                                                                    <>
                                                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                            <span>
                                                                                {course.isEnrolled
                                                                                    ? 'Your progress'
                                                                                    : 'Not enrolled yet'}
                                                                            </span>
                                                                            <span>
                                                                                {course.isEnrolled
                                                                                    ? progressPercentage
                                                                                    : 0}

                                                                                %
                                                                            </span>
                                                                        </div>
                                                                        <Progress
                                                                            value={
                                                                                course.isEnrolled
                                                                                    ? progressPercentage
                                                                                    : 0
                                                                            }
                                                                            className="h-2"
                                                                        />
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </CardContent>
                                                ) : isChallengesCatalog ? (
                                                    <CardContent className="flex flex-col gap-4">
                                                        <div className="rounded-md border bg-muted/20 p-3">
                                                            {(() => {
                                                                const countdown =
                                                                    getCountdownParts(
                                                                        course.timeEnd ??
                                                                            null,
                                                                        nowMs,
                                                                    );

                                                                return (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {course.status ===
                                                                        'upcoming'
                                                                            ? course.timeStart
                                                                                ? `Starts at ${new Date(course.timeStart).toLocaleString('en-US')}`
                                                                                : 'Challenge will start soon.'
                                                                            : course.status ===
                                                                                'ended'
                                                                              ? 'Challenge window has ended.'
                                                                              : course.timeEnd
                                                                                ? countdown.isExpired
                                                                                    ? 'Challenge window has ended.'
                                                                                    : `Time left: ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
                                                                                : 'Challenge end time is not set yet.'}
                                                                    </p>
                                                                );
                                                            })()}
                                                        </div>
                                                    </CardContent>
                                                ) : null}

                                                <CardFooter
                                                    className={
                                                        isLabsCatalog ||
                                                        isChallengesCatalog
                                                            ? 'mt-auto'
                                                            : course.isEnrolled
                                                              ? 'mt-auto grid grid-cols-2 gap-2'
                                                              : 'mt-auto'
                                                    }
                                                >
                                                    {isLabsCatalog ? (
                                                        <Button
                                                            asChild
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full"
                                                        >
                                                            <Link
                                                                href={showLab({
                                                                    lab: course.slug,
                                                                })}
                                                                prefetch
                                                            >
                                                                Open simulation
                                                                <ArrowRight className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    ) : isChallengesCatalog ? (
                                                        <Button
                                                            asChild
                                                            type="button"
                                                            variant={
                                                                course.isSolved
                                                                    ? 'outline'
                                                                    : 'secondary'
                                                            }
                                                            className="w-full"
                                                        >
                                                            <Link
                                                                href={showChallenge(
                                                                    {
                                                                        challenge:
                                                                            course.slug,
                                                                    },
                                                                )}
                                                                prefetch
                                                            >
                                                                {course.isSolved
                                                                    ? 'Review challenge'
                                                                    : 'Start challenge'}
                                                                <ArrowRight className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    ) : course.isEnrolled ? (
                                                        (() => {
                                                            const progressPercentage =
                                                                course.progressPercentage ??
                                                                0;

                                                            return (
                                                                <>
                                                                    <Form
                                                                        className="w-full"
                                                                        {...resetCourseProgress.form(
                                                                            {
                                                                                course: course.slug,
                                                                            },
                                                                        )}
                                                                    >
                                                                        {({
                                                                            processing,
                                                                        }) => (
                                                                            <Button
                                                                                type="submit"
                                                                                variant="outline"
                                                                                disabled={
                                                                                    processing ||
                                                                                    progressPercentage ===
                                                                                        0
                                                                                }
                                                                                className="w-full"
                                                                            >
                                                                                {processing && (
                                                                                    <Spinner className="size-4" />
                                                                                )}
                                                                                {processing
                                                                                    ? 'Resetting...'
                                                                                    : 'Start Over'}
                                                                            </Button>
                                                                        )}
                                                                    </Form>

                                                                    <Button
                                                                        asChild
                                                                        className="w-full"
                                                                    >
                                                                        <Link
                                                                            href={show(
                                                                                {
                                                                                    course: course.slug,
                                                                                },
                                                                            )}
                                                                            prefetch
                                                                        >
                                                                            Continue
                                                                            <ArrowRight className="size-4" />
                                                                        </Link>
                                                                    </Button>
                                                                </>
                                                            );
                                                        })()
                                                    ) : (
                                                        <Form
                                                            className="w-full"
                                                            {...enroll.form({
                                                                course: course.slug,
                                                            })}
                                                        >
                                                            {({
                                                                processing,
                                                            }) => (
                                                                <Button
                                                                    type="submit"
                                                                    variant="secondary"
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                    className="w-full"
                                                                >
                                                                    {processing && (
                                                                        <Spinner className="size-4" />
                                                                    )}
                                                                    {processing
                                                                        ? 'Enrolling...'
                                                                        : 'Enroll now'}
                                                                </Button>
                                                            )}
                                                        </Form>
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </>
                            )}
                    </div>
                </section>

                {hasPublishedCourses &&
                    !isSearchSyncing &&
                    hasVisibleCourses && (
                        <div className="flex items-center justify-between gap-4">
                            <p className="shrink-0 text-sm text-muted-foreground">
                                Showing{' '}
                                {(activePage - 1) * COURSES_PER_PAGE + 1} -{' '}
                                {Math.min(
                                    activePage * COURSES_PER_PAGE,
                                    visibleCourses.length,
                                )}{' '}
                                of {visibleCourses.length}{' '}
                                {isLabsCatalog
                                    ? 'lab(s)'
                                    : isChallengesCatalog
                                      ? 'challenge(s)'
                                      : 'course(s)'}
                            </p>
                            <Pagination className="mx-0 w-auto justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        {hasPreviousPage ? (
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    setCurrentPage(
                                                        (page) => page - 1,
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <PaginationPrevious
                                                aria-disabled="true"
                                                className="pointer-events-none opacity-50"
                                            />
                                        )}
                                    </PaginationItem>

                                    {paginationItems.map((item, index) => (
                                        <PaginationItem
                                            key={`${item}-${index}`}
                                        >
                                            {item === 'ellipsis' ? (
                                                <PaginationEllipsis />
                                            ) : (
                                                <PaginationLink
                                                    href="#"
                                                    isActive={
                                                        item === activePage
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        setCurrentPage(item);
                                                    }}
                                                >
                                                    {item}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        {hasNextPage ? (
                                            <PaginationNext
                                                href="#"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    setCurrentPage(
                                                        (page) => page + 1,
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <PaginationNext
                                                aria-disabled="true"
                                                className="pointer-events-none opacity-50"
                                            />
                                        )}
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
            </div>
        </>
    );
}

CoursesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Courses',
            href: coursesIndex(),
        },
    ],
};
