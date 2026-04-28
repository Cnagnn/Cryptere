import { Form, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

import { CourseThumbnail, getCountdownParts } from '@/components/courses/catalog-helpers';
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
import { show as showChallenge } from '@/routes/challenges';
import {
    enroll,
    reset as resetCourseProgress,
    show,
} from '@/routes/courses';
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
                <Card key={`course-skeleton-${index}`} className="overflow-hidden">
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
    isChallengesCatalog,
    nowMs,
}: {
    courses: CourseCard[];
    isLabsCatalog: boolean;
    isChallengesCatalog: boolean;
    nowMs: number;
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

                    {!isLabsCatalog && !isChallengesCatalog ? (
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
                                    const countdown = getCountdownParts(
                                        course.timeEnd ?? null,
                                        nowMs,
                                    );

                                    return (
                                        <p className="text-sm text-muted-foreground">
                                            {course.status === 'upcoming'
                                                ? course.timeStart
                                                    ? `Starts at ${new Date(course.timeStart).toLocaleString('en-US')}`
                                                    : 'Challenge will start soon.'
                                                : course.status === 'ended'
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
                            isLabsCatalog || isChallengesCatalog
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
                                    Open simulation
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        ) : isChallengesCatalog ? (
                            <ChallengeCardFooter course={course} />
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
    );
}

/* ── Challenge Card Footer ── */
function ChallengeCardFooter({ course }: { course: CourseCard }) {
    const isActive = course.status === 'active';
    const isUpcoming = course.status === 'upcoming';
    const isCompleted = course.hasCompletedSession === true;
    const label = isCompleted
        ? 'View result'
        : isActive
          ? 'Start challenge'
          : isUpcoming
            ? 'View details'
            : 'View results';
    const variant = isActive && !isCompleted ? 'default' : 'outline';
    const href =
        isActive && !isCompleted
            ? showChallenge(
                  { challenge: course.slug },
                  { query: { autostart: '1' } },
              )
            : showChallenge({ challenge: course.slug });

    return (
        <Button asChild type="button" variant={variant} className="w-full">
            <Link href={href} prefetch>
                {label}
                <ArrowRight className="size-4" />
            </Link>
        </Button>
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
                        {processing ? 'Resetting...' : 'Start Over'}
                    </Button>
                )}
            </Form>

            <Button asChild className="w-full">
                <Link href={show({ course: course.slug })} prefetch>
                    Continue
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
    isChallengesCatalog,
}: {
    courses: CourseCard[];
    isLabsCatalog: boolean;
    isChallengesCatalog: boolean;
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

                    {!isLabsCatalog && !isChallengesCatalog ? (
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Not enrolled yet</span>
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
    );
}
