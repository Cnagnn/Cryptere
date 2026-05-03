import { Form, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

import { CourseThumbnail } from '@/components/courses/catalog-helpers';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { enroll, reset as resetCourseProgress, show } from '@/routes/courses';
import { show as showLab } from '@/routes/labs';
import type { CourseCard } from '@/types/courses';

/* ── Skeleton Grid ── */
export function CourseSkeletonGrid() {
    return (
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
    );
}

/* ── Course Card Grid ── */
export function CourseCardGrid({
    courses,
    isLabsCatalog,
}: {
    courses: CourseCard[];
    isLabsCatalog: boolean;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    className="relative flex h-full flex-col overflow-hidden pt-0"
                >
                    <CourseThumbnail title={course.title} />

                    <CardHeader>
                        <CardTitle className="text-xl leading-tight tracking-tight">
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
                            <Form
                                className="w-full"
                                {...enroll.form({ course: course.slug })}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        {processing && (
                                            <Spinner className="size-4" />
                                        )}
                                        {processing
                                            ? 'Mendaftar...'
                                            : 'Daftar sekarang'}
                                    </Button>
                                )}
                            </Form>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

/* ── Enrolled Card Footer ── */
function EnrolledCardFooter({ course }: { course: CourseCard }) {
    const progressPercentage = course.progressPercentage ?? 0;

    return (
        <>
            <Form
                className="w-full"
                {...resetCourseProgress.form({ course: course.slug })}
            >
                {({ processing }) => (
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={processing || progressPercentage === 0}
                        className="w-full"
                    >
                        {processing && <Spinner className="size-4" />}
                        {processing ? 'Mengatur ulang...' : 'Mulai Ulang'}
                    </Button>
                )}
            </Form>

            <Button asChild className="w-full">
                <Link href={show({ course: course.slug })} prefetch>
                    Lanjutkan
                    <ArrowRight className="size-4" />
                </Link>
            </Button>
        </>
    );
}

/* ── Empty Lab Catalog Grid ── */
export function EmptyLabCatalogGrid({
    courses,
    isLabsCatalog,
}: {
    courses: CourseCard[];
    isLabsCatalog: boolean;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <CardHeader className="flex flex-col gap-4">
                        <CourseThumbnail title={course.title} />

                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-xl leading-tight tracking-tight">
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
