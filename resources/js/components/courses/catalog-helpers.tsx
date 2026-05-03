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
    CourseCard,
    EnrollmentFilterValue,
    LabsGroupFilterValue,
    SortValue,
} from '@/types/courses';

/* ── Course Thumbnail ── */
export function CourseThumbnail({ title }: { title: string }) {
    return (
        <div className="relative aspect-video overflow-hidden border-b bg-muted/40">
            <div className="flex h-full w-full items-center justify-center">
                <BookOpenCheck
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                />
                <span className="sr-only">Gambar mini {title}</span>
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
        id: 9005,
        slug: 'sha-lab',
        title: 'SHA',
        summary:
            'Simulasikan hashing satu arah untuk memeriksa efek avalanche dan integritas data.',
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
            'Demonstrasikan alur tanda tangan digital untuk autentikasi, integritas, dan non-repudiasi.',
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
                <Label htmlFor={`${idPrefix}-search`}>Cari</Label>
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id={`${idPrefix}-search`}
                        value={searchTerm}
                        onChange={(event) =>
                            onSearchTermChange(event.target.value)
                        }
                        placeholder="Cari..."
                        className="pr-24 pl-8"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                        {resultCount} Hasil
                    </span>
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
                            <SelectItem value="hashing">Hashing</SelectItem>
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
