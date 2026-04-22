import { Head } from '@inertiajs/react';
import type { CourseRow, LessonRow, Paginated, TaskRow } from '@/components/course-types';
import { dashboard } from '@/routes';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import AdminCoursesTask from './task';
import AdminCoursesTitle from './title';
import AdminCoursesTopic from './topic';

type Props = {
    section: 'catalog' | 'lesson' | 'task';
    courses: Paginated<CourseRow>;
    courseOptions: Array<Pick<CourseRow, 'id' | 'title'>>;
    lessons: Paginated<LessonRow>;
    tasks: Paginated<TaskRow>;
    selectedCourseId: number;
    selectedLessonId: number;
    filters: {
        search: string;
    };
};

export default function AdminCoursesIndex(props: Props) {
    return (
        <>
            <Head title="Management - Courses" />

            {props.section === 'lesson' ? (
                <AdminCoursesTopic
                    lessons={props.lessons}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
                />
            ) : null}

            {props.section === 'task' ? (
                <AdminCoursesTask
                    tasks={props.tasks}
                    lessons={props.lessons}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
                    selectedLessonId={props.selectedLessonId}
                />
            ) : null}

            {props.section === 'catalog' ? (
                <AdminCoursesTitle courses={props.courses} />
            ) : null}
        </>
    );
}

AdminCoursesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
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
