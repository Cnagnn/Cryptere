import {
    CheckCircle2,
    Lock,
    Trophy,
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type TaskType = 'video' | 'read' | 'quiz';

type LessonTask = {
    id: number;
    type: TaskType;
    title: string;
    isCompleted: boolean;
    [key: string]: unknown;
};

type LessonData = {
    id: number;
    title: string;
    tasks: LessonTask[];
    [key: string]: unknown;
};

type AssessmentData = {
    id: number;
    title: string;
    passed: boolean;
    [key: string]: unknown;
};

type CourseTaskPanelProps = {
    lessons: LessonData[];
    assessments: AssessmentData[];
    activeMode: 'task' | 'assessment';
    selectedLessonId: number | null;
    selectedTaskId: number | null;
    selectedAssessmentId: number | null;
    completedCount: number;
    totalTasks: number;
    assessmentsPassed: number;
    completedLessonIds: number[];
    unlockedLessonIds: Map<number, boolean>;
    openOutlineItem: string | undefined;
    progressPercentage: number;
    selectTask: (lesson: LessonData, task: LessonTask) => void;
    selectAssessment: (assessment: AssessmentData) => void;
    setOpenOutlineItem: (value: string | undefined) => void;
};

export function CourseTaskPanel({
    lessons,
    assessments,
    activeMode,
    selectedLessonId,
    selectedTaskId,
    selectedAssessmentId,
    completedCount,
    totalTasks,
    assessmentsPassed,
    completedLessonIds,
    unlockedLessonIds,
    openOutlineItem,
    progressPercentage,
    selectTask,
    selectAssessment,
    setOpenOutlineItem,
}: CourseTaskPanelProps) {
    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border bg-background lg:sticky lg:top-20 lg:h-fit">
            <div className="border-b px-4 py-4 sm:px-5">
                <h2 className="text-base font-semibold">Kontrol Belajar</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {completedCount}/{lessons.length} materi selesai •{' '}
                    {totalTasks} tugas
                </p>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium tabular-nums">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>

                <Accordion
                    type="single"
                    collapsible
                    value={openOutlineItem}
                    onValueChange={(value) => {
                        setOpenOutlineItem(value || undefined);

                        if (!value || value === 'assessments') {
                            return;
                        }

                        const lesson = lessons.find(
                            (item) => item.id === Number(value),
                        );

                        if (lesson?.tasks[0]) {
                            selectTask(lesson, lesson.tasks[0]);
                        }
                    }}
                    className="w-full pr-3"
                >
                    {lessons.map((lesson, index) => {
                        const locked = !(
                            unlockedLessonIds.get(lesson.id) ?? false
                        );
                        const completed = completedLessonIds.includes(
                            lesson.id,
                        );
                        const completedTasks = lesson.tasks.filter(
                            (task) => task.isCompleted,
                        ).length;

                        return (
                            <AccordionItem
                                key={lesson.id}
                                value={String(lesson.id)}
                                className={cn(locked && 'opacity-60')}
                            >
                                <AccordionTrigger
                                    disabled={locked}
                                    className="py-3 text-left hover:no-underline [&>svg]:ml-2"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                                        <span
                                            className={cn(
                                                'flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors',
                                                completed
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : locked
                                                      ? 'border-muted bg-muted text-muted-foreground'
                                                      : 'border-sidebar-border bg-sidebar text-sidebar-foreground',
                                            )}
                                        >
                                            {locked ? (
                                                <Lock className="size-3.5" />
                                            ) : completed ? (
                                                <CheckCircle2 className="size-3.5" />
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="line-clamp-2 text-sm leading-snug font-medium">
                                                {lesson.title}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                {completedTasks}/
                                                {lesson.tasks.length} tasks
                                            </span>
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-0.5 pl-9 sm:pl-10">
                                        {lesson.tasks.map((task) => {
                                            const active =
                                                activeMode === 'task' &&
                                                selectedLessonId ===
                                                    lesson.id &&
                                                selectedTaskId === task.id;

                                            return (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    onClick={() =>
                                                        selectTask(lesson, task)
                                                    }
                                                    className={cn(
                                                        'group flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm transition-colors',
                                                        active
                                                            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                                            task.isCompleted
                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                : active
                                                                  ? 'border-sidebar-accent-foreground/50'
                                                                  : 'border-sidebar-border',
                                                        )}
                                                    >
                                                        {task.isCompleted ? (
                                                            <CheckCircle2 className="size-2.5" />
                                                        ) : null}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate leading-snug">
                                                        {task.title}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}

                    {assessments.length > 0 ? (
                        <AccordionItem value="assessments">
                            <AccordionTrigger className="py-3 text-left hover:no-underline [&>svg]:ml-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-amber-600">
                                        <Trophy className="size-3.5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 text-sm leading-snug font-medium">
                                            Assessments
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {assessmentsPassed}/
                                            {assessments.length} passed
                                        </span>
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-0.5 pl-9 sm:pl-10">
                                    {assessments.map((assessment) => {
                                        const active =
                                            activeMode === 'assessment' &&
                                            selectedAssessmentId ===
                                                assessment.id;

                                        return (
                                            <button
                                                key={assessment.id}
                                                type="button"
                                                onClick={() =>
                                                    selectAssessment(assessment)
                                                }
                                                className={cn(
                                                    'flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm transition-colors',
                                                    active
                                                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                                        assessment.passed
                                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                                            : active
                                                              ? 'border-sidebar-accent-foreground/50'
                                                              : 'border-sidebar-border',
                                                    )}
                                                >
                                                    {assessment.passed ? (
                                                        <CheckCircle2 className="size-2.5" />
                                                    ) : null}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate leading-snug">
                                                    {assessment.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ) : null}
                </Accordion>
            </div>
        </div>
    );
}
