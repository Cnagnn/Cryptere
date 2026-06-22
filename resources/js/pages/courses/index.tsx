import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, BookOpenCheck, Filter, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { dashboard } from '@/routes';
import { enroll, reset as resetCourseProgress, show } from '@/routes/courses';
import { index as coursesIndex } from '@/routes/courses';
import { show as showLab } from '@/routes/labs';
import type {
    CatalogFiltersProps,
    CourseCard,
    CoursesIndexProps,
    EnrollmentFilterValue,
    LabsGroupFilterValue,
    SortValue,
} from '@/types/courses';

const COURSES_PER_PAGE = 4;

/* ── Course Thumbnail ── */
function CourseThumbnail({
    coverImage,
    title,
}: {
    coverImage: string | null;
    title: string;
}) {
    return (
        <div className="relative aspect-video overflow-hidden border-b bg-muted/40">
            {coverImage ? (
                <img
                    src={coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <BookOpenCheck
                        className="size-5 text-muted-foreground"
                        aria-hidden="true"
                    />
                </div>
            )}
            <span className="sr-only">Gambar mini {title}</span>
            <div className="hidden h-full w-full items-center justify-center">
                <BookOpenCheck
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                />
            </div>
        </div>
    );
}

/* ── Hardcoded lab catalog courses ── */
const hardcodedCatalogCourses: CourseCard[] = [
    {
        id: 9001,
        slug: 'caesar-cipher-lab',
        title: 'Caesar Cipher',
        summary:
            'Visualisasikan pergeseran alfabet klasik untuk memahami substitusi monoalfabetik.',
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
            'Simulasikan enkripsi polialfabetik berbasis kata kunci untuk mengamati pola pergeseran dinamis.',
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
            'Jelajahi cipher blok modern dengan fokus pada mode operasi dan efek perubahan plaintext.',
        coverImage: null,
        estimatedMinutes: 30,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'symmetric',
    },
    {
        id: 9005,
        slug: 'des-lab',
        title: 'DES',
        summary:
            'Pelajari struktur Feistel dan 16 putaran pada sandi blok klasik dengan visualisasi langkah demi langkah.',
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
            'Visualisasikan konsep kunci publik-privat dengan enkripsi dan dekripsi berbasis bilangan prima.',
        coverImage: null,
        estimatedMinutes: 30,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'asymmetric',
    },
    {
        id: 9006,
        slug: 'digital-signature-lab',
        title: 'Digital Signature',
        summary:
            'Tanda tangan digital RSA untuk autentikasi, integritas, dan non-repudiasi.',
        coverImage: null,
        estimatedMinutes: 25,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: null,
        labGroup: 'signature',
    },
];

/* ── Catalog Filters ── */
function CatalogFilters({
    idPrefix,
    searchTerm,
    onSearchTermChange,
    isLabsCatalog,
    enrollmentFilter,
    onEnrollmentFilterChange,
    labsGroupFilter,
    onLabsGroupFilterChange,
    sortBy,
    onSortByChange,
    hasActiveFilters,
    clearFilters,
    resultCount,
    isSearchSyncing,
}: CatalogFiltersProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="mt-1 flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-search`}>Cari</Label>
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id={`${idPrefix}-search`}
                        value={searchTerm}
                        onChange={(event) =>
                            onSearchTermChange(event.target.value)
                        }
                        placeholder={
                            isLabsCatalog ? 'Cari lab...' : 'Cari kursus...'
                        }
                        className="pr-24 pl-8"
                    />
                    {isSearchSyncing ? (
                        <Spinner className="absolute top-1/2 right-16 size-4 -translate-y-1/2 text-muted-foreground" />
                    ) : (
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                            {resultCount} Hasil
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label>
                    {isLabsCatalog ? 'Grup algoritma' : 'Pendaftaran'}
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
                            <SelectValue placeholder="Semua grup" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua grup</SelectItem>
                            <SelectItem value="classical">Klasik</SelectItem>
                            <SelectItem value="symmetric">Simetris</SelectItem>
                            <SelectItem value="asymmetric">
                                Asimetris
                            </SelectItem>
                            <SelectItem value="signature">
                                Tanda tangan digital
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
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status</SelectItem>
                            <SelectItem value="enrolled">Terdaftar</SelectItem>
                            <SelectItem value="not-enrolled">
                                Belum terdaftar
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {isLabsCatalog ? null : (
                <div className="flex flex-col gap-2">
                    <Label>Urutkan berdasarkan</Label>
                    <Select
                        value={sortBy}
                        onValueChange={(value) =>
                            onSortByChange(value as SortValue)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Urutkan kursus" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="title-asc">Judul A-Z</SelectItem>
                            <SelectItem value="progress-desc">
                                Progres tertinggi
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
                    Atur ulang kontrol
                </Button>
            </div>
        </div>
    );
}

/* ── Catalog Statistics ── */
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
                    <p className="mt-1 text-lg leading-tight font-semibold">
                        {item.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

/* ── Skeleton Grid ── */
function CourseSkeletonGrid() {
    return (
        <div
            className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3"
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
    );
}

/* ── Enrolled Card Footer ── */
function EnrolledCardFooter({ course }: { course: CourseCard }) {
    const progressPercentage = course.progressPercentage ?? 0;
    const [resetting, setResetting] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);

    const handleReset = async () => {
        if (resetting) {
            return;
        }

        setResetting(true);

        try {
            const response = await fetch(
                resetCourseProgress.url({ course: course.slug }),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') ?? '',
                    },
                },
            );

            if (response.ok) {
                toast.success('Progress berhasil direset');
                setShowResetDialog(false);
                router.reload({ only: ['courses'] });
            } else {
                toast.error('Gagal mereset progress');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setResetting(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                disabled={resetting || progressPercentage === 0}
                className="w-full"
                onClick={() => setShowResetDialog(true)}
            >
                {resetting && <Spinner className="size-4" />}
                {resetting ? 'Mengatur ulang...' : 'Mulai Ulang'}
            </Button>

            <Button asChild className="w-full">
                <Link href={show({ course: course.slug })} prefetch>
                    Lanjutkan
                    <ArrowRight className="size-4" />
                </Link>
            </Button>

            <AlertDialog
                open={showResetDialog}
                onOpenChange={setShowResetDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mulai Ulang Course?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Semua progress kamu di course ini akan dihapus dan
                            kamu akan memulai dari awal. Tindakan ini tidak
                            dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resetting}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleReset();
                            }}
                            disabled={resetting}
                        >
                            {resetting && <Spinner className="size-4" />}
                            {resetting
                                ? 'Mengatur ulang...'
                                : 'Ya, Mulai Ulang'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

/* ── Course Card Grid ── */
const LEARNING_ORDER: Record<string, number> = {
    'caesar-cipher-lab': 1,
    'vigenere-cipher-lab': 2,
    'des-lab': 3,
    'aes-lab': 4,
    'rsa-lab': 5,
    'digital-signature-lab': 6,
};

const LEARNING_LABELS: Record<string, string> = {
    'caesar-cipher-lab': 'Mulai dari sini',
    'vigenere-cipher-lab': 'Berikutnya',
    'des-lab': 'Berikutnya',
    'aes-lab': 'Berikutnya',
    'rsa-lab': 'Berikutnya',
    'digital-signature-lab': 'Terakhir',
};

function CourseCardGrid({
    courses,
    isLabsCatalog,
}: {
    courses: CourseCard[];
    isLabsCatalog: boolean;
}) {
    const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(
        null,
    );

    const handleEnroll = async (course: CourseCard) => {
        if (enrollingCourseId) {
            return;
        }

        setEnrollingCourseId(course.id);

        try {
            const response = await fetch(enroll.url({ course: course.slug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
            });

            if (response.ok) {
                toast.success('Berhasil mendaftar!');
                router.reload({ only: ['courses'] });
            } else {
                toast.error('Gagal mendaftar');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setEnrollingCourseId(null);
        }
    };

    return (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    className="relative flex h-full flex-col overflow-hidden pt-0"
                >
                    <CourseThumbnail
                        coverImage={course.coverImage}
                        title={course.title}
                    />

                    <CardHeader>
                        {isLabsCatalog && LEARNING_ORDER[course.slug] && (
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        course.slug === 'caesar-cipher-lab'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-[10px]"
                                >
                                    Langkah {LEARNING_ORDER[course.slug]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {LEARNING_LABELS[course.slug]}
                                </span>
                            </div>
                        )}
                        <CardTitle className="text-xl leading-tight">
                            {course.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                            {course.summary}
                        </CardDescription>
                    </CardHeader>

                    {!isLabsCatalog ? (
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                {(() => {
                                    const progressPercentage =
                                        course.progressPercentage ?? 0;

                                    return (
                                        <>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>
                                                    {course.isEnrolled
                                                        ? 'Progres Anda'
                                                        : 'Belum terdaftar'}
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
                    ) : null}

                    <CardFooter
                        className={
                            isLabsCatalog
                                ? 'mt-auto'
                                : course.isEnrolled
                                  ? 'mt-auto grid gap-2 sm:grid-cols-2'
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
                                    href={showLab({ lab: course.slug })}
                                    prefetch
                                >
                                    Buka simulasi
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        ) : course.isEnrolled ? (
                            <EnrolledCardFooter course={course} />
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={enrollingCourseId === course.id}
                                className="w-full"
                                onClick={() => handleEnroll(course)}
                            >
                                {enrollingCourseId === course.id && (
                                    <Spinner className="size-4" />
                                )}
                                {enrollingCourseId === course.id
                                    ? 'Mendaftar...'
                                    : 'Daftar sekarang'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

/* ── Empty Lab Catalog Grid ── */
function EmptyLabCatalogGrid({
    courses,
    isLabsCatalog,
}: {
    courses: CourseCard[];
    isLabsCatalog: boolean;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <CardHeader className="flex flex-col gap-4">
                        <CourseThumbnail
                            coverImage={course.coverImage}
                            title={course.title}
                        />

                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-xl leading-tight">
                                {course.title}
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                {course.summary}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    {!isLabsCatalog ? (
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Belum terdaftar</span>
                                    <span>0%</span>
                                </div>
                                <Progress value={0} className="h-2" />
                            </div>
                        </CardContent>
                    ) : null}

                    <CardFooter className="mt-auto">
                        <Button
                            type="button"
                            variant={isLabsCatalog ? 'outline' : 'secondary'}
                            disabled
                            className="w-full"
                        >
                            {isLabsCatalog ? 'Buka simulasi' : 'Segera hadir'}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

export default function CoursesIndex({
    courses,
    filters,
    catalogMode = 'learning',
    sidebarMode = 'filters',
    statistics = [],
    pageTitle = 'Kursus',
    pageDescription = 'Jelajahi jalur pembelajaran, filter hasil, dan lanjutkan progres Anda di satu tempat.',
    headTitle = 'Kursus',
}: CoursesIndexProps) {
    const isLabsCatalog = catalogMode === 'labs';
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
        filters?.search ?? '',
    );
    const [enrollmentFilter, setEnrollmentFilter] =
        useState<EnrollmentFilterValue>(filters?.enrollment ?? 'all');
    const [labsGroupFilter, setLabsGroupFilter] =
        useState<LabsGroupFilterValue>('all');
    const [sortBy, setSortBy] = useState<SortValue>(
        filters?.sort === 'progress' ? 'progress-desc' : 'title-asc',
    );
    const serverCourses = useMemo(
        () => (Array.isArray(courses) ? courses : (courses.data ?? [])),
        [courses],
    );
    const serverMeta = Array.isArray(courses) ? null : courses.meta;
    const [currentPage, setCurrentPage] = useState(
        serverMeta?.current_page ?? 1,
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 250);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const catalogCourses = useMemo(() => {
        if (isLabsCatalog && serverCourses.length === 0) {
            return hardcodedCatalogCourses;
        }

        return serverCourses;
    }, [serverCourses, isLabsCatalog]);

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
                default:
                    return firstCourse.title.localeCompare(secondCourse.title);
            }
        });
    }, [
        catalogCourses,
        debouncedSearchTerm,
        enrollmentFilter,
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
            : enrollmentFilter !== 'all') ||
        (!isLabsCatalog && sortBy !== 'title-asc');

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

    const filterProps = {
        searchTerm,
        isLabsCatalog,
        enrollmentFilter,
        labsGroupFilter,
        sortBy,
        hasActiveFilters,
        clearFilters,
        resultCount: visibleCourses.length,
        isSearchSyncing,
        onSearchTermChange: (value: string) => {
            setSearchTerm(value);
            setCurrentPage(1);
        },
        onEnrollmentFilterChange: (value: EnrollmentFilterValue) => {
            setEnrollmentFilter(value);
            setCurrentPage(1);
        },
        onLabsGroupFilterChange: (value: LabsGroupFilterValue) => {
            setLabsGroupFilter(value);
            setCurrentPage(1);
        },
        onSortByChange: (value: SortValue) => {
            setSortBy(value);
            setCurrentPage(1);
        },
    };

    return (
        <>
            <Head title={headTitle} />

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>{pageTitle}</TypographyH1>
                        <TypographyMuted>{pageDescription}</TypographyMuted>
                    </div>
                    <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                        <div className="lg:hidden">
                            {sidebarMode === 'filters' ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setIsMobileFiltersOpen(true)
                                        }
                                    >
                                        <Filter className="size-4" />
                                        Filter
                                    </Button>

                                    <AlertDialog
                                        open={isMobileFiltersOpen}
                                        onOpenChange={setIsMobileFiltersOpen}
                                    >
                                        <AlertDialogContent className="w-full sm:max-w-sm">
                                            <AlertDialogHeader className="px-4">
                                                <AlertDialogTitle className="text-base">
                                                    Urutkan dan filter
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {isLabsCatalog
                                                        ? 'Perbaiki lab berdasarkan kata kunci, grup, dan mode urutan.'
                                                        : 'Perbaiki katalog Anda sebelum mendaftar atau melanjutkan.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="px-4 pb-6">
                                                <CatalogFilters
                                                    idPrefix="mobile"
                                                    {...filterProps}
                                                />
                                            </div>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            ) : (
                                <Card className="w-full sm:w-72">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Statistik
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
                </header>

                <section
                    className="animate-fade-in-up grid gap-3 lg:grid-cols-[300px_1fr]"
                    style={{ animationDelay: '100ms' }}
                >
                    <Card className="hidden h-fit lg:sticky lg:top-20 lg:block">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {sidebarMode === 'filters'
                                    ? 'Urutkan dan Filter'
                                    : 'Statistik'}
                            </CardTitle>
                            <CardDescription>
                                {sidebarMode === 'filters'
                                    ? isLabsCatalog
                                        ? 'Perbaiki lab Anda berdasarkan kata kunci, grup algoritma, dan mode urutan.'
                                        : 'Fokuskan jalur pembelajaran Anda berdasarkan kata kunci, status, dan mode urutan.'
                                    : 'Ringkasan cepat untuk halaman ini.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sidebarMode === 'filters' ? (
                                <CatalogFilters
                                    idPrefix="desktop"
                                    {...filterProps}
                                />
                            ) : (
                                <CatalogStatistics statistics={statistics} />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4">
                        {!hasPublishedCourses && isLabsCatalog && (
                            <EmptyLabCatalogGrid
                                courses={hardcodedCatalogCourses}
                                isLabsCatalog={isLabsCatalog}
                            />
                        )}

                        {!hasPublishedCourses && !isLabsCatalog && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Belum Ada Kursus yang Dipublikasikan
                                    </CardTitle>
                                    <CardDescription>
                                        Kembali lagi nanti atau minta admin
                                        untuk mempublikasikan jalur
                                        pembelajaran.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}

                        {hasPublishedCourses && isSearchSyncing && (
                            <CourseSkeletonGrid />
                        )}

                        {hasPublishedCourses &&
                            !isSearchSyncing &&
                            !hasVisibleCourses && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Tidak Ada Kursus yang Cocok
                                        </CardTitle>
                                        <CardDescription>
                                            Perluas pencarian Anda atau atur
                                            ulang filter untuk menampilkan lebih
                                            banyak jalur.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={clearFilters}
                                        >
                                            Atur Ulang Filter
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                        {hasPublishedCourses &&
                            !isSearchSyncing &&
                            hasVisibleCourses && (
                                <CourseCardGrid
                                    courses={paginatedCourses}
                                    isLabsCatalog={isLabsCatalog}
                                />
                            )}
                    </div>
                </section>

                {hasPublishedCourses &&
                    !isSearchSyncing &&
                    hasVisibleCourses && (
                        <div
                            className="animate-fade-in-up flex items-center justify-between gap-4"
                            style={{ animationDelay: '200ms' }}
                        >
                            <p className="shrink-0 text-sm text-muted-foreground">
                                Menampilkan{' '}
                                {(activePage - 1) * COURSES_PER_PAGE + 1} -{' '}
                                {Math.min(
                                    activePage * COURSES_PER_PAGE,
                                    visibleCourses.length,
                                )}{' '}
                                dari {visibleCourses.length}{' '}
                                {isLabsCatalog ? 'lab' : 'kursus'}
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
            title: 'Beranda',
            href: dashboard(),
        },
        {
            title: 'Kursus',
            href: coursesIndex(),
        },
    ],
};
