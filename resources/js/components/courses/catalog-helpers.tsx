import { BookOpenCheck, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    CatalogFiltersProps,
    CountdownParts,
    CourseCard,
    EnrollmentFilterValue,
    LabsGroupFilterValue,
    SortValue,
} from '@/types/courses';

/* ── Countdown helper ── */
export function getCountdownParts(
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

/* ── Course Thumbnail ── */
export function CourseThumbnail({ title }: { title: string }) {
    return (
        <div className="relative aspect-video overflow-hidden border-b bg-muted/40">
            <div className="flex h-full w-full items-center justify-center">
                <BookOpenCheck
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                />
                <span className="sr-only">{title} thumbnail</span>
            </div>
        </div>
    );
}

/* ── Hardcoded lab catalog courses ── */
export const hardcodedCatalogCourses: CourseCard[] = [
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

/* ── Catalog Filters ── */
export function CatalogFilters({
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
    resultCount,
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
                        placeholder="Search..."
                        className="pr-24 pl-8"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                        {resultCount} Result
                    </span>
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
        </div>
    );
}

/* ── Catalog Statistics ── */
export function CatalogStatistics({
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
