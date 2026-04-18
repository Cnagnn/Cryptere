import { Head, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CourseFormDialog } from '@/components/course-form-dialog';
import { LessonFormSheet } from '@/components/course-lesson-form-sheet';
import { LessonTable } from '@/components/course-lesson-table';
import { CourseTable } from '@/components/course-table';
import { TaskFormSheet } from '@/components/course-task-form-sheet';
import { TaskTable } from '@/components/course-task-table';
import type {
    ComboboxOption,
    CourseRow,
    LessonRow,
    Paginated,
    TaskRow,
} from '@/components/course-types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    destroy as coursesDestroy,
    index as adminCoursesIndex,
} from '@/routes/admin/courses';
import { destroy as lessonsDestroy } from '@/routes/admin/courses/lessons';
import { destroy as tasksDestroy } from '@/routes/admin/courses/tasks';

type Section = 'catalog' | 'lesson' | 'task';

type Props = {
    section: Section;
    courses: Paginated<CourseRow>;
    courseOptions: Array<{ id: number; slug: string; title: string }>;
    lessons: LessonRow[];
    tasks: TaskRow[];
    selectedCourseId: number;
    selectedLessonId: number;
    filters: {
        search: string;
    };
};

export default function AdminCoursesIndex({
    section,
    courses,
    courseOptions,
    lessons,
    tasks,
    selectedCourseId,
    selectedLessonId,
    filters,
}: Props) {
    const [activeSection, setActiveSection] = useState<Section>(section);
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
    const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null);

    const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonRow | null>(null);
    const [deletingLesson, setDeletingLesson] = useState<LessonRow | null>(null);

    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
    const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);

    const [courseFilterValue, setCourseFilterValue] = useState('');
    const [lessonFilterValue, setLessonFilterValue] = useState('');
    const [taskFilterValue, setTaskFilterValue] = useState('');

    const hasInitializedAutoSearch = useRef(false);

    useEffect(() => {
        setActiveSection(section);
    }, [section]);

    useEffect(() => {
        setSearchInput(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if (!hasInitializedAutoSearch.current) {
            hasInitializedAutoSearch.current = true;

            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                adminCoursesIndex.url({
                    query: {
                        section: activeSection,
                        search: searchInput.trim() || undefined,
                        course_id: selectedCourseId > 0 ? selectedCourseId : undefined,
                        lesson_id: selectedLessonId > 0 ? selectedLessonId : undefined,
                    },
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [activeSection, searchInput, selectedCourseId, selectedLessonId]);

    const lessonOptions = useMemo<ComboboxOption[]>(() => {
        return lessons.map((lesson) => ({
            value: String(lesson.id),
            label: lesson.course_title
                ? `${lesson.course_title} - ${lesson.title}`
                : lesson.title,
        }));
    }, [lessons]);

    const courseComboboxOptions = useMemo<ComboboxOption[]>(() => {
        return courseOptions.map((course) => ({
            value: String(course.id),
            label: course.title,
        }));
    }, [courseOptions]);

    const submitDeleteCourse = () => {
        if (!deletingCourse) {
            return;
        }

        router.delete(coursesDestroy.url({ course: deletingCourse.id }), {
            preserveScroll: true,
            onSuccess: () => setDeletingCourse(null),
        });
    };

    const submitDeleteLesson = () => {
        if (!deletingLesson) {
            return;
        }

        router.delete(lessonsDestroy.url({ lesson: deletingLesson.id }), {
            preserveScroll: true,
            onSuccess: () => setDeletingLesson(null),
        });
    };

    const submitDeleteTask = () => {
        if (!deletingTask || deletingTask.id === 0) {
            return;
        }

        router.delete(tasksDestroy.url({ task: deletingTask.id }), {
            preserveScroll: true,
            onSuccess: () => setDeletingTask(null),
        });
    };

    const pageTitle =
        activeSection === 'catalog'
            ? 'Course Catalog Management'
            : activeSection === 'lesson'
              ? 'Lesson Management'
              : 'Task Management';

    return (
        <>
            <Head title="Management - Courses" />

            <div className="flex flex-col gap-6 px-4 py-6">
                <header className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
                            <p className="text-sm text-muted-foreground">
                                Kelola data course, lesson, dan task dari satu halaman.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-80">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Search title"
                                    className="pl-9"
                                />
                            </div>

                            {activeSection === 'catalog' ? (
                                <Button type="button" onClick={() => setIsCreateCourseOpen(true)}>
                                    <Plus className="size-4" />
                                    New Course
                                </Button>
                            ) : null}

                            {activeSection === 'lesson' ? (
                                <Button type="button" onClick={() => setIsCreateLessonOpen(true)}>
                                    <Plus className="size-4" />
                                    New Lesson
                                </Button>
                            ) : null}

                            {activeSection === 'task' ? (
                                <Button
                                    type="button"
                                    disabled={lessonOptions.length === 0}
                                    onClick={() => setIsCreateTaskOpen(true)}
                                >
                                    <Plus className="size-4" />
                                    New Task
                                </Button>
                            ) : null}
                        </div>
                    </div>

                </header>

                {activeSection === 'catalog' ? (
                    <CourseTable
                        courses={courses}
                        filterValue={courseFilterValue}
                        onFilterChange={setCourseFilterValue}
                        onEdit={setEditingCourse}
                        onDelete={setDeletingCourse}
                    />
                ) : null}

                {activeSection === 'lesson' ? (
                    <LessonTable
                        lessons={lessons}
                        filterValue={lessonFilterValue}
                        onFilterChange={setLessonFilterValue}
                        onEdit={setEditingLesson}
                        onDelete={setDeletingLesson}
                    />
                ) : null}

                {activeSection === 'task' ? (
                    <TaskTable
                        tasks={tasks}
                        filterValue={taskFilterValue}
                        onFilterChange={setTaskFilterValue}
                        onEdit={setEditingTask}
                        onDelete={setDeletingTask}
                    />
                ) : null}
            </div>

            <CourseFormDialog
                mode="create"
                open={isCreateCourseOpen}
                onOpenChange={setIsCreateCourseOpen}
            />
            <CourseFormDialog
                mode="edit"
                open={editingCourse !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingCourse(null);
                    }
                }}
                course={editingCourse}
            />

            <LessonFormSheet
                mode="create"
                open={isCreateLessonOpen}
                onOpenChange={setIsCreateLessonOpen}
                courseOptions={courseComboboxOptions}
                selectedCourseId={selectedCourseId}
            />
            <LessonFormSheet
                mode="edit"
                open={editingLesson !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingLesson(null);
                    }
                }}
                courseOptions={courseComboboxOptions}
                selectedCourseId={selectedCourseId}
                lesson={editingLesson}
            />

            <TaskFormSheet
                mode="create"
                open={isCreateTaskOpen}
                onOpenChange={setIsCreateTaskOpen}
                lessonOptions={lessonOptions}
                selectedLessonId={selectedLessonId}
            />
            <TaskFormSheet
                mode="edit"
                open={editingTask !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingTask(null);
                    }
                }}
                lessonOptions={lessonOptions}
                selectedLessonId={selectedLessonId}
                task={editingTask}
            />

            <AlertDialog
                open={deletingCourse !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingCourse(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete course?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently remove this course and its related data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteCourse}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deletingLesson !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingLesson(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete lesson?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently remove this lesson and all tasks inside it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteLesson}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deletingTask !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingTask(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently remove this task.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteTask}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

AdminCoursesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Management',
            href: adminCoursesIndex(),
        },
        {
            title: 'Courses',
            href: adminCoursesIndex(),
        },
    ],
};
