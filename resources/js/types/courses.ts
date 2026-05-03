// ── Course Catalog Page Types ──

export type CourseCard = {
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
    timeStart?: string | null;
    timeEnd?: string | null;
    status?: 'upcoming' | 'active' | 'ended';
    isSolved?: boolean;
    hasCompletedSession?: boolean;
    hasQuestionBank?: boolean;
    questionsCount?: number;
    bestScore?: number;
};

export type SortValue = 'title-asc' | 'progress-desc';

export type EnrollmentFilterValue = 'all' | 'enrolled' | 'not-enrolled';

export type LabsGroupFilterValue =
    | 'all'
    | 'classical'
    | 'symmetric'
    | 'asymmetric'
    | 'hashing'
    | 'signature';

export type CatalogFiltersProps = {
    idPrefix: string;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    isLabsCatalog: boolean;
    enrollmentFilter: EnrollmentFilterValue;
    onEnrollmentFilterChange: (value: EnrollmentFilterValue) => void;
    labsGroupFilter: LabsGroupFilterValue;
    onLabsGroupFilterChange: (value: LabsGroupFilterValue) => void;
    sortBy: SortValue;
    onSortByChange: (value: SortValue) => void;
    hasActiveFilters: boolean;
    clearFilters: () => void;
    resultCount: number;
};

export type CoursesIndexProps = {
    courses: CourseCard[];
    catalogMode?: 'learning' | 'labs';
    sidebarMode?: 'filters' | 'statistics';
    statistics?: Array<{
        label: string;
        value: string;
    }>;
    pageTitle?: string;
    pageDescription?: string;
    headTitle?: string;
};
