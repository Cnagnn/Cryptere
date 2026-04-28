import { Head } from '@inertiajs/react';
import { Filter, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import {
    CatalogFilters,
    CatalogStatistics,
    hardcodedCatalogCourses,
} from '@/components/courses/catalog-helpers';
import {
    CourseCardGrid,
    CourseSkeletonGrid,
    EmptyLabCatalogGrid,
} from '@/components/courses/course-card-grid';
import { dashboard } from '@/routes';
import { index as coursesIndex } from '@/routes/courses';
import type {
    CoursesIndexProps,
    EnrollmentFilterValue,
    LabsGroupFilterValue,
    SortValue,
} from '@/types/courses';

const COURSES_PER_PAGE = 4;

export default function CoursesIndex({
    courses,
    catalogMode = 'learning',
    sidebarMode = 'filters',
    statistics = [],
    pageTitle = 'Courses',
    pageDescription = 'Browse learning tracks, filter results, and continue your progress in one place.',
    headTitle = 'Courses',
}: CoursesIndexProps) {
    const isLabsCatalog = catalogMode === 'labs';
    const isChallengesCatalog = catalogMode === 'challenges';
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
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

    const activeFilterChips = [
        searchTerm.trim().length > 0
            ? {
                  key: 'search',
                  label: `Search: ${searchTerm.trim()}`,
                  onClear: () => setSearchTerm(''),
              }
            : null,
    ].filter(
        (chip): chip is { key: string; label: string; onClear: () => void } =>
            chip !== null,
    );

    const activeFilterCount = activeFilterChips.length;

    const filterProps = {
        searchTerm,
        isLabsCatalog,
        isChallengesCatalog,
        enrollmentFilter,
        labsGroupFilter,
        sortBy,
        hasActiveFilters,
        clearFilters,
        resultCount: visibleCourses.length,
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

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <div className="animate-fade-in-up flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>{pageTitle}</TypographyH1>
                        <TypographyMuted>{pageDescription}</TypographyMuted>
                    </div>

                    <div className="flex items-center justify-end gap-2">
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

                                    <AlertDialog
                                        open={isMobileFiltersOpen}
                                        onOpenChange={setIsMobileFiltersOpen}
                                    >
                                        <AlertDialogContent className="w-full sm:max-w-sm">
                                            <AlertDialogHeader className="px-4">
                                                <AlertDialogTitle className="text-base">
                                                    Sort and filter
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {isLabsCatalog
                                                        ? 'Refine labs by keyword, group, and sort mode.'
                                                        : isChallengesCatalog
                                                          ? 'Refine challenge cards by keyword and availability.'
                                                          : 'Refine your catalog before you enroll or continue.'}
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

                <section
                    className="animate-fade-in-up grid gap-6 lg:grid-cols-[300px_1fr]"
                    style={{ animationDelay: '100ms' }}
                >
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
                                    {...filterProps}
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
                            <EmptyLabCatalogGrid
                                courses={hardcodedCatalogCourses}
                                isLabsCatalog={isLabsCatalog}
                                isChallengesCatalog={isChallengesCatalog}
                            />
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
                            <CourseSkeletonGrid />
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
                                <CourseCardGrid
                                    courses={paginatedCourses}
                                    isLabsCatalog={isLabsCatalog}
                                    isChallengesCatalog={isChallengesCatalog}
                                    nowMs={nowMs}
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
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Courses',
            href: coursesIndex(),
        },
    ],
};
